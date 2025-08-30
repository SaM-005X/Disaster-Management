import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import type { LearningModule, LabScore, ScenarioContent } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { SendIcon } from './icons/SendIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import ErrorMessage from './ErrorMessage';
import { handleApiError } from '../services/apiErrorHandler';

// State for each step in the visual simulation
interface SimulationStep {
    imagePrompt: string;
    imageUrl?: string;
    question?: ScenarioContent;
    userResponse?: string;
    feedback?: string;
    score?: number; // out of 10
}

const MAX_STEPS = 5;
const MULTIPLE_CHOICE_COUNT = 2;

const Simulation: React.FC<{
  module: LearningModule;
  onComplete: (score: LabScore) => void;
  onBack: () => void;
}> = ({ module, onComplete, onBack }) => {
    const [steps, setSteps] = useState<SimulationStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showHint, setShowHint] = useState(false);
    const { translate } = useTranslate();

    // Consolidate module content into a string for context
    const moduleContext = module.content.map(c => {
        if (c.type === 'heading' || c.type === 'paragraph') return c.content;
        if (c.type === 'list') return (c.content as string[]).join(', ');
        return '';
    }).join('\n');

    const generateNextStep = useCallback(async (stepIndex: number) => {
        setIsLoading(true);
        setError(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const imagePromptInstruction = `Based on the learning module content for "${module.title}", generate a single, detailed, and photorealistic prompt for an image generator. This is for step ${stepIndex + 1} of ${MAX_STEPS} in a simulation. The scenario should be more complex if the step number is higher. Do not add any conversational text or markdown. Just the prompt itself.
            ---
            MODULE CONTENT: ${moduleContext}
            ---`;
            const imagePromptResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: imagePromptInstruction });
            const imagePrompt = imagePromptResponse.text.trim();

            const questionType = stepIndex < MULTIPLE_CHOICE_COUNT ? 'multiple-choice' : 'short-answer';
            
            const questionPromptInstruction = `You are a quiz designer for a disaster preparedness simulation. Your task is to create a single, high-quality question based on a visual scenario and specific learning material.

**CRITICAL CONTEXT:**
1.  **Visual Scenario Description:** "${imagePrompt}"
2.  **Learning Module Content:**
    ---
    ${moduleContext}
    ---

**YOUR TASK:**
Based **strictly** on the provided Learning Module Content and how it applies to the Visual Scenario, create a question.

**REQUIREMENTS:**
- The question type **MUST** be: "${questionType}".
- The question must be a critical thinking challenge, not a simple recall of facts.
- The output **MUST** be a single, valid JSON object with no other text or markdown.

**JSON SCHEMA:**
- "text": The question text.
- "choices": For a "multiple-choice" question, this must be an array of 3-4 distinct string options. For "short-answer", this must be an empty array \`[]\`.
- "type": Must be exactly "${questionType}".
- "correctAnswer": For "multiple-choice", this must be the exact string of the correct choice from your "choices" array. For "short-answer", this must be an empty string \`""\`.
- "hint": A brief, helpful hint that guides the user toward the correct answer by referencing a concept from the learning module, without giving away the answer directly.
`;

            const imagePromise = ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: imagePrompt,
                config: { numberOfImages: 1, outputMimeType: 'image/jpeg' }
            });

            const questionPromise = ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: questionPromptInstruction,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            text: { type: Type.STRING },
                            choices: { type: Type.ARRAY, items: { type: Type.STRING } },
                            type: { type: Type.STRING },
                            correctAnswer: { type: Type.STRING },
                            hint: { type: Type.STRING }
                        },
                        required: ["text", "type", "choices", "hint", "correctAnswer"]
                    }
                }
            });

            const [imageResponse, questionResponse] = await Promise.all([imagePromise, questionPromise]);

            const base64ImageBytes = imageResponse.generatedImages[0].image.imageBytes;
            const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
            const question = JSON.parse(questionResponse.text.trim()) as ScenarioContent;

            setSteps(prev => [...prev, { imagePrompt, imageUrl, question }]);

        } catch (err) {
            const errorMessage = handleApiError(err);
            console.error("Failed to generate simulation step:", errorMessage);
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [module.title, moduleContext]);

    useEffect(() => {
        generateNextStep(0);
    }, [generateNextStep]);

    const handleSubmitResponse = useCallback(async (response: string) => {
        if (!response.trim() || isEvaluating || isFinished || steps[currentStepIndex]?.userResponse) return;
        
        setIsEvaluating(true);
        setError(null);
        setUserInput('');

        setSteps(prev => {
            const newSteps = [...prev];
            newSteps[currentStepIndex].userResponse = response;
            return newSteps;
        });

        const currentStepData = steps[currentStepIndex];

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const evaluationPrompt = `The user was shown a scene described as: "${currentStepData.imagePrompt}".
            The question was: "${currentStepData.question?.text}".
            Their response was: "${response}".
            Please evaluate this response based on the safety protocols from the learning module content provided below.
            1.  **Evaluate:** Determine if the action is correct, partially correct, or incorrect.
            2.  **Explain Why:** Provide a clear, constructive explanation for your evaluation. If the response is not perfect, you MUST include advice on how to improve.
            3.  **Score:** Assign a score from 0 to 10.
            ---
            MODULE CONTENT: ${moduleContext}
            ---
            Respond ONLY with a valid JSON object with this schema: { "feedback": "Your explanation...", "score": score_from_0_to_10 }`;

            const evaluationResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: evaluationPrompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: { feedback: { type: Type.STRING }, score: { type: Type.INTEGER } },
                        required: ["feedback", "score"]
                    }
                }
            });

            const { feedback, score } = JSON.parse(evaluationResponse.text.trim());

            setTimeout(() => {
                 setSteps(prev => {
                    const newSteps = [...prev];
                    newSteps[currentStepIndex].feedback = feedback;
                    newSteps[currentStepIndex].score = score;
                    return newSteps;
                });

                setTimeout(() => {
                    if (currentStepIndex < MAX_STEPS - 1) {
                        setSelectedAnswer(null);
                        setShowHint(false);
                        setCurrentStepIndex(prev => prev + 1);
                        generateNextStep(currentStepIndex + 1);
                    } else {
                        setIsFinished(true);
                    }
                }, 3500);
            }, 500);

        } catch (err) {
            const errorMessage = handleApiError(err);
            console.error("Error evaluating response:", errorMessage);
            setError(errorMessage);
            setTimeout(() => {
                if (currentStepIndex < MAX_STEPS - 1) {
                    setSelectedAnswer(null);
                    setShowHint(false);
                    setCurrentStepIndex(prev => prev + 1);
                    generateNextStep(currentStepIndex + 1);
                } else {
                    setIsFinished(true);
                }
            }, 3500);

        } finally {
            setIsEvaluating(false);
        }
    }, [currentStepIndex, isEvaluating, isFinished, steps, moduleContext, generateNextStep]);

    const handleFinishSimulation = () => {
        const totalScore = steps.reduce((acc, step) => acc + (step.score ?? 0), 0);
        const maxScore = steps.length * 10;
        const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

        const finalLabScore: LabScore = {
            moduleId: module.id,
            score: percentage,
            steps: steps.map(s => ({
                scenario: s.question || { text: s.imagePrompt, type: 'short-answer'},
                response: s.userResponse ?? '', 
                feedback: s.feedback ?? '', 
                score: s.score ?? 0
            })),
            completedOn: new Date().toISOString(),
        };
        onComplete(finalLabScore);
    };

    const currentStep = steps[currentStepIndex];
    const isStepAnswered = !!currentStep?.userResponse;

    const getButtonClasses = (choice: string): string => {
        const base = "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 font-medium text-gray-900 dark:text-gray-200";
        const disabled = "disabled:opacity-70 disabled:cursor-not-allowed";

        if (selectedAnswer === null) {
            return `${base} ${disabled} bg-gray-50 border-gray-200 hover:bg-teal-50 hover:border-teal-400 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-teal-900/50 dark:hover:border-teal-500`;
        }

        const correctAnswer = currentStep?.question?.correctAnswer;
        const isCorrect = correctAnswer && choice === correctAnswer;
        const isSelected = choice === selectedAnswer;

        if (isCorrect) {
            return `${base} ${disabled} bg-emerald-100 border-emerald-500 dark:bg-emerald-900/50 dark:border-emerald-400 ring-2 ring-emerald-200 dark:ring-emerald-500/50 text-emerald-800 dark:text-emerald-200`;
        }
        
        if (isSelected && !isCorrect) {
            return `${base} ${disabled} bg-red-100 border-red-500 dark:bg-red-900/50 dark:border-red-400 ring-2 ring-red-200 dark:ring-red-500/50 text-red-800 dark:text-red-200`;
        }

        return `${base} ${disabled} bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600 opacity-60`;
    };

    const renderLoadingState = () => (
        <div className="text-center p-8 text-gray-600 dark:text-gray-300">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-teal-500 mx-auto"></div>
            <p className="mt-4 text-xl font-semibold">{translate('Generating Virtual Scenario...')}</p>
            <p className="text-sm">{translate('Rendering environment and preparing challenge. This may take a few moments.')}</p>
        </div>
    );

    const renderFinishedState = () => {
        const totalScore = steps.reduce((acc, step) => acc + (step.score ?? 0), 0);
        const maxScore = steps.filter(s => s.score !== undefined).length * 10;
        const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

        return (
            <div className="text-center p-6 flex flex-col items-center justify-center h-full">
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{translate('Simulation Complete!')}</h3>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">{translate('You have completed all scenarios.')}</p>
                <div className="my-6">
                    <p className="text-lg font-semibold">{translate('Final Score')}</p>
                    <p className="text-6xl font-extrabold text-teal-600 dark:text-teal-400">{percentage}%</p>
                </div>
                <button onClick={handleFinishSimulation} className="bg-teal-600 text-white font-bold py-3 px-8 rounded-full hover:bg-teal-700 transition-colors">
                    {translate('View Full Report')}
                </button>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 md:p-6 max-w-6xl mx-auto flex flex-col h-[calc(100vh-10rem)]">
            <header className="flex-shrink-0 mb-4">
                <button onClick={onBack} className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 hover:underline font-semibold">
                    <ArrowLeftIcon className="h-5 w-5" />
                    <span>{translate('Back to Lab Dashboard')}</span>
                </button>
                <h2 className="text-center text-3xl font-bold text-gray-800 dark:text-white mt-2">{translate(module.title)} {translate('Simulation')}</h2>
            </header>

            <main className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
                {/* Visuals Column */}
                <div className="md:w-3/5 h-1/2 md:h-full bg-gray-200 dark:bg-gray-900 rounded-xl flex items-center justify-center relative overflow-hidden shadow-inner">
                    {isLoading && (!currentStep || !currentStep.imageUrl) ? renderLoadingState() : (
                        currentStep?.imageUrl ? 
                        <img src={currentStep.imageUrl} alt={translate(currentStep.imagePrompt)} className="w-full h-full object-cover animate-fade-in" />
                        : <div className="p-4 text-gray-500">{!error && translate('Image is being prepared...')}</div>
                    )}
                </div>

                {/* Interaction Column */}
                <div className="md:w-2/5 h-1/2 md:h-full flex flex-col">
                    {error && <ErrorMessage message={error} />}

                    {isFinished ? renderFinishedState() : (
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                                {currentStep?.question && (
                                    <div className="animate-fade-in">
                                        <p className="text-sm font-semibold text-teal-600 dark:text-teal-400">{translate('Step')} {currentStepIndex + 1} / {MAX_STEPS}</p>
                                        <div className="flex items-center justify-between gap-2 mt-1">
                                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{translate(currentStep.question.text)}</h3>
                                            {currentStep.question.hint && (
                                                <button onClick={() => setShowHint(!showHint)} className="p-2 rounded-full hover:bg-amber-100 dark:hover:bg-gray-700 text-amber-500 flex-shrink-0" aria-label={translate("Toggle hint")}>
                                                    <LightbulbIcon className="h-6 w-6" />
                                                </button>
                                            )}
                                        </div>
                                        {showHint && currentStep.question.hint && (
                                            <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/50 rounded-lg text-sm text-amber-800 dark:text-amber-200 animate-fade-in">
                                                <strong>{translate('Hint:')}</strong> {translate(currentStep.question.hint)}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {currentStep?.feedback && (
                                    <div className={`p-4 rounded-lg border-l-4 animate-fade-in ${currentStep.score && currentStep.score >= 7 ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/50' : 'bg-amber-50 border-amber-500 dark:bg-amber-900/50'}`}>
                                        <p className="font-bold text-gray-800 dark:text-white">{translate('Feedback')} - {translate('Score')}: {currentStep.score}/10</p>
                                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{translate(currentStep.feedback)}</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                                {currentStep?.question?.type === 'multiple-choice' ? (
                                    <div className="space-y-3">
                                        {currentStep.question.choices?.map((choice, index) => (
                                            <button 
                                                key={index}
                                                onClick={() => {
                                                    if (!selectedAnswer) {
                                                        setSelectedAnswer(choice);
                                                        handleSubmitResponse(choice);
                                                    }
                                                }}
                                                disabled={!!selectedAnswer || isStepAnswered || isLoading || isEvaluating}
                                                className={getButtonClasses(choice)}
                                            >
                                                {translate(choice)}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <form onSubmit={(e) => { e.preventDefault(); handleSubmitResponse(userInput); }}>
                                        <textarea
                                            value={userInput}
                                            onChange={(e) => setUserInput(e.target.value)}
                                            placeholder={translate('Describe your action here...')}
                                            rows={3}
                                            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-gray-200 disabled:opacity-50"
                                            disabled={isStepAnswered || isLoading || isEvaluating}
                                        />
                                        <button 
                                            type="submit" 
                                            disabled={isStepAnswered || isLoading || isEvaluating || !userInput.trim()}
                                            className="w-full mt-2 flex items-center justify-center gap-2 bg-teal-600 text-white font-bold py-3 px-4 rounded-full hover:bg-teal-700 disabled:bg-gray-400 dark:disabled:bg-gray-500 transition-colors"
                                        >
                                            <SendIcon className="h-5 w-5" />
                                            <span>{isEvaluating ? translate('Evaluating...') : translate('Submit Answer')}</span>
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <style>{`
                @keyframes fade-in {
                    0% { opacity: 0; }
                    100% { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-in-out forwards;
                }
            `}</style>
        </div>
    );
};

export default Simulation;