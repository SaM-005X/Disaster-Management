import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { fetchTranslations } from '../services/translationService';

interface TranslationContextType {
  language: string;
  setLanguage: (lang: string) => void;
  translate: (text: string) => string;
  isTranslating: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const SUPPORTED_LANGUAGES: Record<string, string> = {
    'en': 'English',
    'es': 'Español',
    'hi': 'हिन्दी',
    'fr': 'Français',
    'de': 'Deutsch',
};

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<string>('en');
    const [cache, setCache] = useState<Record<string, Record<string, string>>>({});
    const [isTranslating, setIsTranslating] = useState(false);
    
    const queue = useRef(new Set<string>());
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const processQueue = useCallback(async () => {
        if (queue.current.size === 0 || language === 'en') {
            setIsTranslating(false);
            return;
        }

        setIsTranslating(true);
        const textsToTranslate = Array.from(queue.current).filter(text => !(cache[language] && cache[language][text]));
        queue.current.clear();
        
        if (textsToTranslate.length === 0) {
            setIsTranslating(false);
            return;
        }

        try {
            const translations = await fetchTranslations(textsToTranslate, SUPPORTED_LANGUAGES[language]);
            setCache(prevCache => {
                const newLangCache = { ...(prevCache[language] || {}), ...translations };
                return { ...prevCache, [language]: newLangCache };
            });
        } catch (error) {
            console.error("Failed to process translation queue:", error);
        } finally {
            // Check if there are new items in the queue before setting loading to false
             if (queue.current.size === 0) {
                setIsTranslating(false);
            }
        }
    }, [language, cache]);

    useEffect(() => {
        // When language changes, clear the queue and timer, then re-process
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        queue.current.clear();
        setIsTranslating(false);
    }, [language]);

    const translate = useCallback((text: string | undefined | null): string => {
        if (!text || language === 'en') {
            return text || '';
        }

        const langCache = cache[language] || {};
        if (langCache[text]) {
            return langCache[text];
        }

        // Add to queue for batch processing
        if (!queue.current.has(text)) {
           queue.current.add(text);
           setIsTranslating(true);
           if (debounceTimer.current) clearTimeout(debounceTimer.current);
           debounceTimer.current = setTimeout(processQueue, 200);
        }
        
        return text; // Return original text for now
    }, [language, cache, processQueue]);

    const setLanguage = (lang: string) => {
        if (SUPPORTED_LANGUAGES[lang]) {
            setLanguageState(lang);
        }
    };

    return (
        <TranslationContext.Provider value={{ language, setLanguage, translate, isTranslating }}>
            {children}
        </TranslationContext.Provider>
    );
};

export const useTranslate = () => {
    const context = useContext(TranslationContext);
    if (context === undefined) {
        throw new Error('useTranslate must be used within a TranslationProvider');
    }
    return context;
};