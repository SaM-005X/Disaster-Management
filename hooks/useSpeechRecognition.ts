import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslate } from '../contexts/TranslationContext';

// Define the interface for the SpeechRecognition API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
  onstart: () => void;
}

// Extend the Window interface
declare global {
  interface Window {
    SpeechRecognition: { new(): SpeechRecognition };
    webkitSpeechRecognition: { new(): SpeechRecognition };
  }
}

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

export const useSpeechRecognition = (onTranscript: (transcript: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { language, translate } = useTranslate(); // Get current language and translate function

  useEffect(() => {
    if (!SpeechRecognitionAPI) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = language; // Use the globally selected language

    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let fullTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          fullTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (fullTranscript) {
        onTranscript(fullTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      let errorMessage;
      switch (event.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          errorMessage = translate("Microphone access denied. Please enable it in your browser settings.");
          break;
        case 'no-speech':
          errorMessage = translate("I didn't hear that. Please try again.");
          break;
        case 'audio-capture':
          errorMessage = translate("Failed to capture audio. Please check your microphone connection.");
          break;
        case 'network':
          errorMessage = translate("A network error occurred. Please check your connection and try again.");
          break;
        default:
          errorMessage = `${translate("An unexpected error occurred:")} ${event.error}`;
      }
      setError(errorMessage);
      console.error('Speech recognition error:', event.error);
    };
    
    recognition.onstart = () => {
        setError(null);
        setIsListening(true);
    };

    recognition.onend = () => {
      if (recognitionRef.current) {
          setIsListening(false);
      }
    };
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, [onTranscript, language, translate]);

  const toggleListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
       try {
        recognition.start();
      } catch(e) {
          console.error("Speech recognition could not be started: ", e);
          setError(translate("Could not start listening. Please try again in a moment."));
      }
    }
  }, [isListening, translate]);

  return {
    isListening,
    error,
    toggleListening,
    isSupported: !!SpeechRecognitionAPI,
  };
};