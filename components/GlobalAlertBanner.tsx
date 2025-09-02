import React from 'react';
import { useTranslate } from '../contexts/TranslationContext';
import { FireIcon } from './icons/FireIcon';
import { VibrationIcon } from './icons/VibrationIcon';
import { XIcon } from './icons/XIcon';
import type { AlertType } from '../App';

interface GlobalAlertBannerProps {
    alertType: AlertType;
    onDismiss: () => void;
}

const GlobalAlertBanner: React.FC<GlobalAlertBannerProps> = ({ alertType, onDismiss }) => {
    const { translate } = useTranslate();

    const config = {
        fire: {
            bgColor: 'bg-red-600 dark:bg-red-800',
            borderColor: 'border-red-700 dark:border-red-600',
            icon: <FireIcon className="h-8 w-8 text-white" />,
            title: translate('FIRE ALERT!'),
            message: translate('A fire has been detected in the vicinity. Please evacuate immediately following safety protocols.'),
        },
        seismic: {
            bgColor: 'bg-amber-500 dark:bg-amber-700',
            borderColor: 'border-amber-600 dark:border-amber-500',
            icon: <VibrationIcon className="h-8 w-8 text-white" />,
            title: translate('SEISMIC ALERT!'),
            message: translate('Seismic activity detected. Drop, Cover, and Hold On. Await further instructions.'),
        },
    };

    const currentConfig = config[alertType];

    return (
        <div 
            className={`relative w-full p-4 mb-6 rounded-lg text-white shadow-lg backdrop-blur-md border animate-pulse-fast ${currentConfig.bgColor} ${currentConfig.borderColor}`}
            role="alert"
        >
            <div className="flex items-center">
                <div className="flex-shrink-0">{currentConfig.icon}</div>
                <div className="ml-4 flex-1">
                    <p className="font-extrabold text-xl tracking-wider">{currentConfig.title}</p>
                    <p className="mt-1">{currentConfig.message}</p>
                </div>
                <button
                    onClick={onDismiss}
                    className="ml-4 p-2 rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label={translate("Dismiss Alert")}
                >
                    <XIcon className="h-6 w-6" />
                </button>
            </div>
        </div>
    );
};

export default GlobalAlertBanner;