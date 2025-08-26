import React from 'react';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';

interface PanicButtonProps {
    onClick: () => void;
}

const PanicButton: React.FC<PanicButtonProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 bg-red-600 text-white rounded-full p-4 shadow-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800 transition-transform duration-300 transform hover:scale-110 z-50"
            aria-label="Emergency Panic Button"
        >
            <AlertTriangleIcon className="h-8 w-8" />
        </button>
    );
};

export default PanicButton;
