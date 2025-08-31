import React, { useState, useEffect, useCallback } from 'react';
import { useTranslate } from '../contexts/TranslationContext';
import { XIcon } from './icons/XIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { TrashIcon } from './icons/TrashIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import type { ModelSimulationGuide, ModelSimulationScenario, LearningModule } from '../types';
import { Type } from '@google/genai';
import { generateContent } from '../services/aiService';

interface SimulationGuideEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (guideData: ModelSimulationGuide) => void;
  existingGuide: ModelSimulationGuide | null;
  forModule: LearningModule;
}

const SimulationGuideEditModal: React.FC<SimulationGuideEditModalProps> = ({ isOpen, onClose, onSave, existingGuide, forModule }) => {
  const { translate } = useTranslate();
  const [scenarios, setScenarios] = useState<ModelSimulationScenario[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (existingGuide) {
        setScenarios(JSON.parse(JSON.stringify(existingGuide.scenarios))); // Deep copy
      } else {
        setScenarios([]);
      }
      setError(null);
    }
  }, [isOpen, existingGuide]);
  
  const generateAiSuggestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const moduleContext = forModule.content.map(c => {
        if (c.type === 'heading' || c.type === 'paragraph') return c.content;
        if (c.type === 'list') return (c.content as string[]).join(', ');
        return '';
    }).join('\n');

    const prompt = `You are an expert in curriculum design for disaster preparedness. Your task is to generate a model simulation guide for the learning module titled "${forModule.title}". This guide is for teachers to understand the types of questions students might face in their AI-powered simulations.
**Learning Module Content:**
---
${moduleContext}
---
**YOUR TASK:** Based on the provided Learning Module Content, create a list of 3 diverse and challenging simulation scenarios. Include a mix of multiple-choice and short-answer questions.
**REQUIREMENTS:**
- The scenarios must test critical thinking and application of the module's safety principles.
- For multiple-choice questions, provide 3-4 plausible choices and clearly indicate the correct one.
- For short-answer questions, provide an ideal "model answer" that demonstrates a full understanding of the concepts, formatted with markdown.
- The entire output **MUST** be a single, valid JSON object with no other text or markdown.
**JSON Schema:** The root object must have a single key "scenarios", which is an array of scenario objects. Each scenario object must have: "scenarioText", "type" (either "multiple-choice" or "short-answer"), "choices" (an array of strings), "correctAnswer" (string), "modelAnswer" (string).`;
    
    try {
      const response = await generateContent({
        model: 'gemini-2.5-flash', contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scenarios: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    scenarioText: { type: Type.STRING }, type: { type: Type.STRING },
                    choices: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING }, modelAnswer: { type: Type.STRING },
                  },
                  required: ["scenarioText", "type", "choices", "correctAnswer", "modelAnswer"]
                }
              }
            },
            required: ["scenarios"]
          }
        }
      });
      const guide = JSON.parse(response.text.trim()) as { scenarios: ModelSimulationScenario[] };
      setScenarios(guide.scenarios);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [forModule]);

  if (!isOpen) return null;

  const handleScenarioChange = (sIndex: number, field: keyof ModelSimulationScenario, value: any) => {
    setScenarios(prev => {
        const newScenarios = [...prev];
        (newScenarios[sIndex] as any)[field] = value;
        return newScenarios;
    });
  };
  
  const handleChoiceChange = (sIndex: number, cIndex: number, value: string) => {
    setScenarios(prev => {
        const newScenarios = [...prev];
        if (newScenarios[sIndex].choices) {
            newScenarios[sIndex].choices![cIndex] = value;
        }
        return newScenarios;
    });
  }

  const addScenario = () => {
    setScenarios(prev => [...prev, { scenarioText: '', type: 'multiple-choice', choices: ['', ''], correctAnswer: '', modelAnswer: '' }]);
  };
  const removeScenario = (sIndex: number) => {
    setScenarios(prev => prev.filter((_, i) => i !== sIndex));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ moduleId: forModule.id, scenarios });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col h-[90vh]">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {translate('Edit Simulation Guide')} for "{translate(forModule.title)}"
              </h2>
              <button type="button" onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label={translate('Close')}>
                <XIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 p-3 bg-teal-50 dark:bg-teal-900/50 rounded-lg">
                <p className="text-sm text-teal-800 dark:text-teal-200">{translate("Don't know where to start? Let AI generate suggestions for you.")}</p>
                <button type="button" onClick={generateAiSuggestions} disabled={isLoading} className="flex items-center gap-2 bg-teal-600 text-white font-bold py-2 px-4 rounded-full hover:bg-teal-700 disabled:opacity-50 transition-colors">
                    <LightbulbIcon className="h-5 w-5"/>
                    {isLoading ? translate('Generating...') : translate('Generate AI Suggestions')}
                </button>
            </div>
            {error && <div className="p-3 text-red-800 bg-red-100 dark:text-red-200 dark:bg-red-900/50 rounded-lg">{error}</div>}

            {scenarios.map((scenario, sIndex) => (
              <div key={sIndex} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-start gap-2">
                    <textarea value={scenario.scenarioText} onChange={e => handleScenarioChange(sIndex, 'scenarioText', e.target.value)} placeholder={`${translate('Scenario')} ${sIndex + 1}`} required rows={3} className="w-full font-semibold input-style"/>
                    <button type="button" onClick={() => removeScenario(sIndex)} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><TrashIcon className="h-5 w-5"/></button>
                </div>
                <div className="mt-3">
                    <select value={scenario.type} onChange={e => handleScenarioChange(sIndex, 'type', e.target.value)} className="input-style text-sm">
                        <option value="multiple-choice">{translate('Multiple Choice')}</option>
                        <option value="short-answer">{translate('Short Answer')}</option>
                    </select>
                </div>
                <div className="mt-3 pl-4 border-l-2 border-gray-300 dark:border-gray-500">
                    {scenario.type === 'multiple-choice' ? (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">{translate('Choices & Correct Answer')}</p>
                            {scenario.choices?.map((choice, cIndex) => (
                                <div key={cIndex} className="flex items-center gap-2">
                                    <input type="radio" name={`correct-ans-${sIndex}`} checked={choice === scenario.correctAnswer} onChange={() => handleScenarioChange(sIndex, 'correctAnswer', choice)} className="h-4 w-4 text-teal-600" />
                                    <input type="text" value={choice} onChange={e => handleChoiceChange(sIndex, cIndex, e.target.value)} placeholder={`${translate('Choice')} ${cIndex + 1}`} required className="w-full text-sm input-style"/>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div>
                            <label className="text-sm font-medium">{translate('Model Answer')}</label>
                            <textarea value={scenario.modelAnswer} onChange={e => handleScenarioChange(sIndex, 'modelAnswer', e.target.value)} placeholder={translate('Ideal response...')} required rows={4} className="mt-1 w-full text-sm input-style"/>
                        </div>
                    )}
                </div>
              </div>
            ))}
            <button type="button" onClick={addScenario} className="w-full text-center py-2 text-sm font-semibold text-teal-600 border-2 border-dashed border-gray-300 rounded-lg hover:border-teal-500 hover:bg-teal-50 dark:border-gray-600 dark:hover:border-teal-400 dark:text-teal-400 dark:hover:bg-teal-900/50">
                <PlusCircleIcon className="inline-block h-5 w-5 mr-1 align-text-bottom"/> {translate('Add Scenario')}
            </button>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl flex justify-end items-center gap-3 flex-shrink-0">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-full hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors">
              {translate('Cancel')}
            </button>
            <button type="submit" className="bg-teal-600 text-white font-bold py-2 px-4 rounded-full hover:bg-teal-700 transition-colors">
              {existingGuide ? translate('Save Guide') : translate('Create Guide')}
            </button>
          </div>
        </form>
        <style>{`.input-style { @apply px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-gray-200; }`}</style>
      </div>
    </div>
  );
};

export default SimulationGuideEditModal;
