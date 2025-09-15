import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS, type TTSText } from '../contexts/TTSContext';
import { UploadIcon } from './icons/UploadIcon';
import { XIcon } from './icons/XIcon';
import ErrorMessage from './ErrorMessage';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { handleApiError } from '../services/apiErrorHandler';
import { ExitIcon } from './icons/ExitIcon';
import { RefreshCwIcon } from './icons/RefreshCwIcon';
import { SendIcon } from './icons/SendIcon';
import { MessageSquareIcon } from './icons/MessageSquareIcon';
import type { StoredFloorplan, User } from '../types';
import { UserRole } from '../types';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ChevronUpIcon } from './icons/ChevronUpIcon';
import FloorplanEditModal from './FloorplanEditModal';
import { generateContent } from '../services/aiService';

const fileToUrlAndDimensions = (file: File): Promise<{ url: string, width: number, height: number }> => {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            resolve({ url, width: img.width, height: img.height });
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Could not read image dimensions.'));
        };
        img.src = url;
    });
};

const urlOrDataUrlToBase64 = (url: string): Promise<{ base64: string, mimeType: string }> => {
    // Handle data URLs directly
    if (url.startsWith('data:')) {
        return new Promise((resolve, reject) => {
            try {
                const parts = url.split(',');
                if (parts.length !== 2) throw new Error('Invalid data URL format.');
                const metaPart = parts[0].split(':')[1];
                if (!metaPart) throw new Error('Invalid data URL metadata.');
                const mimeType = metaPart.split(';')[0];
                const base64 = parts[1];
                if (!mimeType || !base64) throw new Error('Could not parse data URL.');
                resolve({ base64, mimeType });
            } catch (error) {
                reject(error);
            }
        });
    }

    // Handle blob URLs by fetching
    return new Promise((resolve, reject) => {
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to fetch blob URL: ${response.statusText}`);
                return response.blob();
            })
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (reader.error) {
                        return reject(reader.error);
                    }
                    const dataUrl = reader.result as string;
                    const base64 = dataUrl.split(',')[1];
                    if (base64 === undefined) { // Check for undefined specifically
                        return reject(new Error('Failed to extract base64 string from blob.'));
                    }
                    resolve({ base64, mimeType: blob.type });
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            })
            .catch(reject);
    });
};

const safeMarkdownToHTML = (text: string | undefined | null): string => {
    if (!text) return '';
    const escapedText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
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

interface RoutePoint {
    x: number;
    y: number;
}

interface ExitPlan {
    route: RoutePoint[];
    instructions: string[];
}

interface ExitPlannerProps {
    currentUser: User | null;
    storedFloorplans: StoredFloorplan[];
    onAddFloorplan: (plan: Omit<StoredFloorplan, 'id' | 'ownerId'>) => void;
    onUpdateFloorplan: (planId: string, updatedData: Partial<Omit<StoredFloorplan, 'id'>>) => void;
    onDeleteFloorplan: (planId: string) => void;
    isOnline: boolean;
}

const ExitPlanner: React.FC<ExitPlannerProps> = ({ currentUser, storedFloorplans, onAddFloorplan, onUpdateFloorplan, onDeleteFloorplan, isOnline }) => {
    const [floorplanUrl, setFloorplanUrl] = useState<string | null>(null);
    const [imageDimensions, setImageDimensions] = useState<{ width: number, height: number } | null>(null);
    const [userLocation, setUserLocation] = useState<{ x: number; y: number } | null>(null);
    const [textLocationInput, setTextLocationInput] = useState<string>('');
    const [exitPlan, setExitPlan] = useState<ExitPlan | null>(null);
    const [chatbotResponse, setChatbotResponse] = useState<string | null>(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isStorageVisible, setIsStorageVisible] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<{ plan: StoredFloorplan | null, isGlobal: boolean }>({ plan: null, isGlobal: false });


    const fileInputRef = useRef<HTMLInputElement>(null);
    const { translate } = useTranslate();
    const { registerTexts, currentlySpokenId } = useTTS();
    
    const lastRoutePoint = exitPlan?.route[exitPlan.route.length - 1];
    
    const handleClearPlanner = useCallback(() => {
        if (floorplanUrl && floorplanUrl.startsWith('blob:')) {
            URL.revokeObjectURL(floorplanUrl);
        }
        setFloorplanUrl(null);
        setImageDimensions(null);
        setUserLocation(null);
        setTextLocationInput('');
        setExitPlan(null);
        setApiError(null);
    }, [floorplanUrl]);


    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleClearPlanner(); 
            if (!file.type.startsWith('image/')) {
                setUploadError(translate('Please upload a valid image file (PNG, JPG, etc.).'));
                return;
            }
            setUploadError(null);
            
            try {
                const { url, width, height } = await fileToUrlAndDimensions(file);
                setFloorplanUrl(url);
                setImageDimensions({ width, height });
            } catch (err) {
                 setUploadError(translate("Could not read the image file. It might be corrupted or in an unsupported format."));
            }
        }
    };
    
    const handleResetPlan = useCallback(() => {
        setUserLocation(null);
        setTextLocationInput('');
        setExitPlan(null);
        setApiError(null);
    }, []);

    const handleTextLocationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTextLocationInput(e.target.value);
        if (userLocation) setUserLocation(null);
        if (exitPlan) setExitPlan(null);
        if (chatbotResponse) setChatbotResponse(null);
        if (apiError) setApiError(null);
    };
    
    const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!imageDimensions) return;
        handleResetPlan(); // Reset previous plan if a new location is marked
        setTextLocationInput(''); // Clear text input
        const rect = event.currentTarget.getBoundingClientRect();
        
        const xRatio = (event.clientX - rect.left) / rect.width;
        const yRatio = (event.clientY - rect.top) / rect.height;

        const imageX = xRatio * imageDimensions.width;
        const imageY = yRatio * imageDimensions.height;

        setUserLocation({ x: imageX, y: imageY });
    };

    const handleGenerateFloorplanPlan = async () => {
        if (!floorplanUrl || !imageDimensions || (!userLocation && !textLocationInput.trim())) {
            setApiError(translate("Please mark your location on the map or describe it in the text box."));
            return;
        }
        
        setIsLoading(true);
        setApiError(null);
        setExitPlan(null);

        try {
            const { base64, mimeType } = await urlOrDataUrlToBase64(floorplanUrl);
            
            const locationContext = textLocationInput.trim()
                ? `The user says they are located at/in "${textLocationInput.trim()}". Your first task is to analyze the image to find the coordinates of this text-described location and use that as the starting point.`
                : `The user is at coordinates {x: ${Math.round(userLocation!.x)}, y: ${Math.round(userLocation!.y)}}. This is your starting point.`;
            
            const prompt = `You are a sophisticated AI specializing in emergency pathfinding and building safety analysis. Your task is to act as an expert fire marshal and generate a safe, clear, and direct evacuation route based on a floorplan image.

**CONTEXT:**
-   **Floorplan Image:** An image of a building's layout is provided. The image is ${imageDimensions.width} pixels wide and ${imageDimensions.height} pixels tall.
-   **User's Location:** ${locationContext}

**YOUR CRITICAL OBJECTIVES:**
1.  **Analyze the Visuals:** Meticulously examine the floorplan. Identify all walls, doors, windows, furniture, and any other potential obstacles. Treat walls as impassable barriers. Read all text and symbols, paying close attention to anything that indicates an "EXIT", "STAIRS", or designated emergency routes.
2.  **Prioritize Safety & Clarity:**
    -   **Primary Exits:** The final destination of the route **must** be a clearly marked "EXIT" on the map.
    -   **Clear Pathways:** Favor routes through main hallways and corridors over cutting through multiple private rooms or cluttered areas. The path should be logical and easy to follow.
    -   **Obstacle Avoidance:** The generated path coordinates must strictly navigate around solid objects like walls and large furniture. Do not draw lines that pass through them.
3.  **Find the Optimal Exit:** Based on the above priorities, determine the nearest and safest designated exit from the user's location.
4.  **Generate a Path:** Create a step-by-step series of coordinates for the route, starting at the user's location and ending at the chosen exit.
5.  **Provide Instructions:** Write clear, concise, step-by-step instructions that a person could follow in an emergency, referencing visual landmarks from the floorplan.
6.  **CRITICAL SAFETY RULE:** You **must not** invent exits or pathways that are not explicitly shown on the map. The route must be physically possible based on the visual evidence. Do not draw a path through a solid wall.

**OUTPUT FORMAT:**
-   Respond ONLY with a single, valid JSON object that follows this exact schema. Do not include any other text, explanations, or markdown.
-   The coordinates in the "route" must be within the image bounds of ${imageDimensions.width}x${imageDimensions.height}.

**JSON Schema:**
{
  "route": [ { "x": number, "y": number }, ... ],
  "instructions": [ "Step 1: ...", "Step 2: ...", ... ]
}`;

            const imagePart = { inlineData: { data: base64, mimeType } };
            const textPart = { text: prompt };

            const response = await generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            route: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } }, required: ["x", "y"]
                                }
                            },
                            instructions: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["route", "instructions"]
                    }
                }
            });
            const plan = JSON.parse(response.text.trim());
            
            if (!plan || !Array.isArray(plan.route) || plan.route.length === 0 || !Array.isArray(plan.instructions) || plan.instructions.length === 0) {
                throw new Error(translate("The AI couldn't generate a valid route. Try marking your location differently or use a clearer image."));
            }
            setExitPlan(plan);
        } catch (err) {
            const errorMessage = handleApiError(err);
            console.error("Error generating exit plan:", errorMessage);
            setApiError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateChatbotAdvice = async () => {
        if (!textLocationInput.trim()) {
            setApiError(translate("Please describe your location or situation."));
            return;
        }
        setIsLoading(true);
        setApiError(null);
        setChatbotResponse(null);

        try {
            const prompt = `You are an expert emergency dispatcher. The user has NOT provided a floorplan. Your primary goal is to provide calm, authoritative, and actionable safety advice based on the user's described situation.

**YOUR KNOWLEDGE BASE:**
When formulating your response, draw upon these standard safety protocols:

*   **Fire Safety (R.A.C.E. Principle):**
    *   **R**escue: Rescue anyone in immediate danger, if you can do so safely.
    *   **A**larm: Activate the nearest fire alarm and call emergency services.
    *   **C**onfine: Close doors behind you to confine the fire and smoke.
    *   **E**vacuate/Extinguish: Evacuate the building. Only attempt to extinguish very small fires if trained.

*   **Earthquake Safety (Drop, Cover, and Hold On):**
    *   **Drop:** Drop to your hands and knees.
    *   **Cover:** Cover your head and neck. If a sturdy table is nearby, crawl underneath it.
    *   **Hold On:** Hold on to your shelter until shaking stops.

*   **General Evacuation Procedures:**
    *   Stay calm.
    *   Feel doors for heat before opening. If hot, find another way out.
    *   If there is smoke, stay low to the ground.
    *   Follow "EXIT" signs.
    *   Do not use elevators during a fire or earthquake.
    *   Move to a designated assembly point away from the building.

**USER'S SITUATION:**
"${textLocationInput.trim()}"

**YOUR TASK:**
Based on the user's situation and your knowledge base, provide general, step-by-step advice on how to find a safe exit. Adapt your advice to the type of environment described (e.g., office, library, house). Your advice must be extremely practical and easy to follow in a high-stress situation.

**CRITICAL RULES:**
1.  **Do NOT ask for a floorplan.** Provide actionable guidance based only on the text provided.
2.  Use markdown for clear formatting (**bolding**, lists) to ensure readability.`;
            
            const response = await generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            const responseText = response.text.trim();
            if (responseText) {
                setChatbotResponse(responseText);
            } else {
                setApiError(translate("I'm sorry, I couldn't generate a helpful response for that. Please try describing your situation differently."));
            }

        } catch (err) {
            const errorMessage = handleApiError(err);
            setApiError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = () => {
        if (!floorplanUrl) {
            handleGenerateChatbotAdvice();
        } else {
            handleGenerateFloorplanPlan();
        }
    };
    
    const handleOpenModal = (plan: StoredFloorplan | null, isGlobal: boolean) => {
        setModalConfig({ plan, isGlobal });
        setIsModalOpen(true);
    };

     const localPlans = useMemo(() => storedFloorplans.filter(p => !p.isGlobal && p.ownerId === currentUser?.id), [storedFloorplans, currentUser]);
     const globalPlans = useMemo(() => storedFloorplans.filter(p => p.isGlobal), [storedFloorplans]);
     const [activeTab, setActiveTab] = useState<'local' | 'global'>('local');
    
    useEffect(() => {
        const texts: TTSText[] = [];
        
        texts.push({ id: 'exit-planner-header', text: translate('AI Emergency Exit Planner') });
        texts.push({ id: 'exit-planner-subheader', text: translate('Describe your location for general advice, or upload a floorplan and mark your position for a visualized route.') });

        if (isStorageVisible) {
            texts.push({ id: 'saved-plans-header', text: translate('Saved Floor Plans') });
            texts.push({ id: 'my-plans-tab', text: translate('My Plans') });
            texts.push({ id: 'public-plans-tab', text: translate('Public Plans') });
            const plansToShow = activeTab === 'local' ? localPlans : globalPlans;
            plansToShow.forEach(plan => {
                texts.push({ id: `plan-card-${plan.id}-name`, text: translate(plan.name) });
            });
        }
        
        const locationLabel = floorplanUrl ? translate('Describe your location on the floorplan...') : translate('Describe your current location or situation...');
        texts.push({ id: 'location-input-label', text: locationLabel });
        
        if (!floorplanUrl) {
            if (chatbotResponse) {
                texts.push({ id: 'chatbot-response', text: chatbotResponse });
            } else {
                texts.push({ id: 'chatbot-placeholder-title', text: translate('Safety Assistant Mode') });
                texts.push({ id: 'chatbot-placeholder-desc', text: translate('No floorplan selected or uploaded. Describe your situation above for general safety advice.') });
            }
        } else {
            const statusHeader = exitPlan ? translate('Your Evacuation Plan') : (userLocation || textLocationInput.trim() ? translate('Location Set, Ready to Generate') : translate('Mark or Describe Your Location'));
            texts.push({ id: 'planner-status-header', text: statusHeader });
            texts.push({ id: 'reset-location-btn', text: translate('Reset Location') });
            texts.push({ id: 'clear-plan-btn', text: translate('Clear Plan') });

            if (exitPlan) {
                texts.push({ id: 'evacuation-instructions-header', text: translate('Your Evacuation Route') });
                exitPlan.instructions.forEach((step, index) => {
                    texts.push({ id: `instruction-step-${index}`, text: translate(step) });
                });
            } else {
                texts.push({ id: 'mark-location-prompt', text: translate('Click on the map or type in the box above to set your location.') });
            }
        }
        
        registerTexts(texts);
    }, [translate, registerTexts, isStorageVisible, activeTab, localPlans, globalPlans, floorplanUrl, exitPlan, userLocation, textLocationInput, chatbotResponse]);


    return (
        <div>
            <div className="mb-8 text-center">
                <h1 id="exit-planner-header" className={`text-4xl font-extrabold text-gray-800 dark:text-white ${currentlySpokenId === 'exit-planner-header' ? 'tts-highlight' : ''}`}>{translate('AI Emergency Exit Planner')}</h1>
                <p id="exit-planner-subheader" className={`text-gray-600 dark:text-gray-400 mt-2 max-w-3xl mx-auto ${currentlySpokenId === 'exit-planner-subheader' ? 'tts-highlight' : ''}`}>
                    {translate('Describe your location for general advice, or upload a floorplan and mark your position for a visualized route.')}
                </p>
            </div>

            <div className="w-full max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                 <div className="mb-6 border border-gray-200 dark:border-gray-700 rounded-2xl">
                    <button
                        onClick={() => setIsStorageVisible(!isStorageVisible)}
                        className="w-full flex justify-between items-center p-4"
                        aria-expanded={isStorageVisible}
                    >
                        <h2 id="saved-plans-header" className={`text-xl font-bold text-gray-800 dark:text-white ${currentlySpokenId === 'saved-plans-header' ? 'tts-highlight' : ''}`}>{translate('Saved Floor Plans')}</h2>
                        {isStorageVisible ? <ChevronUpIcon className="h-6 w-6 text-gray-500" /> : <ChevronDownIcon className="h-6 w-6 text-gray-500" />}
                    </button>
                    {isStorageVisible && (
                        <FloorplanStorage
                            currentUser={currentUser}
                            storedFloorplans={storedFloorplans}
                            onSelectPlan={(plan) => {
                                if (floorplanUrl && floorplanUrl.startsWith('blob:')) URL.revokeObjectURL(floorplanUrl);
                                setFloorplanUrl(plan.imageDataUrl);
                                setImageDimensions({ width: plan.width, height: plan.height });
                                setUserLocation(null);
                                setExitPlan(null);
                                setApiError(null);
                            }}
                            onAddPlan={(isGlobal) => handleOpenModal(null, isGlobal)}
                            onReplacePlan={(plan) => handleOpenModal(plan, plan.isGlobal)}
                            onDeletePlan={onDeleteFloorplan}
                            currentlySpokenId={currentlySpokenId}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                        />
                    )}
                </div>

                 <div className="my-8 flex items-center text-center">
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                    <span className="flex-shrink mx-4 uppercase text-sm font-semibold text-gray-500 dark:text-gray-400">{translate('OR')}</span>
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                </div>

                <div className="mb-4">
                    <label htmlFor="location-input" id="location-input-label" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ${currentlySpokenId === 'location-input-label' ? 'tts-highlight' : ''}`}>
                        {floorplanUrl ? translate('Describe your location on the floorplan...') : translate('Describe your current location or situation...')}
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <textarea
                            id="location-input"
                            value={textLocationInput}
                            onChange={handleTextLocationChange}
                            rows={2}
                            placeholder={
                                floorplanUrl 
                                ? translate('e.g., In the kitchen, near the main entrance')
                                : translate('e.g., I am in a library on the second floor')
                            }
                            className="flex-grow w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-gray-200"
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || (!textLocationInput.trim() && !userLocation) || !isOnline}
                            className="flex items-center justify-center gap-3 bg-emerald-600 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-emerald-700 transition-colors transform disabled:bg-gray-400 disabled:cursor-not-allowed dark:disabled:bg-gray-600"
                            title={!isOnline ? translate('This feature is unavailable offline.') : ''}
                        >
                             {isLoading ? (
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <SendIcon className="h-6 w-6" />
                            )}
                            <span>{isLoading ? translate('Generating...') : translate('Generate Plan')}</span>
                        </button>
                    </div>
                    {!isOnline && <p className="text-sm text-center mt-2 text-amber-600 dark:text-amber-400">{translate('AI plan generation is unavailable offline. You can still view your saved plans.')}</p>}
                </div>

                <div className="mt-6">
                    {apiError && <ErrorMessage message={apiError} />}
                    
                    {!floorplanUrl ? (
                        <div className="text-center">
                            {chatbotResponse ? (
                                <div id="chatbot-response" className={`p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-left ${currentlySpokenId === 'chatbot-response' ? 'tts-highlight' : ''}`}>
                                    <div className="text-gray-800 dark:text-gray-200 max-w-none space-y-4" dangerouslySetInnerHTML={{ __html: safeMarkdownToHTML(chatbotResponse) }} />
                                </div>
                            ) : (
                                <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <MessageSquareIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 id="chatbot-placeholder-title" className={`mt-2 text-lg font-medium text-gray-900 dark:text-white ${currentlySpokenId === 'chatbot-placeholder-title' ? 'tts-highlight' : ''}`}>{translate('Safety Assistant Mode')}</h3>
                                    <p id="chatbot-placeholder-desc" className={`mt-1 text-sm text-gray-500 dark:text-gray-400 ${currentlySpokenId === 'chatbot-placeholder-desc' ? 'tts-highlight' : ''}`}>{translate('No floorplan selected or uploaded. Describe your situation above for general safety advice.')}</p>
                                </div>
                            )}
                             <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="sr-only"/>
                             {uploadError && <ErrorMessage message={uploadError} />}
                        </div>
                    ) : (
                        <div>
                            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                                <h2 id="planner-status-header" className={`text-xl font-bold text-gray-800 dark:text-white ${currentlySpokenId === 'planner-status-header' ? 'tts-highlight' : ''}`}>
                                    {exitPlan ? translate('Your Evacuation Plan') : (userLocation || textLocationInput.trim() ? translate('Location Set, Ready to Generate') : translate('Mark or Describe Your Location'))}
                                </h2>
                                <div className="flex items-center gap-4">
                                    <button onClick={handleResetPlan} className="flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300 transition-colors">
                                        <RefreshCwIcon className="h-5 w-5" />
                                        <span id="reset-location-btn" className={currentlySpokenId === 'reset-location-btn' ? 'tts-highlight' : ''}>{translate('Reset Location')}</span>
                                    </button>
                                    <button onClick={handleClearPlanner} className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                                        <XIcon className="h-5 w-5" />
                                        <span id="clear-plan-btn" className={currentlySpokenId === 'clear-plan-btn' ? 'tts-highlight' : ''}>{translate('Clear Plan')}</span>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                                <div
                                    onClick={handleMapClick}
                                    className="relative w-full bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden shadow-inner cursor-crosshair"
                                    style={imageDimensions ? { aspectRatio: `${imageDimensions.width} / ${imageDimensions.height}` } : { aspectRatio: '16 / 9' }}
                                    aria-label={translate("Floorplan. Click to mark your location.")}
                                >
                                    <img src={floorplanUrl} alt={translate('Uploaded floorplan')} className="absolute top-0 left-0 w-full h-full object-contain" />
                                    {userLocation && imageDimensions && (
                                        <div className="absolute w-5 h-5 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse-marker transform -translate-x-1/2 -translate-y-1/2" style={{ left: `${(userLocation.x / imageDimensions.width) * 100}%`, top: `${(userLocation.y / imageDimensions.height) * 100}%` }} title={translate("Your marked location")} aria-label={translate("Your marked location")} />
                                    )}
                                    {exitPlan && imageDimensions && (
                                         <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox={`0 0 ${imageDimensions.width} ${imageDimensions.height}`} preserveAspectRatio="xMidYMid meet">
                                            <polyline points={exitPlan.route.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="lime" strokeWidth={Math.min(imageDimensions.width, imageDimensions.height) * 0.01} strokeDasharray="15 10" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 5px lime)' }}/>
                                            {lastRoutePoint && (
                                                <foreignObject x={lastRoutePoint.x - 12} y={lastRoutePoint.y - 12} width="24" height="24">
                                                    <div className="bg-emerald-500 rounded-full p-1 shadow-lg" title={translate("Exit")}>
                                                        <ExitIcon className="text-white w-full h-full" />
                                                    </div>
                                                </foreignObject>
                                            )}
                                        </svg>
                                    )}
                                </div>
                                <div className="flex flex-col justify-center h-full">
                                    {exitPlan ? (
                                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                            <h3 id="evacuation-instructions-header" className={`text-lg font-bold text-gray-800 dark:text-white mb-3 ${currentlySpokenId === 'evacuation-instructions-header' ? 'tts-highlight' : ''}`}>{translate('Your Evacuation Route')}</h3>
                                            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                                                {exitPlan.instructions.map((step, index) => <li key={index} id={`instruction-step-${index}`} className={currentlySpokenId === `instruction-step-${index}` ? 'tts-highlight' : ''}>{translate(step)}</li>)}
                                            </ol>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-teal-50 dark:bg-teal-900/50 rounded-lg text-center">
                                            <p id="mark-location-prompt" className={`font-semibold text-teal-800 dark:text-teal-200 ${currentlySpokenId === 'mark-location-prompt' ? 'tts-highlight' : ''}`}>
                                                {translate('Click on the map or type in the box above to set your location.')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

             {isModalOpen && (
                <FloorplanEditModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={(data) => onAddFloorplan(data)}
                    onUpdate={(id, data) => onUpdateFloorplan(id, data)}
                    existingPlan={modalConfig.plan}
                    isGlobal={modalConfig.isGlobal}
                />
            )}

            <style>{`
                @keyframes pulse-marker { 0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; } 50% { transform: translate(-50%, -50%) scale(1.6); opacity: 0.7; } }
                .animate-pulse-marker { animation: pulse-marker 2s infinite ease-in-out; }
            `}</style>
        </div>
    );
};

const FloorplanCard: React.FC<{
    plan: StoredFloorplan;
    onSelect: () => void;
    onReplace: () => void;
    onDelete: () => void;
    canEdit: boolean;
    currentlySpokenId: string | null;
}> = ({ plan, onSelect, onReplace, onDelete, canEdit, currentlySpokenId }) => {
    const { translate } = useTranslate();
    return (
        <div className="relative group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button onClick={onSelect} className="block w-full text-left">
                <img src={plan.imageDataUrl} alt={plan.name} className="w-full h-32 object-cover bg-gray-200 dark:bg-gray-600 group-hover:opacity-80 transition-opacity" />
                <div className="p-3">
                    <p id={`plan-card-${plan.id}-name`} className={`font-semibold text-gray-800 dark:text-white truncate ${currentlySpokenId === `plan-card-${plan.id}-name` ? 'tts-highlight' : ''}`} title={plan.name}>{translate(plan.name)}</p>
                </div>
            </button>
            {canEdit && (
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={onReplace} className="p-1.5 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-md hover:bg-teal-100 dark:hover:bg-gray-700" aria-label={translate('Replace')}>
                        <PencilIcon className="h-4 w-4 text-teal-600" />
                    </button>
                    <button onClick={onDelete} className="p-1.5 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-md hover:bg-red-100 dark:hover:bg-gray-700" aria-label={translate('Delete')}>
                        <TrashIcon className="h-4 w-4 text-red-600" />
                    </button>
                </div>
            )}
        </div>
    );
};

const FloorplanStorage: React.FC<{
    currentUser: User | null;
    storedFloorplans: StoredFloorplan[];
    onSelectPlan: (plan: StoredFloorplan) => void;
    onAddPlan: (isGlobal: boolean) => void;
    onReplacePlan: (plan: StoredFloorplan) => void;
    onDeletePlan: (planId: string) => void;
    currentlySpokenId: string | null;
    activeTab: 'local' | 'global';
    setActiveTab: (tab: 'local' | 'global') => void;
}> = ({ currentUser, storedFloorplans, onSelectPlan, onAddPlan, onReplacePlan, onDeletePlan, currentlySpokenId, activeTab, setActiveTab }) => {
    const { translate } = useTranslate();

    if (!currentUser) return null;

    const localPlans = storedFloorplans.filter(p => !p.isGlobal && p.ownerId === currentUser.id);
    const globalPlans = storedFloorplans.filter(p => p.isGlobal);

    const userCanEditCurrentTab = useMemo(() => {
        if (activeTab === 'local') return true;
        if (activeTab === 'global') return currentUser.role === UserRole.GOVERNMENT_OFFICIAL;
        return false;
    }, [activeTab, currentUser.role]);

    const plansToShow = activeTab === 'local' ? localPlans : globalPlans;
    const canAdd = userCanEditCurrentTab;
    const addButtonText = activeTab === 'local' ? translate('Add My Plan') : translate('Add Public Plan');

    return (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button id="my-plans-tab" onClick={() => setActiveTab('local')} className={`${activeTab === 'local' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${currentlySpokenId === 'my-plans-tab' ? 'tts-highlight' : ''}`}>{translate('My Plans')}</button>
                        <button id="public-plans-tab" onClick={() => setActiveTab('global')} className={`${activeTab === 'global' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${currentlySpokenId === 'public-plans-tab' ? 'tts-highlight' : ''}`}>{translate('Public Plans')}</button>
                    </nav>
                </div>
                {canAdd && (
                    <button onClick={() => onAddPlan(activeTab === 'global')} className="flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300">
                        <PlusCircleIcon className="h-5 w-5" />
                        {addButtonText}
                    </button>
                )}
            </div>

            {plansToShow.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {plansToShow.map(plan => (
                        <FloorplanCard 
                            key={plan.id}
                            plan={plan}
                            onSelect={() => onSelectPlan(plan)}
                            onReplace={() => onReplacePlan(plan)}
                            onDelete={() => onDeletePlan(plan.id)}
                            canEdit={userCanEditCurrentTab}
                            currentlySpokenId={currentlySpokenId}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>{activeTab === 'local' ? translate('You have no saved personal plans.') : translate('No public plans are available.')}</p>
                    {canAdd && <p className="text-sm">{translate('Click "Add" to upload a new floor plan.')}</p>}
                </div>
            )}
        </div>
    );
};


export default ExitPlanner;