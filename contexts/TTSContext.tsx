import React, { createContext, useState, useContext, useCallback, useRef, useEffect } from 'react';

export interface TTSText {
  id: string;
  text: string;
}

type TTSState = 'idle' | 'playing' | 'paused';

interface TTSContextType {
  registerTexts: (texts: TTSText[]) => void;
  toggleReadAloud: () => void;
  stopReadAloud: () => void;
  clearQueue: () => void;
  isPlaying: boolean;
  isPaused: boolean;
  hasQueue: boolean;
  isSupported: boolean;
  currentlySpokenId: string | null;
}

const TTSContext = createContext<TTSContextType | undefined>(undefined);

export const TTSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isSupported, setIsSupported] = useState(false);
    const [queue, setQueue] = useState<TTSText[]>([]);
    const [state, setState] = useState<TTSState>('idle');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentlySpokenId, setCurrentlySpokenId] = useState<string | null>(null);

    const synthRef = useRef<SpeechSynthesis | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    
    const stateRef = useRef(state);
    useEffect(() => { stateRef.current = state; }, [state]);
    const queueRef = useRef(queue);
    useEffect(() => { queueRef.current = queue; }, [queue]);
    const currentIndexRef = useRef(currentIndex);
    useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

    const playUtterance = useCallback((index: number) => {
        if (!isSupported || !synthRef.current || index >= queueRef.current.length) {
            setState('idle');
            setCurrentIndex(0);
            setCurrentlySpokenId(null);
            return;
        }

        synthRef.current.cancel(); 

        const textInfo = queueRef.current[index];
        const utterance = new SpeechSynthesisUtterance(textInfo.text);
        utteranceRef.current = utterance;

        utterance.onstart = () => {
            setCurrentlySpokenId(textInfo.id);
        };
        
        utterance.onend = () => {
            if (stateRef.current === 'playing') {
                const nextIndex = index + 1;
                if (nextIndex < queueRef.current.length) {
                    setCurrentIndex(nextIndex);
                } else {
                    setState('idle');
                    setCurrentIndex(0);
                    setCurrentlySpokenId(null);
                }
            }
        };

        utterance.onerror = (event) => {
            // The 'interrupted' error is expected when we manually cancel speech.
            // We can safely ignore it and prevent it from being logged as an error.
            if (event.error === 'interrupted') {
                return;
            }
            console.error(`Speech synthesis error: ${event.error}`);
            if (stateRef.current === 'playing') {
                const nextIndex = index + 1;
                 if (nextIndex < queueRef.current.length) {
                    setCurrentIndex(nextIndex);
                } else {
                    setState('idle');
                    setCurrentIndex(0);
                    setCurrentlySpokenId(null);
                }
            }
        };

        synthRef.current.speak(utterance);
    }, [isSupported]);
    
    useEffect(() => {
        if (state === 'playing') {
            playUtterance(currentIndex);
        }
    }, [currentIndex, state, playUtterance]);


    const stopReadAloud = useCallback(() => {
        if (!isSupported || !synthRef.current) return;
        synthRef.current.cancel();
        setState('idle');
        setCurrentIndex(0);
        setCurrentlySpokenId(null);
    }, [isSupported]);
    
    const toggleReadAloud = useCallback(() => {
        if (!isSupported || !synthRef.current || queueRef.current.length === 0) return;

        const currentState = stateRef.current;

        if (currentState === 'playing') {
            synthRef.current.pause();
            setState('paused');
        } else if (currentState === 'paused') {
            synthRef.current.resume();
            setState('playing');
        } else { // idle
            setState('playing');
        }
    }, [isSupported]);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            setIsSupported(true);
            synthRef.current = window.speechSynthesis;
            synthRef.current.cancel();
            return () => synthRef.current?.cancel();
        }
    }, []);

    const registerTexts = useCallback((texts: TTSText[]) => {
        stopReadAloud();
        setQueue(texts.filter(t => t.text && t.text.trim() !== ''));
    }, [stopReadAloud]);
    
    const clearQueue = useCallback(() => {
        stopReadAloud();
        setQueue([]);
    }, [stopReadAloud]);

    const isPlaying = state === 'playing' || state === 'paused';
    const isPaused = state === 'paused';

    return (
        <TTSContext.Provider value={{
            registerTexts,
            toggleReadAloud,
            stopReadAloud,
            clearQueue,
            isPlaying,
            isPaused,
            isSupported,
            hasQueue: queue.length > 0,
            currentlySpokenId
        }}>
            {children}
        </TTSContext.Provider>
    );
};

export const useTTS = () => {
    const context = useContext(TTSContext);
    if (context === undefined) {
        throw new Error('useTTS must be used within a TTSProvider');
    }
    return context;
};