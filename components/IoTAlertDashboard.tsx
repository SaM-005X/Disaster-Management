import React, { useEffect } from 'react';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS, type TTSText } from '../contexts/TTSContext';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import type { AlertType } from '../App';

interface IoTAlertDashboardProps {
    activeAlert: AlertType | null;
}

const IoTAlertDashboard: React.FC<IoTAlertDashboardProps> = ({ activeAlert }) => {
    const { translate } = useTranslate();
    const { registerTexts, currentlySpokenId } = useTTS();

    // Define texts for translation and TTS
    const headerText = translate('IoT Alert Systems');
    const subheaderText = translate('Real-time status monitoring of connected hardware sensors.');
    const fireSystemTitle = translate('Fire Detection System');
    const fireSystemDesc = translate('Monitors for flame and high heat signatures.');
    const seismicSystemTitle = translate('Seismic Activity System');
    const seismicSystemDesc = translate('Detects vibrations and sudden movements.');
    const fireStatusText = activeAlert === 'fire' ? translate('ALERT: FIRE DETECTED!') : translate('All Systems Normal');
    const seismicStatusText = activeAlert === 'seismic' ? translate('ALERT: SEISMIC ACTIVITY DETECTED!') : translate('All Systems Normal');

    useEffect(() => {
        const textsToRead: TTSText[] = [
            { id: 'iot-header', text: headerText },
            { id: 'iot-subheader', text: subheaderText },
            { id: 'iot-fire-title', text: fireSystemTitle },
            { id: 'iot-fire-desc', text: fireSystemDesc },
            { id: 'iot-fire-status', text: fireStatusText },
            { id: 'iot-seismic-title', text: seismicSystemTitle },
            { id: 'iot-seismic-desc', text: seismicSystemDesc },
            { id: 'iot-seismic-status', text: seismicStatusText },
        ];
        registerTexts(textsToRead);
    }, [registerTexts, translate, activeAlert, headerText, subheaderText, fireSystemTitle, fireSystemDesc, seismicSystemTitle, seismicSystemDesc, fireStatusText, seismicStatusText]);
    
    const StatusIndicator: React.FC<{ 
        status: 'normal' | 'alert'; 
        alertType: 'fire' | 'seismic';
        ttsId: string;
        isHighlighted: boolean;
    }> = ({ status, alertType, ttsId, isHighlighted }) => {
        const isNormal = status === 'normal';
        const bgColor = isNormal ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-red-100 dark:bg-red-900/50 animate-pulse-fast';
        const textColor = isNormal ? 'text-emerald-800 dark:text-emerald-200' : 'text-red-800 dark:text-red-200';
        const text = alertType === 'fire' ? fireStatusText : seismicStatusText;
        
        return (
            <div className={`p-4 rounded-lg text-center ${bgColor}`}>
                <p 
                    id={ttsId} 
                    className={`text-xl font-bold ${textColor} ${isHighlighted ? 'tts-highlight' : ''}`}
                >
                    {text}
                </p>
            </div>
        );
    };


    return (
        <div>
            <div className="mb-8">
                <h1 
                    id="iot-header"
                    className={`text-4xl font-extrabold text-gray-800 dark:text-white ${currentlySpokenId === 'iot-header' ? 'tts-highlight' : ''}`}
                >
                    {headerText}
                </h1>
                <p 
                    id="iot-subheader"
                    className={`text-gray-600 dark:text-gray-400 mt-2 ${currentlySpokenId === 'iot-subheader' ? 'tts-highlight' : ''}`}
                >
                    {subheaderText}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fire Detection System Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-rose-100 dark:bg-rose-900/50 rounded-full">
                            <ShieldCheckIcon className="h-8 w-8 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                            <h2 
                                id="iot-fire-title"
                                className={`text-2xl font-bold text-gray-800 dark:text-white ${currentlySpokenId === 'iot-fire-title' ? 'tts-highlight' : ''}`}
                            >
                                {fireSystemTitle}
                            </h2>
                            <p 
                                id="iot-fire-desc"
                                className={`text-sm text-gray-500 dark:text-gray-400 ${currentlySpokenId === 'iot-fire-desc' ? 'tts-highlight' : ''}`}
                            >
                                {fireSystemDesc}
                            </p>
                        </div>
                    </div>
                    <StatusIndicator 
                        status={activeAlert === 'fire' ? 'alert' : 'normal'} 
                        alertType="fire" 
                        ttsId="iot-fire-status"
                        isHighlighted={currentlySpokenId === 'iot-fire-status'}
                    />
                </div>

                {/* Seismic Activity System Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-sky-100 dark:bg-sky-900/50 rounded-full">
                            <ShieldCheckIcon className="h-8 w-8 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div>
                             <h2 
                                id="iot-seismic-title"
                                className={`text-2xl font-bold text-gray-800 dark:text-white ${currentlySpokenId === 'iot-seismic-title' ? 'tts-highlight' : ''}`}
                             >
                                {seismicSystemTitle}
                            </h2>
                            <p 
                                id="iot-seismic-desc"
                                className={`text-sm text-gray-500 dark:text-gray-400 ${currentlySpokenId === 'iot-seismic-desc' ? 'tts-highlight' : ''}`}
                            >
                                {seismicSystemDesc}
                            </p>
                        </div>
                    </div>
                   <StatusIndicator 
                        status={activeAlert === 'seismic' ? 'alert' : 'normal'} 
                        alertType="seismic" 
                        ttsId="iot-seismic-status"
                        isHighlighted={currentlySpokenId === 'iot-seismic-status'}
                    />
                </div>
            </div>
        </div>
    );
};

export default IoTAlertDashboard;