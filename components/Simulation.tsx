
import React, { useState, useEffect, useCallback } from 'react';
import { Type } from '@google/genai';
import type { LearningModule, LabScore, ScenarioContent } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS, type TTSText } from '../contexts/TTSContext';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { SendIcon } from './icons/SendIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import ErrorMessage from './ErrorMessage';
import { AwardIcon } from './icons/AwardIcon';
import { BeakerIcon } from './icons/BeakerIcon';
import { generateContent, generateImages } from '../services/aiService';

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
const CORRECT_SCORE_THRESHOLD = 8; // Score >= 8 is considered "correct" for short answers.

const Simulation: React.FC<{
  module: LearningModule;
  onComplete: (score: LabScore) => void;
  onBack: () => void;
  isOnline: boolean;
}> = ({ module, onComplete, onBack, isOnline }) => {
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
    const { registerTexts, currentlySpokenId } = useTTS();

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
            const imagePromptInstruction = `Based on the learning module content for "${module.title}", generate a single, detailed, and photorealistic prompt for an image generator. This is for step ${stepIndex + 1} of ${MAX_STEPS} in a simulation. The scenario should be more complex if the step number is higher. Do not add any conversational text or markdown. Just the prompt itself.
            ---
            MODULE CONTENT: ${moduleContext}
            ---`;
            const imagePromptResponse = await generateContent({ model: 'gemini-2.5-flash', contents: imagePromptInstruction });
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

            const imagePromise = generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: imagePrompt,
                config: { numberOfImages: 1, outputMimeType: 'image/jpeg' }
            });

            const questionPromise = generateContent({
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
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error("Failed to generate simulation step:", errorMessage);
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [module.title, moduleContext]);

    useEffect(() => {
        if (isOnline) {
            generateNextStep(0);
        }
    }, [generateNextStep, isOnline]);
    
    const currentStep = steps[currentStepIndex];

    useEffect(() => {
        const textsToRead: TTSText[] = [];

        if (isFinished) {
            const correctAnswersCount = steps.filter(s => s.score !== undefined && s.score >= CORRECT_SCORE_THRESHOLD).length;
            const isPassed = correctAnswersCount === MAX_STEPS;
            const title = isPassed ? translate("Simulation Passed!") : translate("Simulation Complete");
            const message = isPassed 
                ? translate("Excellent work! You've correctly answered all scenarios and demonstrated strong preparedness skills.")
                : translate(`You answered ${correctAnswersCount} out of ${MAX_STEPS} questions correctly. Review the lab report and learning module to improve.`);
            const totalScore = steps.reduce((acc, step) => acc + (step.score ?? 0), 0);
            const maxScore = steps.filter(s => s.score !== undefined).length * 10;
            const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

            textsToRead.push({ id: 'sim-finished-title', text: title });
            textsToRead.push({ id: 'sim-finished-message', text: message });
            textsToRead.push({ id: 'sim-finished-score', text: `${translate('Final Score')}: ${percentage}%` });
        } else if (currentStep?.question) {
            textsToRead.push({ id: `sim-step-${currentStepIndex}`, text: `${translate('Step')} ${currentStepIndex + 1} ${translate('of')} ${MAX_STEPS}` });
            textsToRead.push({ id: `sim-q-${currentStepIndex}`, text: translate(currentStep.question.text) });
            if (showHint && currentStep.question.hint) {
                textsToRead.push({ id: `sim-hint-${currentStepIndex}`, text: `${translate('Hint')}: ${translate(currentStep.question.hint)}` });
            }
            if (currentStep.question.type === 'multiple-choice') {
                currentStep.question.choices?.forEach((choice, i) => {
                    textsToRead.push({ id: `sim-q-${currentStepIndex}-c-${i}`, text: translate(choice) });
                });
            }
            if (currentStep.feedback) {
                textsToRead.push({ id: `sim-feedback-${currentStepIndex}`, text: `${translate('Feedback')}: ${translate(currentStep.feedback)}` });
                textsToRead.push({ id: `sim-score-${currentStepIndex}`, text: `${translate('Score')}: ${currentStep.score}/10` });
            }
        }
        
        registerTexts(textsToRead);
    }, [currentStep, currentStepIndex, isFinished, steps, showHint, registerTexts, translate]);

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

        const moveToNextStep = () => {
             if (currentStepIndex < MAX_STEPS - 1) {
                setSelectedAnswer(null);
                setShowHint(false);
                setCurrentStepIndex(prev => prev + 1);
                if (isOnline) {
                    generateNextStep(currentStepIndex + 1);
                }
            } else {
                setIsFinished(true);
            }
        };

        // Handle MCQs locally for instant feedback
        if (currentStepData.question?.type === 'multiple-choice') {
            const isCorrect = response === currentStepData.question.correctAnswer;
            const score = isCorrect ? 10 : 0;
            const feedback = isCorrect 
                ? translate("Correct! That's the right course of action.")
                : `${translate("Incorrect. The recommended action was:")} "${translate(currentStepData.question.correctAnswer || '')}"`;

            setTimeout(() => {
                 setSteps(prev => {
                    const newSteps = [...prev];
                    newSteps[currentStepIndex].feedback = feedback;
                    newSteps[currentStepIndex].score = score;
                    return newSteps;
                });
                setIsEvaluating(false);
                setTimeout(moveToNextStep, 3500);
            }, 500);
            return;
        }

        try {
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

            const evaluationResponse = await generateContent({
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

                setTimeout(moveToNextStep, 3500);
            }, 500);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error("Error evaluating response:", errorMessage);
            setError(errorMessage);
            setTimeout(moveToNextStep, 3500);

        } finally {
            setIsEvaluating(false);
        }
    }, [currentStepIndex, isEvaluating, isFinished, steps, moduleContext, generateNextStep, translate, isOnline]);

    const handleFinishSimulation = () => {
        const correctAnswersCount = steps.filter(s => s.score !== undefined && s.score >= CORRECT_SCORE_THRESHOLD).length;
        const isPassed = correctAnswersCount === MAX_STEPS;

        const totalScore = steps.reduce((acc, step) => acc + (step.score ?? 0), 0);
        const maxScore = steps.filter(s => s.score !== undefined).length * 10;
        const actualPercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
        
        const finalPercentage = isPassed ? 100 : actualPercentage;

        const finalLabScore: LabScore = {
            moduleId: module.id,
            score: finalPercentage,
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

    if (!isOnline) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 max-w-2xl mx-auto text-center">
                <ErrorMessage message={translate('Simulations require an active internet connection and are not available offline.')} />
                <button onClick={onBack} className="mt-6 flex items-center mx-auto space-x-2 text-teal-600 dark:text-teal-400 hover:underline font-semibold">
                    <ArrowLeftIcon className="h-5 w-5" />
                    <span>{translate('Back to Lab Dashboard')}</span>
                </button>
            </div>
        );
    }

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
        const correctAnswersCount = steps.filter(s => s.score !== undefined && s.score >= CORRECT_SCORE_THRESHOLD).length;
        const isPassed = correctAnswersCount === MAX_STEPS;
        
        const totalScore = steps.reduce((acc, step) => acc + (step.score ?? 0), 0);
        const maxScore = steps.filter(s => s.score !== undefined).length * 10;
        const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

        const title = isPassed ? translate("Simulation Passed!") : translate("Simulation Complete");
        const message = isPassed 
            ? translate("Excellent work! You've correctly answered all scenarios and demonstrated strong preparedness skills.")
            : translate(`You answered ${correctAnswersCount} out of ${MAX_STEPS} questions correctly. Review the lab report and learning module to improve.`);

        return (
            <div className="text-center p-6 flex flex-col items-center justify-center h-full">
                {isPassed ? <AwardIcon className="h-20 w-20 text-emerald-500" /> : <BeakerIcon className="h-20 w-20 text-amber-500" />}
                <h3 id="sim-finished-title" className={`text-3xl font-bold text-gray-800 dark:text-white mt-4 ${currentlySpokenId === 'sim-finished-title' ? 'tts-highlight' : ''}`}>{title}</h3>
                <p id="sim-finished-message" className={`mt-2 text-lg text-gray-600 dark:text-gray-400 ${currentlySpokenId === 'sim-finished-message' ? 'tts-highlight' : ''}`}>{message}</p>
                <div id="sim-finished-score" className={`my-6 ${currentlySpokenId === 'sim-finished-score' ? 'tts-highlight' : ''}`}>
                    <p className="text-lg font-semibold">{translate('Final Score')}</p>
                    <p className={`text-6xl font-extrabold ${isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{percentage}%</p>
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
                                        <p id={`sim-step-${currentStepIndex}`} className={`text-sm font-semibold text-teal-600 dark:text-teal-400 ${currentlySpokenId === `sim-step-${currentStepIndex}` ? 'tts-highlight' : ''}`}>{translate('Step')} {currentStepIndex + 1} / {MAX_STEPS}</p>
                                        <div className="flex items-center justify-between gap-2 mt-1">
                                            <h3 id={`sim-q-${currentStepIndex}`} className={`text-2xl font-bold text-gray-800 dark:text-white ${currentlySpokenId === `sim-q-${currentStepIndex}` ? 'tts-highlight' : ''}`}>{translate(currentStep.question.text)}</h3>
                                            {currentStep.question.hint && (
                                                <button onClick={() => setShowHint(!showHint)} className="p-2 rounded-full hover:bg-amber-100 dark:hover:bg-gray-700 text-amber-500 flex-shrink-0" aria-label={translate("Toggle hint")}>
                                                    <LightbulbIcon className="h-6 w-6" />
                                                </button>
                                            )}
                                        </div>
                                        {showHint && currentStep.question.hint && (
                                            <div id={`sim-hint-${currentStepIndex}`} className={`mt-2 p-3 bg-amber-50 dark:bg-amber-900/50 rounded-lg text-sm text-amber-800 dark:text-amber-200 animate-fade-in ${currentlySpokenId === `sim-hint-${currentStepIndex}` ? 'tts-highlight' : ''}`}>
                                                <strong>{translate('Hint:')}</strong> {translate(currentStep.question.hint)}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {currentStep?.feedback && (
                                    <div className={`p-4 rounded-lg border-l-4 animate-fade-in ${currentStep.score && currentStep.score >= CORRECT_SCORE_THRESHOLD ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/50' : 'bg-amber-50 border-amber-500 dark:bg-amber-900/50'}`}>
                                        <p id={`sim-feedback-${currentStepIndex}`} className={`font-bold text-gray-800 dark:text-white ${currentlySpokenId === `sim-feedback-${currentStepIndex}` ? 'tts-highlight' : ''}`}>{translate('Feedback')}</p>
                                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{translate(currentStep.feedback)}</p>
                                        <p id={`sim-score-${currentStepIndex}`} className={`mt-2 font-bold text-gray-800 dark:text-white ${currentlySpokenId === `sim-score-${currentStepIndex}` ? 'tts-highlight' : ''}`}>{translate('Score')}: {currentStep.score}/10</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                                {currentStep?.question?.type === 'multiple-choice' ? (
                                    <div className="space-y-3">
                                        {currentStep.question.choices?.map((choice, index) => (
                                            <button 
                                                key={index}
                                                id={`sim-q-${currentStepIndex}-c-${index}`}
                                                onClick={() => {
                                                    if (!selectedAnswer) {
                                                        setSelectedAnswer(choice);
                                                        handleSubmitResponse(choice);
                                                    }
                                                }}
                                                disabled={!!selectedAnswer || isStepAnswered || isLoading || isEvaluating}
                                                className={`${getButtonClasses(choice)} ${currentlySpokenId === `sim-q-${currentStepIndex}-c-${index}` ? 'tts-highlight' : ''}`}
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
