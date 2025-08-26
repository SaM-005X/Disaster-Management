import React from 'react';
import { ChatIcon } from './icons/ChatIcon';

interface ChatbotButtonProps {
    onClick: () => void;
}

const ChatbotButton: React.FC<ChatbotButtonProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-24 right-6 bg-teal-600 text-white rounded-full p-4 shadow-lg hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-300 dark:focus:ring-teal-800 transition-transform duration-300 transform hover:scale-110 z-50"
            aria-label="Open Safety Assistant Chatbot"
        >
            <ChatIcon className="h-8 w-8" />
        </button>
    );
};

export default ChatbotButton;