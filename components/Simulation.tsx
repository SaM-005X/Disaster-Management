import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Type, Chat } from '@google/genai';
import type { LearningModule, LabScore, ScenarioContent } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS, TTSText } from '../contexts/TTSContext';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { SendIcon } from './icons/SendIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import Avatar from './Avatar';
import VoiceInputButton from './VoiceInputButton';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { StopIcon } from './icons/StopIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { handleApiError } from '../services/apiErrorHandler';

interface SimulationProps {
  module: LearningModule;
  onComplete: (score: LabScore) => void;
  onBack: () => void;
}

interface SimulationStep {
    scenario: ScenarioContent;
    response?: string;
    feedback?: string;
    score?: number; // out of 10
}

const MAX_STEPS = 5;
const MULTIPLE_CHOICE_COUNT = 2; // The first 2 steps will be multiple choice
const STEP_DURATION = 90; // 90 seconds

const Simulation: React.FC<SimulationProps> = ({ module, onComplete, onBack }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [steps, setSteps] = useState<SimulationStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isFinished, setIsFinished] = useState(false);
    const [timeLeft, setTimeLeft] = useState(STEP_DURATION);
    const [hint, setHint] = useState<string | null>(null);
    const [isHintLoading, setIsHintLoading] = useState(false);
    const [hintUsed, setHintUsed] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { translate } = useTranslate();
    const { registerTexts, currentlySpokenId } = useTTS();
    
    // Local TTS state
    const localSpeechRef = useRef<SpeechSynthesis | null>(null);
    const [speakingScenarioId, setSpeakingScenarioId] = useState<number | null>(null);
    const [isScenarioPaused, setIsScenarioPaused] = useState(false);

    const handleTranscript = useCallback((t: string) => {
        setUserInput(prev => prev + t);
    }, []);
    const { isListening, toggleListening, isSupported } = useSpeechRecognition(handleTranscript);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            localSpeechRef.current = window.speechSynthesis;
        }
    }, []);
    
    const moduleContext = module.content.map(c => {
        if (c.type === 'heading' || c.type === 'paragraph') return c.content;
        if (c.type === 'list') return (c.content as string[]).join(', ');
        return '';
    }).join('\n');

    const handleAPICall = async (prompt: string, schema?: any) => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const config: any = schema ? {
          responseMimeType: "application/json",
          responseSchema: schema,
      } : {};

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: config
      });
      return schema ? JSON.parse(response.text) : response.text;
    };
    
    const scenarioSchema = {
        type: Type.OBJECT,
        properties: { 
            text: { type: Type.STRING }, 
            choices: { type: Type.ARRAY, items: { type: Type.STRING } },
            type: { type: Type.STRING, description: "Should be 'multiple-choice' or 'short-answer'" }
        },
        required: ["text", "type"]
    };

    useEffect(() => {
        const initChat = async () => {
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const chatSession = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction: `You are a disaster simulation evaluator for a module titled "${module.title}". Your role is to test a user's knowledge based on the provided module content. Present realistic, varied, and complex scenarios. The first scenarios will be multiple-choice, and later ones will require short text answers.`,
                    },
                });
                setChat(chatSession);

                const prompt = `Generate the first scenario for a simulation test based on this content. It must be a multiple-choice question to test foundational knowledge.
                 ---
                 CONTENT: ${moduleContext}
                 ---
                 Respond ONLY with a valid JSON object in the format: { "text": "scenario text...", "choices": ["Choice 1", "Choice 2", "Choice 3"], "type": "multiple-choice" }.`;
                
                const scenarioContent = await handleAPICall(prompt, scenarioSchema);

                setSteps([{ scenario: scenarioContent }]);
            } catch (error) {
                const errorMessage = handleApiError(error);
                console.error("Failed to initialize simulation:", errorMessage);
                setSteps([{ scenario: { text: `${translate("Error: Could not start the simulation.")} ${errorMessage}`, type: 'short-answer' } }]);
            } finally {
                setIsLoading(false);
            }
        };
        initChat();
    }, [module.title, moduleContext, translate]);
    
    // Timer Effect
    useEffect(() => {
        if (isLoading || isFinished || (steps[currentStepIndex] && steps[currentStepIndex].response)) {
            return;
        }
        setTimeLeft(STEP_DURATION);
        const timerId = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    clearInterval(timerId);
                    handleSubmitResponse(null, true);
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(timerId);
    }, [currentStepIndex, isLoading, isFinished, steps]);

    const currentStep = steps[currentStepIndex];
    const isStepAnswered = currentStep?.response !== undefined;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [steps, isLoading]);

    useEffect(() => {
        const titleText = `${translate(module.title)} ${translate('Simulation')}`;
        const textsToRead: TTSText[] = [
            { id: 'simulation-title', text: titleText },
        ];

        steps.forEach((step, index) => {
            if (speakingScenarioId !== index) { // Don't register text that's being handled by local TTS
                 textsToRead.push({ id: `sim-step-${index}-scenario-header`, text: `${translate('Scenario')} ${index + 1}` });
                 textsToRead.push({ id: `sim-step-${index}-scenario-text`, text: translate(step.scenario.text) });
            }
            if (step.response) {
                textsToRead.push({ id: `sim-step-${index}-response-text`, text: step.response });
            }
            if (step.feedback) {
                textsToRead.push({ id: `sim-step-${index}-feedback-header`, text: `${translate('Feedback')} - ${translate('Score')}: ${step.score}/10` });
                textsToRead.push({ id: `sim-step-${index}-feedback-text`, text: translate(step.feedback) });
            }
        });

        if (isFinished) {
            textsToRead.push({ id: 'sim-finished-header', text: translate('Simulation Complete!') });
            textsToRead.push({ id: 'sim-finished-desc', text: translate('Your final score is being calculated.') });
        } else if (!isStepAnswered) {
             textsToRead.push({ id: `sim-input-placeholder`, text: currentStep?.scenario.type === 'multiple-choice' ? translate('Select an option above') : translate('Describe what you would do...') });
        }

        registerTexts(textsToRead);
    }, [steps, isFinished, module.title, registerTexts, translate, isStepAnswered, currentStep, speakingScenarioId]);

    const stopScenarioSpeech = useCallback(() => {
        if (localSpeechRef.current) {
            localSpeechRef.current.cancel();
            setSpeakingScenarioId(null);
            setIsScenarioPaused(false);
        }
    }, []);

    const playScenarioSpeech = (index: number, text: string) => {
        if (!localSpeechRef.current) return;
        
        if (speakingScenarioId === index && isScenarioPaused) {
            localSpeechRef.current.resume();
            setIsScenarioPaused(false);
            return;
        }
        
        stopScenarioSpeech();

        const utterance = new SpeechSynthesisUtterance(translate(text));
        utterance.onstart = () => {
            setSpeakingScenarioId(index);
            setIsScenarioPaused(false);
        };
        utterance.onend = () => {
            setSpeakingScenarioId(null);
            setIsScenarioPaused(false);
        };
        utterance.onerror = (event) => {
            if (event.error === 'interrupted') {
                return; // This is expected on manual stop, so we ignore it.
            }
            console.error("Local TTS Error:", event.error);
            setSpeakingScenarioId(null);
            setIsScenarioPaused(false);
        };
        localSpeechRef.current.speak(utterance);
    };
    
    const pauseScenarioSpeech = () => {
        if (localSpeechRef.current) {
            localSpeechRef.current.pause();
            setIsScenarioPaused(true);
        }
    };

    const handleGetHint = async () => {
        if (isHintLoading || hintUsed || !currentStep) return;
        
        setIsHintLoading(true);
        try {
            const prompt = `The user is in a simulation and is stuck on the following scenario: "${currentStep.scenario.text}".
Based on the provided module content, provide a single, short, guiding hint (no more than 20 words) to help them decide on the correct action. Do NOT give away the answer directly.
---
MODULE CONTENT: ${moduleContext}
---`;
            const hintText = await handleAPICall(prompt);
            setHint(hintText);
            setHintUsed(true);
        } catch (error) {
            const errorMessage = handleApiError(error);
            console.error("Error fetching hint:", errorMessage);
            setHint(`${translate("Sorry, I couldn't get a hint right now.")} (${errorMessage})`);
        } finally {
            setIsHintLoading(false);
        }
    };

    const handleSubmitResponse = async (e: React.FormEvent | null, timedOut: boolean = false, directResponse?: string) => {
        e?.preventDefault();

        // For multiple-choice questions, only accept answers via button clicks (directResponse) or timeout. Ignore typed input.
        if (currentStep?.scenario.type === 'multiple-choice' && !directResponse && !timedOut) {
            setUserInput(''); // Clear input and ignore submission
            return;
        }

        const responseText = directResponse || userInput;
        if ((!responseText.trim() && !timedOut) || isLoading || !chat || isFinished) return;

        setIsLoading(true);
        const currentScenario = steps[currentStepIndex].scenario.text;
        const newUserInput = timedOut ? translate("(Time ran out)") : responseText;
        setUserInput('');
        
        const updatedSteps = [...steps];
        updatedSteps[currentStepIndex].response = newUserInput;
        setSteps(updatedSteps);

        try {
            const prompt = `The user faced the scenario: "${currentScenario}". Their response was: "${newUserInput}".
You are an evaluator. Your task is to assess this response based on the provided safety protocols from the learning module content below.

1.  **Evaluate:** Determine if the user's action is correct, partially correct, or incorrect.
2.  **Explain Why:** Provide a clear explanation for your evaluation. If the response is not perfect (score < 10), you MUST include specific, constructive advice on how the user could improve their response and which key concepts or protocols from the module content they should review. Reference specific safety protocols from the provided CONTENT.
3.  **Score:** Assign a score from 0 (completely wrong) to 10 (perfect response).

---
CONTENT: ${moduleContext}
---

Respond ONLY with a valid JSON object following this exact schema: { "feedback": "Your detailed explanation...", "score": score_from_0_to_10 }`;

            const result = await handleAPICall(prompt, {
                type: Type.OBJECT,
                properties: { feedback: { type: Type.STRING }, score: { type: Type.INTEGER } },
                required: ["feedback", "score"],
            });

            const finalSteps = [...steps];
            finalSteps[currentStepIndex] = { ...finalSteps[currentStepIndex], response: newUserInput, feedback: result.feedback, score: result.score };
            
            if (currentStepIndex < MAX_STEPS - 1) {
                const nextStepIndex = currentStepIndex + 1;
                const nextScenarioType = nextStepIndex < MULTIPLE_CHOICE_COUNT ? 'multiple-choice' : 'short-answer';
                
                const nextScenarioPrompt = `Based on the content for the "${module.title}" module, generate the next scenario for the simulation. Do not repeat previous scenarios.

CRITICAL INSTRUCTION: The scenario type for this step MUST be "${nextScenarioType}".

- If the type is "multiple-choice", provide 3-4 distinct choices in the "choices" array.
- If the type is "short-answer", the user must type a one-line answer. The "choices" array MUST be empty.
---
CONTENT: ${moduleContext}
---
Respond ONLY with a valid JSON object in the format: { "text": "...", "choices": [...], "type": "${nextScenarioType}" }.`;
                
                const nextScenarioContent = await handleAPICall(nextScenarioPrompt, scenarioSchema);

                // Defensively override the AI's response to ensure the correct scenario type.
                if (nextScenarioType === 'short-answer') {
                    nextScenarioContent.type = 'short-answer';
                    if (nextScenarioContent.choices && nextScenarioContent.choices.length > 0) {
                        nextScenarioContent.choices = [];
                    }
                } else {
                    nextScenarioContent.type = 'multiple-choice';
                }


                finalSteps.push({ scenario: nextScenarioContent });
                setSteps(finalSteps);
                setCurrentStepIndex(prev => prev + 1);
                setHint(null);
                setHintUsed(false);
            } else {
                setSteps(finalSteps);
                setIsFinished(true);
            }
        } catch (error) {
            const errorMessage = handleApiError(error);
            console.error("Error evaluating response:", errorMessage);
            const finalSteps = [...steps];
            finalSteps[currentStepIndex].feedback = `${translate("Sorry, there was an error evaluating your response.")} ${errorMessage}`;
            finalSteps[currentStepIndex].score = 0;
            setSteps(finalSteps);
            setIsFinished(true);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleChoiceClick = (choice: string) => {
        if (isLoading || isFinished || steps[currentStepIndex]?.response) return;
        setUserInput(choice);
        handleSubmitResponse(null, false, choice);
    };

    const handleFinishSimulation = () => {
        const totalScore = steps.reduce((acc, step) => acc + (step.score ?? 0), 0);
        const maxScore = steps.length * 10;
        const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

        const finalLabScore: LabScore = {
            moduleId: module.id,
            score: percentage,
            steps: steps.map(s => ({...s, response: s.response ?? '', feedback: s.feedback ?? '', score: s.score ?? 0})),
            completedOn: new Date().toISOString(),
        };
        onComplete(finalLabScore);
    };

    const progressPercentage = (currentStepIndex / MAX_STEPS) * 100;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 md:p-6 max-w-4xl mx-auto flex flex-col h-[calc(100vh-10rem)]">
            <div className="flex-shrink-0">
                <button onClick={onBack} className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 hover:underline font-semibold mb-4">
                    <ArrowLeftIcon className="h-5 w-5" />
                    <span>{translate('Back to Lab Dashboard')}</span>
                </button>
                <div className="text-center mb-2">
                    <h2 id="simulation-title" className={`text-3xl font-bold text-gray-800 dark:text-white ${currentlySpokenId === 'simulation-title' ? 'tts-highlight' : ''}`}>{translate(module.title)} {translate('Simulation')}</h2>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 my-2">
                    <div className="bg-teal-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                </div>
            </div>

            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {steps.map((step, index) => (
                    <React.Fragment key={index}>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0"><Avatar mood="neutral" className="h-10 w-10"/></div>
                            <div className="w-full max-w-md lg:max-w-lg px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none">
                                <div className="flex justify-between items-center font-semibold mb-2">
                                  <p id={`sim-step-${index}-scenario-header`} className={currentlySpokenId === `sim-step-${index}-scenario-header` ? 'tts-highlight' : ''}>{translate('Scenario')} {index + 1}</p>
                                   <div className="flex items-center space-x-1">
                                        {speakingScenarioId === index ? (
                                            <>
                                                <button onClick={isScenarioPaused ? () => playScenarioSpeech(index, step.scenario.text) : pauseScenarioSpeech} className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white" aria-label={isScenarioPaused ? 'Resume scenario' : 'Pause scenario'}>
                                                    {isScenarioPaused ? <PlayIcon className="h-4 w-4" /> : <PauseIcon className="h-4 w-4" />}
                                                </button>
                                                <button onClick={stopScenarioSpeech} className="p-1 text-red-500 hover:text-red-700" aria-label="Stop reading scenario">
                                                    <StopIcon className="h-4 w-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <button onClick={() => playScenarioSpeech(index, step.scenario.text)} className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white" aria-label="Read scenario aloud">
                                                <PlayIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                        {index === currentStepIndex && !isStepAnswered && !isFinished && (
                                            <div className="text-sm font-bold text-teal-600 dark:text-teal-400">{translate('Time Left')}: {timeLeft}s</div>
                                        )}
                                    </div>
                                </div>
                                <p id={`sim-step-${index}-scenario-text`} className={currentlySpokenId === `sim-step-${index}-scenario-text` ? 'tts-highlight' : ''}>{translate(step.scenario.text)}</p>
                                {index === currentStepIndex && step.scenario.type === 'multiple-choice' && !isStepAnswered && (
                                    <div className="mt-4 flex flex-col space-y-2">
                                        {step.scenario.choices?.map((choice, choiceIndex) => (
                                            <button key={choiceIndex} onClick={() => handleChoiceClick(choice)} className="w-full text-left p-3 rounded-lg bg-white dark:bg-gray-600 hover:bg-teal-50 dark:hover:bg-teal-900/50 border border-gray-300 dark:border-gray-500 transition-colors">
                                                {translate(choice)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        {step.response && (
                             <div className="flex items-start gap-3 justify-end">
                               <div className="max-w-md lg:max-w-lg px-4 py-3 rounded-2xl bg-teal-600 text-white rounded-br-none">
                                   <p id={`sim-step-${index}-response-text`} className={currentlySpokenId === `sim-step-${index}-response-text` ? 'tts-highlight' : ''}>{step.response}</p>
                               </div>
                               <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center"><UserCircleIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" /></div>
                            </div>
                        )}
                        {step.feedback && (
                             <div className="flex items-start gap-3">
                                <div className="flex-shrink-0"><Avatar mood="encouraging" className="h-10 w-10"/></div>
                                <div className={`w-full max-w-md lg:max-w-lg px-4 py-3 rounded-2xl border-l-4 ${step.score && step.score >= 7 ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/50' : 'bg-amber-50 border-amber-500 dark:bg-amber-900/50'} text-gray-800 dark:text-gray-200 rounded-bl-none`}>
                                   <p id={`sim-step-${index}-feedback-header`} className={`font-bold mb-1 ${currentlySpokenId === `sim-step-${index}-feedback-header` ? 'tts-highlight' : ''}`}>{translate('Feedback')} - {translate('Score')}: {step.score}/10</p>
                                   <p id={`sim-step-${index}-feedback-text`} className={`prose prose-sm dark:prose-invert max-w-none ${currentlySpokenId === `sim-step-${index}-feedback-text` ? 'tts-highlight' : ''}`}>{translate(step.feedback)}</p>
                                </div>
                            </div>
                        )}
                    </React.Fragment>
                ))}
                 {isLoading && !isFinished && (
                     <div className="flex items-start gap-3">
                       <div className="flex-shrink-0"><Avatar mood="thinking" className="h-10 w-10" /></div>
                       <div className="max-w-md lg:max-w-lg p-3 rounded-2xl bg-gray-100 dark:bg-gray-700 rounded-bl-none">
                            <div className="flex items-center space-x-2">
                                <span className="h-2 w-2 bg-teal-500 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                                <span className="h-2 w-2 bg-teal-500 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                                <span className="h-2 w-2 bg-teal-500 rounded-full animate-pulse"></span>
                            </div>
                       </div>
                    </div>
                )}
                {isFinished && (
                    <div className="text-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <h3 id="sim-finished-header" className={`text-2xl font-bold ${currentlySpokenId === 'sim-finished-header' ? 'tts-highlight' : ''}`}>{translate('Simulation Complete!')}</h3>
                        <p id="sim-finished-desc" className={`mt-2 text-lg ${currentlySpokenId === 'sim-finished-desc' ? 'tts-highlight' : ''}`}>{translate('Your final score is being calculated.')}</p>
                        <button onClick={handleFinishSimulation} className="mt-4 bg-teal-600 text-white font-bold py-3 px-8 rounded-full hover:bg-teal-700 transition-colors">
                            {translate('See Results')}
                        </button>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>

            <footer className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
                {hint && (
                    <div className="mb-2 p-3 bg-blue-50 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-lg flex items-start gap-2">
                        <LightbulbIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <p><strong>{translate('Hint')}:</strong> {translate(hint)}</p>
                    </div>
                )}
                <form onSubmit={e => handleSubmitResponse(e)} className="flex items-center space-x-2">
                    {!isStepAnswered && !isFinished && (
                        <button type="button" onClick={handleGetHint} disabled={isHintLoading || hintUsed} className="p-3 bg-amber-400 text-amber-900 rounded-full hover:bg-amber-500 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed">
                           <LightbulbIcon className="h-6 w-6"/>
                        </button>
                    )}
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder={currentStep?.scenario.type === 'multiple-choice' ? translate('Select an option above or type notes here...') : translate('Describe what you would do...')}
                            id="sim-input-placeholder"
                            className={`w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:border-teal-500 pr-12 text-gray-900 dark:text-gray-200 ${currentlySpokenId === 'sim-input-placeholder' ? 'tts-highlight' : ''}`}
                            disabled={isLoading || isFinished || isStepAnswered}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                            {isSupported && <VoiceInputButton onTranscript={handleTranscript} isListening={isListening} toggleListening={toggleListening} />}
                        </div>
                    </div>
                    <button type="submit" disabled={isLoading || isFinished || isStepAnswered || !userInput.trim()} className="bg-teal-600 text-white rounded-full p-3 shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-400 dark:focus:ring-offset-gray-800 disabled:cursor-not-allowed">
                        <SendIcon className="h-6 w-6"/>
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default Simulation;
