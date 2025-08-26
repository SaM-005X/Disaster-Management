import React, { useState, useEffect } from 'react';
import Avatar from './Avatar';
import type { AvatarMood } from '../App';
import { XIcon } from './icons/XIcon';
import { useTranslate } from '../contexts/TranslationContext';

interface GuideAvatarProps {
    message: string;
    mood: AvatarMood;
    isOpen: boolean;
    onClose: () => void;
}

/**
 * A simple and safe function to convert markdown-like text to HTML.
 * It escapes all HTML to prevent XSS, then converts a limited set of markdown.
 */
const safeMarkdownToHTML = (text: string | undefined | null): string => {
    if (!text) return '';

    const escapedText = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    // Basic inline markdown
    return escapedText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>')       // Italics
        .replace(/(\r\n|\n|\r)/g, '<br />');
};


const GuideAvatar: React.FC<GuideAvatarProps> = ({ message, mood, isOpen, onClose }) => {
    const [displayedMessage, setDisplayedMessage] = useState(message);
    const [isFading, setIsFading] = useState(false);
    const { translate } = useTranslate();

    useEffect(() => {
        if (message) {
            setIsFading(true);
            const timer = setTimeout(() => {
                setDisplayedMessage(message);
                setIsFading(false);
            }, 200); // Duration of the fade-out animation
            return () => clearTimeout(timer);
        }
    }, [message]);

    if (!isOpen || !displayedMessage) {
        return null;
    }

    return (
        <div className="fixed bottom-6 left-6 z-40 flex items-end gap-3 animate-fade-in-up">
            <Avatar mood={mood} className="h-20 w-20 flex-shrink-0" />
            <div className="relative mb-2 max-w-xs bg-white dark:bg-gray-800 rounded-2xl rounded-bl-none shadow-lg p-4 ring-1 ring-gray-200 dark:ring-gray-700">
                 <button 
                    onClick={onClose} 
                    className="absolute top-1.5 right-1.5 p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label={translate("Dismiss message")}
                >
                    <XIcon className="h-4 w-4" />
                </button>
                <div 
                    className={`text-gray-800 dark:text-gray-200 transition-opacity duration-200 pr-4 ${isFading ? 'opacity-0' : 'opacity-100'}`}
                    dangerouslySetInnerHTML={{ __html: safeMarkdownToHTML(displayedMessage) }}
                />
                {/* Speech bubble tail */}
                <div className="absolute bottom-0 left-[-10px] w-0 h-0 border-t-[10px] border-t-transparent border-r-[10px] border-r-white dark:border-r-gray-800 border-b-[10px] border-b-transparent"></div>
            </div>
             <style>{`
                @keyframes fade-in-up {
                    0% {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default GuideAvatar;