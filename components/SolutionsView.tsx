import React, { useState, useCallback, useEffect } from 'react';
import { Type } from '@google/genai';
import type { LearningModule, Quiz, User, ModelSimulationGuide, ModelSimulationScenario } from '../types';
import { UserRole } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS, type TTSText } from '../contexts/TTSContext';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { generateContent } from '../services/aiService';

interface SolutionsViewProps {
  currentUser: User | null;
  modules: LearningModule[];
  quizzes: Quiz[];
  simulationGuides: Record<string, ModelSimulationGuide>;
  onBack: () => void;
  onOpenQuizEditor: (forModule: LearningModule) => void;
  onOpenGuideEditor: (forModule: LearningModule) => void;
  onDisableLab: (moduleId: string) => void;
}

interface Explanation {
  explanation: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}

const safeMarkdownToHTML = (text: string | undefined | null): string => {
    if (!text) return '';
    const escapedText = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    const blocks = escapedText.split(/(\r?\n){2,}/);

    const htmlBlocks = blocks.map(block => {
        if (!block || block.trim() === '') return '';
        const lines = block.trim().split(/\r?\n/);
        if (lines.every(line => /^\s*[-*]\s/.test(line))) {
            const listItems = lines.map(line => `<li>${line.replace(/^\s*[-*]\s+/, '')}</li>`).join('');
            return `<ul class="list-disc list-inside space-y-1">${listItems}</ul>`;
        }
        if (lines.every(line => /^\s*\d+\.\s/.test(line))) {
            const listItems = lines.map(line => `<li>${line.replace(/^\s*\d+\.\s+/, '')}</li>`).join('');
            return `<ol class="list-decimal list-inside space-y-1">${listItems}</ul>`;
        }
        return `<p>${block.replace(/\r?\n/g, '<br />')}</p>`;
    });

    let finalHtml = htmlBlocks.join('');
    finalHtml = finalHtml.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
    return finalHtml;
};

const SolutionsView: React.FC<SolutionsViewProps> = ({ currentUser, modules, quizzes, simulationGuides, onBack, onOpenQuizEditor, onOpenGuideEditor, onDisableLab }) => {
  const [openModuleId, setOpenModuleId] = useState<string | null>(null);
  const [quizExplanations, setQuizExplanations] = useState<Record<string, { explanations: Record<string, Explanation>; isLoading: boolean; error?: string }>>({});
  const { translate } = useTranslate();
  const { registerTexts, currentlySpokenId } = useTTS();
  const isOfficial = currentUser?.role === UserRole.GOVERNMENT_OFFICIAL;
  
  // Effect to register texts for TTS
  useEffect(() => {
    const textsToRead: TTSText[] = [];
    
    textsToRead.push({ id: 'solutions-view-header', text: translate('Answer Key & Guides') });
    textsToRead.push({ id: 'solutions-view-subheader', text: translate('Review quiz answers and ideal simulation responses for each module. (For Teacher Use Only)') });

    modules.forEach(module => {
        textsToRead.push({ id: `module-accordion-button-${module.id}`, text: translate(module.title) });
        const isOpen = openModuleId === module.id;
        if (isOpen) {
            const quiz = quizzes.find(q => q.moduleId === module.id);
            if (quiz) {
                textsToRead.push({ id: `quiz-answers-header-${module.id}`, text: translate('Quiz Answers') });
                quiz.questions.forEach((q, index) => {
                    textsToRead.push({ id: `q-${q.id}-text`, text: `${index + 1}. ${translate(q.questionText)}` });
                    q.options.forEach((option, optIndex) => {
                        textsToRead.push({ id: `q-${q.id}-opt-${optIndex}`, text: translate(option) });
                    });
                    const explanation = quizExplanations[module.id]?.explanations[q.id]?.explanation;
                    if (explanation) {
                        textsToRead.push({ id: `q-${q.id}-explanation`, text: `${translate('Explanation')}: ${translate(explanation)}` });
                    }
                });
            }
            
            textsToRead.push({ id: `model-response-header-${module.id}`, text: translate('Model Simulation Guide') });
            const modelGuide = simulationGuides[module.id];
            if (modelGuide) {
                modelGuide.scenarios.forEach((scenario, index) => {
                    textsToRead.push({ id: `model-sim-${module.id}-q${index}`, text: `${translate('Scenario')} ${index + 1}: ${translate(scenario.scenarioText)}`});
                    if (scenario.type === 'multiple-choice') {
                         textsToRead.push({ id: `model-sim-${module.id}-choices-label-${index}`, text: translate('Choices')});
                         scenario.choices?.forEach((choice, choiceIndex) => {
                            textsToRead.push({ id: `model-sim-${module.id}-choice-${index}-${choiceIndex}`, text: translate(choice)});
                         });
                        textsToRead.push({ id: `model-sim-${module.id}-a${index}`, text: `${translate('Correct Answer')}: ${translate(scenario.correctAnswer || '')}`});
                    } else {
                        textsToRead.push({ id: `model-sim-${module.id}-a${index}`, text: `${translate('Model Answer')}: ${translate(scenario.modelAnswer || '')}`});
                    }
                });
            }
        }
    });

    registerTexts(textsToRead);
    
  }, [modules, quizzes, openModuleId, simulationGuides, quizExplanations, registerTexts, translate]);

  const fetchQuizExplanations = useCallback(async (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    const quiz = quizzes.find(q => q.moduleId === moduleId);
    if (!module || !quiz) return;

    setQuizExplanations(prev => ({ ...prev, [moduleId]: { explanations: {}, isLoading: true } }));
    
    const moduleContextForAI = JSON.stringify(module.content, null, 2);
    const simplifiedQuiz = {
        title: quiz.title,
        questions: quiz.questions.map(q => ({
            id: q.id,
            question: q.questionText,
            options: q.options,
            correctAnswer: q.options[q.correctOptionIndex]
        }))
    };

    const prompt = `You are a helpful teaching assistant. For EACH question in the provided quiz, generate a brief explanation for why the correct answer is correct. 
Your explanation MUST reference the provided learning module content and be formatted with markdown (e.g., **bolding**, lists) for readability.
If a specific image or video from the module content is highly relevant to explaining an answer, you may include its URL and type ("image" or "video").
Respond ONLY with a valid JSON object where keys are the question IDs (e.g., "q1-1") and values are objects containing the explanation and optional media details.
---
QUIZ: ${JSON.stringify(simplifiedQuiz, null, 2)}
---
MODULE CONTENT (including media URLs you can use):
${moduleContextForAI}
---`;

    try {
        const explanationSchema = {
            type: Type.OBJECT, properties: {
                explanation: { type: Type.STRING, description: "The textual explanation for the answer, formatted with markdown." },
                mediaUrl: { type: Type.STRING, description: "Optional URL of a relevant image or video from the module content." },
                mediaType: { type: Type.STRING, description: "Optional type of media: 'image' or 'video'." }
            }, required: ["explanation"]
        };
        const properties: Record<string, object> = {};
        quiz.questions.forEach(q => { properties[q.id] = explanationSchema; });

        const response = await generateContent({
            model: 'gemini-2.5-flash', contents: prompt,
            config: { responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: properties } }
        });
        
        const explanations = JSON.parse(response.text);
        setQuizExplanations(prev => ({ ...prev, [moduleId]: { explanations, isLoading: false } }));
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Failed to generate quiz explanations:", errorMessage);
        setQuizExplanations(prev => ({ ...prev, [moduleId]: { explanations: {}, isLoading: false, error: errorMessage } }));
    }
  }, [modules, quizzes]);


  const toggleAccordion = (moduleId: string) => {
    const newOpenModuleId = openModuleId === moduleId ? null : moduleId;
    setOpenModuleId(newOpenModuleId);

    if (newOpenModuleId) {
        if (!quizExplanations[newOpenModuleId]) {
            fetchQuizExplanations(newOpenModuleId);
        }
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 hover:underline font-semibold mb-6">
        <ArrowLeftIcon className="h-5 w-5" />
        <span>{translate('Back to Lab Dashboard')}</span>
      </button>

      <div className="mb-6">
        <h1 id="solutions-view-header" className={`text-4xl font-extrabold text-gray-800 dark:text-white ${currentlySpokenId === 'solutions-view-header' ? 'tts-highlight' : ''}`}>{translate('Answer Key & Guides')}</h1>
        <p id="solutions-view-subheader" className={`text-gray-600 dark:text-gray-400 mt-2 ${currentlySpokenId === 'solutions-view-subheader' ? 'tts-highlight' : ''}`}>{translate('Review quiz answers and ideal simulation responses for each module.')}</p>
      </div>

      <div className="space-y-4">
        {modules.filter(m => m.hasLab).map(module => {
          const quiz = quizzes.find(q => q.moduleId === module.id);
          const isOpen = openModuleId === module.id;

          return (
            <div key={module.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
              <button onClick={() => toggleAccordion(module.id)} className="w-full flex justify-between items-center p-5 text-left" aria-expanded={isOpen}>
                <h2 id={`module-accordion-button-${module.id}`} className={`text-xl font-bold text-gray-900 dark:text-white ${currentlySpokenId === `module-accordion-button-${module.id}` ? 'tts-highlight' : ''}`}>{translate(module.title)}</h2>
                <ChevronDownIcon className={`h-6 w-6 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="p-5 border-t border-gray-200 dark:border-gray-700">
                  {isOfficial && (
                    <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-wrap items-center justify-end gap-2">
                      <button onClick={() => onOpenQuizEditor(module)} className="flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-500"><PencilIcon className="h-4 w-4" />{translate('Edit Quiz')}</button>
                      <button onClick={() => onOpenGuideEditor(module)} className="flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-500"><PencilIcon className="h-4 w-4" />{translate('Edit Guide')}</button>
                      <button onClick={() => onDisableLab(module.id)} className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-500"><TrashIcon className="h-4 w-4" />{translate('Disable Lab')}</button>
                    </div>
                  )}

                  {quiz ? (
                    <>
                      <h3 id={`quiz-answers-header-${module.id}`} className={`text-lg font-semibold text-gray-800 dark:text-white mb-4 ${currentlySpokenId === `quiz-answers-header-${module.id}` ? 'tts-highlight' : ''}`}>{translate('Quiz Answers')}</h3>
                      {quizExplanations[module.id]?.error && ( <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-200 rounded-lg text-sm"> <strong>{translate('Could not load explanations:')}</strong> {quizExplanations[module.id]?.error} </div> )}
                      <div className="space-y-6">
                        {quiz.questions.map((q, index) => {
                          const explanationData = quizExplanations[module.id]?.explanations[q.id];
                          return (
                          <div key={q.id}>
                            <p id={`q-${q.id}-text`} className={`font-semibold text-gray-700 dark:text-gray-300 ${currentlySpokenId === `q-${q.id}-text` ? 'tts-highlight' : ''}`}>{index + 1}. {translate(q.questionText)}</p>
                            <ul className="mt-2 space-y-2">
                              {q.options.map((option, optIndex) => (
                                <li key={optIndex} className={`flex items-start p-2 rounded-lg ${ optIndex === q.correctOptionIndex ? 'bg-emerald-50 dark:bg-emerald-900/50' : '' }`}>
                                  {optIndex === q.correctOptionIndex && <CheckCircleIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mr-2 mt-0.5 flex-shrink-0" />}
                                  <span id={`q-${q.id}-opt-${optIndex}`} className={`${optIndex === q.correctOptionIndex ? 'font-bold text-emerald-800 dark:text-emerald-200' : 'text-gray-600 dark:text-gray-400 ml-7'} ${currentlySpokenId === `q-${q.id}-opt-${optIndex}` ? 'tts-highlight' : ''}`}> {translate(option)} </span>
                                </li>
                              ))}
                            </ul>
                             {quizExplanations[module.id]?.isLoading && !explanationData && (
                                <div className="mt-2 p-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-teal-500 rounded-full animate-spin"></div>
                                    {translate('Generating AI explanation...')}
                                </div>
                             )}
                             {explanationData && (
                                <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                                    <div id={`q-${q.id}-explanation`} className={`prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 ${currentlySpokenId === `q-${q.id}-explanation` ? 'tts-highlight' : ''}`}>
                                        <strong className="text-gray-800 dark:text-gray-200">{translate('Explanation')}:</strong>
                                        <div dangerouslySetInnerHTML={{ __html: safeMarkdownToHTML(translate(explanationData.explanation)) }} />
                                    </div>
                                    {explanationData.mediaUrl && explanationData.mediaType === 'image' && ( <img src={explanationData.mediaUrl} alt="Visual explanation" className="mt-3 rounded-lg shadow-md w-full max-w-sm mx-auto" /> )}
                                    {explanationData.mediaUrl && explanationData.mediaType === 'video' && ( <div className="mt-3 aspect-video w-full max-w-sm mx-auto"> <iframe className="w-full h-full rounded-lg shadow-md" src={explanationData.mediaUrl} title={translate('Embedded video explanation')} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe> </div> )}
                                </div>
                             )}
                          </div>
                        )})}
                      </div>
                    </>
                  ) : ( <p className="text-gray-500 dark:text-gray-400">{translate('No quiz found for this module.')}</p> )}

                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                     <h3 id={`model-response-header-${module.id}`} className={`text-lg font-semibold text-gray-800 dark:text-white mb-4 ${currentlySpokenId === `model-response-header-${module.id}` ? 'tts-highlight' : ''}`}>{translate('Model Simulation Guide')}</h3>
                     {!simulationGuides[module.id] ? (
                         <div className="text-center py-4 text-gray-500 dark:text-gray-400">{translate('No simulation guide has been created for this module yet.')}</div>
                     ) : (
                        <div className="space-y-6">
                            {simulationGuides[module.id]?.scenarios.map((scenario, index) => (
                                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div id={`model-sim-${module.id}-q${index}`} className={`prose prose-sm dark:prose-invert max-w-none font-semibold text-gray-700 dark:text-gray-300 ${currentlySpokenId === `model-sim-${module.id}-q${index}` ? 'tts-highlight' : ''}`}>
                                        <strong className="text-gray-800 dark:text-gray-200">{translate('Scenario')} {index + 1}:</strong>
                                        <div dangerouslySetInnerHTML={{ __html: safeMarkdownToHTML(translate(scenario.scenarioText)) }} />
                                    </div>
                                    <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-md border-l-4 border-teal-500">
                                        {scenario.type === 'multiple-choice' ? (
                                            <>
                                                <p id={`model-sim-${module.id}-choices-label-${index}`} className={`text-sm text-gray-500 dark:text-gray-400 font-medium ${currentlySpokenId === `model-sim-${module.id}-choices-label-${index}` ? 'tts-highlight' : ''}`}>{translate('Choices')}:</p>
                                                <ul className="list-disc list-inside mt-1 text-sm text-gray-600 dark:text-gray-300">
                                                    {scenario.choices?.map((choice, i) => <li id={`model-sim-${module.id}-choice-${index}-${i}`} key={i} className={currentlySpokenId === `model-sim-${module.id}-choice-${index}-${i}` ? 'tts-highlight' : ''}>{translate(choice)}</li>)}
                                                </ul>
                                                <div id={`model-sim-${module.id}-a${index}`} className={`prose prose-sm dark:prose-invert max-w-none mt-2 font-semibold text-emerald-800 dark:text-emerald-300 ${currentlySpokenId === `model-sim-${module.id}-a${index}` ? 'tts-highlight' : ''}`}>
                                                   <strong >{translate('Correct Answer')}:</strong>
                                                   <div dangerouslySetInnerHTML={{ __html: safeMarkdownToHTML(translate(scenario.correctAnswer)) }} />
                                                </div>
                                            </>
                                        ) : (
                                            <div id={`model-sim-${module.id}-a${index}`} className={`prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-200 ${currentlySpokenId === `model-sim-${module.id}-a${index}` ? 'tts-highlight' : ''}`}>
                                                <strong className="font-semibold">{translate('Model Answer')}:</strong>
                                                <div dangerouslySetInnerHTML={{ __html: safeMarkdownToHTML(translate(scenario.modelAnswer)) }} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                     )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SolutionsView;