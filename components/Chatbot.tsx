import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { useTranslate } from '../contexts/TranslationContext';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { XIcon } from './icons/XIcon';
import { SendIcon } from './icons/SendIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import Avatar from './Avatar';
import VoiceInputButton from './VoiceInputButton';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { StopIcon } from './icons/StopIcon';
import type { AvatarStyle } from '../types';
import { handleApiError } from '../services/apiErrorHandler';

interface ChatbotProps {
    isOpen: boolean;
    onClose: () => void;
    currentPage?: string;
    avatarStyle: AvatarStyle;
}

interface Message {
    role: 'user' | 'model';
    text: string;
}

const SYSTEM_INSTRUCTION = "You are a helpful and friendly safety assistant for the 'Disaster Ready: EduSafe Platform', represented by an avatar named 'Captain Ready'. Your audience includes students (K-12 and higher), teachers, and parents. Provide clear, concise, and actionable information about natural and man-made disasters. Your expertise includes explaining why and how disasters happen, prevention methods, and safety procedures to follow during a disaster. **You also have a specialization in meteorology.** You can interpret live wind maps, explain what different colors and patterns mean (e.g., cyclones, high/low-pressure systems), and provide context for weather forecasts. You can answer questions like 'What do the colors on the map mean?' or 'Is a wind speed of 50 km/h dangerous?'. Always prioritize safety and provide calm, reassuring advice. **Crucially, format your answers for maximum readability on a web interface. Use markdown for formatting:**\n- Use **bolding** (`**text**`) for headings, questions, or important terms.\n- Use numbered or bulleted lists (`1. ...` or `* ...`) for steps, tips, or key points.\n- Use short paragraphs and ensure there is clear spacing between different sections of your answer.";

/**
 * A simple and safe function to convert markdown-like text to HTML.
 * It first escapes all HTML characters to prevent XSS attacks, then
 * converts a limited set of markdown syntax to HTML tags, including lists.
 * @param text The raw text from the model.
 * @returns A safe HTML string.
 */
const safeMarkdownToHTML = (text: string | undefined | null): string => {
    if (!text) return '';

    // 1. Escape all HTML to prevent XSS
    const escapedText = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    // 2. Process markdown blocks (lists, paragraphs)
    const blocks = escapedText.split(/(\r?\n){2,}/);

    const htmlBlocks = blocks.map(block => {
        if (!block || block.trim() === '') return '';

        const lines = block.trim().split(/\r?\n/);

        // Check for Unordered List
        if (lines.every(line => /^\s*[-*]\s/.test(line))) {
            const listItems = lines.map(line => `<li>${line.replace(/^\s*[-*]\s+/, '')}</li>`).join('');
            return `<ul class="list-disc list-inside space-y-1">${listItems}</ul>`;
        }

        // Check for Ordered List
        if (lines.every(line => /^\s*\d+\.\s/.test(line))) {
            const listItems = lines.map(line => `<li>${line.replace(/^\s*\d+\.\s+/, '')}</li>`).join('');
            return `<ol class="list-decimal list-inside space-y-1">${listItems}</ol>`;
        }

        // Otherwise, treat as a paragraph
        return `<p>${block.replace(/\r?\n/g, '<br />')}</p>`;
    });

    let finalHtml = htmlBlocks.join('');

    // 3. Process inline markdown (bold, italics) after block processing
    finalHtml = finalHtml
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
        
    return finalHtml;
};


const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose, currentPage, avatarStyle }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { translate } = useTranslate();
    const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);


    const handleTranscript = useCallback((t: string) => {
        setInput(prev => prev + t);
    }, []);
    const { isListening, toggleListening, isSupported } = useSpeechRecognition(handleTranscript);
    
    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;
        }
        return () => {
            synthRef.current?.cancel();
        };
    }, []);

    useEffect(() => {
        if (!isOpen) {
            synthRef.current?.cancel();
            setSpeakingMessageIndex(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            const initChat = async () => {
                try {
                    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                    const chatSession = ai.chats.create({
                        model: 'gemini-2.5-flash',
                        config: {
                            systemInstruction: SYSTEM_INSTRUCTION,
                        },
                    });
                    setChat(chatSession);
                    
                    const initialMessage = currentPage === 'meteo'
                        ? translate("Welcome to the Meteorology page! I can help you understand the wind map or explain what the forecast means. What would you like to know?")
                        : translate("Hello! I'm Captain Ready, your Safety Assistant. How can I help you prepare for disasters today? You can ask me things like 'What should I do during an earthquake?' or 'How can I make a flood emergency kit?'");

                    setMessages([{ role: 'model', text: initialMessage }]);
                } catch (error) {
                    const errorMessage = handleApiError(error);
                    console.error("Failed to initialize Gemini AI:", errorMessage);
                    setMessages([
                        {
                            role: 'model',
                            text: `${translate("Sorry, I'm having trouble connecting right now.")} (${errorMessage})`
                        }
                    ]);
                }
            };
            initChat();
        }
    }, [isOpen, translate, currentPage]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);
    
    const handleToggleSpeakMessage = useCallback((text: string, index: number) => {
        if (!synthRef.current) return;

        if (speakingMessageIndex === index) {
            synthRef.current.cancel();
            setSpeakingMessageIndex(null);
        } else {
            if (synthRef.current.speaking) {
                synthRef.current.cancel();
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onstart = () => setSpeakingMessageIndex(index);
            utterance.onend = () => setSpeakingMessageIndex(null);
            utterance.onerror = (e) => {
                // This error is expected when speech is manually stopped or a new utterance
                // begins before the old one finishes. We can safely ignore it to prevent
                // console noise, as it's part of the normal operation of the TTS feature.
                if (e.error === 'interrupted') {
                    return; 
                }
                console.error("Speech synthesis error:", e.error);
                setSpeakingMessageIndex(null);
            };
            synthRef.current.speak(utterance);
        }
    }, [speakingMessageIndex]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chat) return;

        const userMessage: Message = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const stream = await chat.sendMessageStream({ message: input });
            
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = modelResponse;
                    return newMessages;
                });
            }
        } catch (error) {
            const errorMessage = handleApiError(error);
            console.error("Error sending message:", errorMessage);
            setMessages(prev => [...prev, { role: 'model', text: `${translate("I'm sorry, I encountered an error.")} (${errorMessage})` }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="chatbot-title"
        >
            <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] sm:h-[80vh] flex flex-col transform transition-transform duration-300 translate-y-0">
                {/* Header */}
                <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <div className="flex items-center space-x-3">
                        <Avatar mood="neutral" className="h-10 w-10 text-teal-600 dark:text-teal-400" style={avatarStyle} />
                        <h2 id="chatbot-title" className="text-xl font-bold text-gray-800 dark:text-white">{translate('Safety Assistant')}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label={translate('Close chat')}>
                        <XIcon className="h-6 w-6" />
                    </button>
                </header>

                {/* Message Area */}
                <main className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                           {msg.role === 'model' && <div className="flex-shrink-0"><Avatar mood="neutral" className="h-10 w-10" style={avatarStyle}/></div>}
                           <div className={`max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-teal-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                               <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2" dangerouslySetInnerHTML={{ __html: safeMarkdownToHTML(msg.text) }} />
                               {msg.role === 'model' && msg.text && (
                                    <button
                                        onClick={() => handleToggleSpeakMessage(msg.text, index)}
                                        className={`mt-2 p-1.5 rounded-full transition-colors ${speakingMessageIndex === index ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'}`}
                                        aria-label={speakingMessageIndex === index ? translate('Stop reading') : translate('Read message aloud')}
                                    >
                                        {speakingMessageIndex === index ? <StopIcon className="h-4 w-4" /> : <SpeakerIcon className="h-4 w-4" />}
                                    </button>
                                )}
                           </div>
                           {msg.role === 'user' && <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center"><UserCircleIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" /></div>}
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-start gap-3">
                           <div className="flex-shrink-0"><Avatar mood="thinking" className="h-10 w-10" style={avatarStyle} /></div>
                           <div className="max-w-md lg:max-w-lg p-3 rounded-2xl bg-gray-100 dark:bg-gray-700 rounded-bl-none">
                                <div className="flex items-center space-x-2">
                                    <span className="h-2 w-2 bg-teal-500 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                                    <span className="h-2 w-2 bg-teal-500 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                                    <span className="h-2 w-2 bg-teal-500 rounded-full animate-pulse"></span>
                                </div>
                           </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </main>

                {/* Input Area */}
                <footer className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={translate('Ask Captain Ready about safety...')}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:border-teal-500 pr-12 text-gray-900 dark:text-gray-200"
                                disabled={isLoading || !chat}
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                                {isSupported && <VoiceInputButton onTranscript={handleTranscript} isListening={isListening} toggleListening={toggleListening} />}
                            </div>
                        </div>
                        <button type="submit" disabled={isLoading || !input.trim() || !chat} className="bg-teal-600 text-white rounded-full p-3 shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-400 dark:focus:ring-offset-gray-800 disabled:cursor-not-allowed" aria-label={translate('Send message')}>
                            <SendIcon className="h-6 w-6"/>
                        </button>
                    </form>
                </footer>
            </div>
        </div>
    );
};

export default Chatbot;