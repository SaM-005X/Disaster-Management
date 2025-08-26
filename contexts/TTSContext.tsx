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
    const stopMarker = useRef(false);
    
    // Refs to hold the latest state values for use in stable callbacks
    const stateRef = useRef(state);
    useEffect(() => { stateRef.current = state; }, [state]);
    const queueRef = useRef(queue);
    useEffect(() => { queueRef.current = queue; }, [queue]);


    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            setIsSupported(true);
            synthRef.current = window.speechSynthesis;
            return () => synthRef.current?.cancel();
        }
    }, []);
    
    // This effect acts as a watchdog. If the synth gets stuck in a speaking state,
    // this will cancel it to allow the system to recover.
    useEffect(() => {
        const handleStuckSynth = () => {
            if (synthRef.current?.speaking && state === 'playing') {
                console.warn('TTS seems to be stuck. Cancelling speech to recover.');
                synthRef.current.cancel();
            }
        };
        const interval = setInterval(handleStuckSynth, 5000);
        return () => clearInterval(interval);
    }, [state]);

    const playQueue = useCallback((index: number) => {
        const currentQueue = queueRef.current;
        if (!isSupported || !synthRef.current || index >= currentQueue.length) {
            setState('idle');
            setCurrentIndex(0);
            setCurrentlySpokenId(null);
            return;
        }

        stopMarker.current = false;

        const utterance = new SpeechSynthesisUtterance(currentQueue[index].text);
        
        utterance.onstart = () => setCurrentlySpokenId(currentQueue[index].id);

        utterance.onend = () => {
            if (stopMarker.current) return;
            const nextIndex = index + 1;
            setCurrentIndex(nextIndex);
            playQueue(nextIndex);
        };

        utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
            // 'interrupted' is a normal event when speech is cancelled manually.
            // We should not log it as an error or try to continue the queue.
            if (event.error === 'interrupted') {
                return;
            }
            console.error(`Speech synthesis error: ${event.error}`);
            // If another error occurs, try to continue with the next item.
            if (stopMarker.current) return;
            const nextIndex = index + 1;
            setCurrentIndex(nextIndex);
            playQueue(nextIndex);
        };

        synthRef.current.speak(utterance);
    }, [isSupported]);


    const stopReadAloud = useCallback(() => {
        if (!isSupported || !synthRef.current) return;

        stopMarker.current = true;
        synthRef.current.cancel();
        setState('idle');
        setCurrentIndex(0);
        setCurrentlySpokenId(null);
    }, [isSupported]);
    
    const toggleReadAloud = useCallback(() => {
        if (!isSupported || !synthRef.current || queueRef.current.length === 0) return;

        switch (stateRef.current) {
            case 'idle':
                setState('playing');
                playQueue(currentIndex);
                break;
            case 'playing':
                synthRef.current.pause();
                setState('paused');
                break;
            case 'paused':
                synthRef.current.resume();
                setState('playing');
                break;
        }
    }, [isSupported, currentIndex, playQueue]);

    const registerTexts = useCallback((texts: TTSText[]) => {
        const currentQueue = queueRef.current;
        // Optimization: if the queue is identical, do nothing.
        if (
            texts.length === currentQueue.length &&
            texts.every((text, index) => text.id === currentQueue[index].id && text.text === currentQueue[index].text)
        ) {
            return;
        }
        
        // When the page content changes, always stop any current speech and reset the queue.
        // This prevents race conditions and provides a predictable user experience.
        stopReadAloud();
        setQueue(texts);
    }, [stopReadAloud]);
    
    const clearQueue = useCallback(() => {
        stopReadAloud();
        setQueue([]);
    }, [stopReadAloud]);

    const isPlaying = state !== 'idle';
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