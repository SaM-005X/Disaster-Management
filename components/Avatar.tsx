import React from 'react';
import type { AvatarMood } from '../App';
import type { AvatarStyle } from '../types';

interface AvatarProps {
  mood: AvatarMood;
  className?: string;
  style?: AvatarStyle;
}

const Avatar: React.FC<AvatarProps> = ({ mood, className = 'h-10 w-10', style = 'default' }) => {
  const eyePaths = {
    neutral: "M 10 16 Q 12 17 14 16 M 20 16 Q 22 17 24 16", // Gentle curve
    happy: "M 10 16 Q 12 14 14 16 M 20 16 Q 22 14 24 16", // Upward curve (smile)
    thinking: "M 8 16 L 12 16 M 22 16 L 26 16", // Looking sideways
    encouraging: "M 10 15 C 11 16, 13 16, 14 15 M 20 15 C 21 16, 23 16, 24 15", // Softer, wider eyes
  };

  const gradientId = `robot-gradient-${style}`;
  const darkGradientId = `robot-gradient-dark-${style}`;

  return (
    <div className={className}>
      <svg viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Default Style (Teal) */}
          <linearGradient id="robot-gradient-default" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ccfbf1" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
          <linearGradient id="robot-gradient-dark-default" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#115e59" />
          </linearGradient>
          {/* Teal Style */}
          <linearGradient id="robot-gradient-teal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ccfbf1" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
          <linearGradient id="robot-gradient-dark-teal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#115e59" />
          </linearGradient>
          {/* Amber Style */}
          <linearGradient id="robot-gradient-amber" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="robot-gradient-dark-amber" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
          {/* Rose Style */}
          <linearGradient id="robot-gradient-rose" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffe4e6" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
          <linearGradient id="robot-gradient-dark-rose" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#9f1239" />
          </linearGradient>
        </defs>
        
        {/* Antenna */}
        <line x1="17" y1="5" x2="17" y2="1" strokeWidth="1.5" className="stroke-gray-500 dark:stroke-gray-400" />
        <circle cx="17" cy="5" r="2" className="fill-gray-400 dark:fill-gray-500" />
        {mood === 'thinking' && (
          <circle cx="17" cy="1.5" r="1.5" className="fill-teal-500 animate-ping-slow" />
        )}

        {/* Head */}
        <path d="M 5 10 C 5 5, 29 5, 29 10 V 26 C 29 31, 5 31, 5 26 Z" className={`fill-[url(#${gradientId})] dark:fill-[url(#${darkGradientId})]`} />
        
        {/* Faceplate */}
        <rect x="7" y="12" width="20" height="9" rx="2" className="fill-gray-200 dark:fill-gray-700" />

        {/* Eyes */}
        <path d={eyePaths[mood]} strokeWidth="1.5" strokeLinecap="round" className="stroke-gray-900 dark:stroke-gray-200 transition-all duration-300" />
        
        <style>{`
            @keyframes ping-slow {
                0%, 100% {
                    transform: scale(1);
                    opacity: 1;
                }
                50% {
                    transform: scale(1.5);
                    opacity: 0.5;
                }
            }
            .animate-ping-slow {
                animation: ping-slow 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            }
            .transition-all {
                transition-property: all;
            }
            .duration-300 {
                transition-duration: 300ms;
            }
        `}</style>
      </svg>
    </div>
  );
};

export default Avatar;
