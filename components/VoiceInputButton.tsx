import React from 'react';
import { MicIcon } from './icons/MicIcon';

interface VoiceInputButtonProps {
  onTranscript: (transcript: string) => void;
  className?: string;
  isListening: boolean;
  toggleListening: () => void;
  isSupported?: boolean; // Make isSupported optional if the parent handles the check
  error?: string | null;
}

const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ 
    onTranscript, 
    className, 
    isListening, 
    toggleListening, 
    isSupported = true, // Default to true, parent can override
    error 
}) => {

  if (!isSupported) {
    return null;
  }
  
  const title = isListening ? "Stop listening" : "Start voice input";

  return (
    <button
      type="button"
      onClick={toggleListening}
      title={title}
      aria-label={title}
      className={`${className} p-3 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
        isListening 
          ? 'bg-red-500 text-white animate-pulse ring-red-300' 
          : 'bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500'
      }`}
    >
      <MicIcon className="h-6 w-6" />
      {error && <span className="sr-only">Error: {error}</span>}
    </button>
  );
};

export default VoiceInputButton;