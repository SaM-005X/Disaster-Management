import React, { useState, useEffect, useCallback } from 'react';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS } from '../contexts/TTSContext';
import { HospitalIcon } from './icons/HospitalIcon';
import { PhoneOutgoingIcon } from './icons/PhoneOutgoingIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { FileTextIcon } from './icons/FileTextIcon';
import VoiceInputButton from './VoiceInputButton';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { StopIcon } from './icons/StopIcon';
import { HeartPulseIcon } from './icons/HeartPulseIcon';

interface PanicModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDialEmergency: () => void;
    onDialAmbulance: () => void;
    onFindHospital: () => void;
    onOpenDistressForm: () => void;
    locationError: string | null;
    hasLocation: boolean;
    isOnline: boolean;
}

const PanicModal: React.FC<PanicModalProps> = ({ isOpen, onClose, onDialEmergency, onDialAmbulance, onFindHospital, onOpenDistressForm, locationError, hasLocation, isOnline }) => {
    const [manualLocation, setManualLocation] = useState('');
    const { translate } = useTranslate();
    const { registerTexts, currentlySpokenId, clearQueue, toggleReadAloud, stopReadAloud, isPlaying, isPaused, hasQueue } = useTTS();

    const handleTranscript = useCallback((t: string) => {
        setManualLocation(prev => prev + t);
    }, []);
    const { isListening, toggleListening, isSupported } = useSpeechRecognition(handleTranscript);


    useEffect(() => {
        if (isOpen) {
            setManualLocation('');
            const textsToRead = [
                { id: 'panic-title', text: translate('Emergency Assistance') },
                { id: 'panic-desc', text: translate('Are you in danger? Use your location to find nearby help or call emergency services directly.') },
                { id: 'panic-call-btn', text: translate('Call Emergency (112)') },
                { id: 'panic-ambulance-btn', text: translate('Call Ambulance (108)') },
                { id: 'panic-hospital-btn', text: translate('Find Nearest Hospital') },
                { id: 'panic-form-btn', text: translate('Fill Distress Form') },
            ];
            if (locationError) {
                textsToRead.push({ id: 'panic-location-error', text: `${translate('Automatic Location Failed')}: ${locationError}`});
                textsToRead.push({ id: 'manual-location-label', text: translate('You can manually enter your location below.')});
                textsToRead.push({ id: 'manual-location-placeholder', text: translate('e.g., City, Address, or Zip Code')});
                textsToRead.push({ id: 'panic-manual-hospital-btn', text: translate('Find Hospital (Manual)') });
            }
             textsToRead.push({ id: 'panic-cancel-btn', text: translate("Cancel / I'm Safe") });
             registerTexts(textsToRead);
        } else {
            clearQueue();
        }
    }, [isOpen, locationError, registerTexts, clearQueue, translate]);

    if (!isOpen) return null;

    const handleManualSearch = () => {
        if (!manualLocation.trim()) return;
        const url = `https://www.google.com/maps/search/hospitals+near+${encodeURIComponent(manualLocation)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" 
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="panic-modal-title"
        >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-auto transform transition-all duration-300 scale-100 opacity-100">
                <div className="p-6 text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
                        <AlertTriangleIcon className="h-10 w-10 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 id="panic-modal-title" className={`text-2xl font-bold text-gray-900 dark:text-white ${currentlySpokenId === 'panic-title' ? 'tts-highlight' : ''}`}>{translate('Emergency Assistance')}</h2>
                    <p id="panic-desc" className={`mt-2 text-gray-600 dark:text-gray-400 ${currentlySpokenId === 'panic-desc' ? 'tts-highlight' : ''}`}>
                        {translate('Are you in danger? Use your location to find nearby help or call emergency services directly.')}
                    </p>

                    <div className="mt-4 flex items-center justify-center p-2 bg-gray-100 dark:bg-gray-700/50 rounded-full">
                        <span className="text-sm font-semibold mr-3 text-gray-600 dark:text-gray-300">{translate('Read Aloud')}:</span>
                        <button
                            onClick={toggleReadAloud}
                            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!hasQueue}
                            aria-label={isPlaying && !isPaused ? translate('Pause reading') : translate('Read page content aloud')}
                        >
                            {isPlaying && !isPaused ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
                        </button>
                        {isPlaying && (
                            <button
                                onClick={stopReadAloud}
                                className="p-2 rounded-full text-red-500 dark:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                                aria-label={translate('Stop reading')}
                            >
                                <StopIcon className="h-5 w-5" />
                            </button>
                        )}
                    </div>


                    {locationError && (
                        <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg text-left text-sm text-yellow-800 dark:text-yellow-300 space-y-3">
                           <p id="panic-location-error" className={currentlySpokenId === 'panic-location-error' ? 'tts-highlight' : ''}><strong>{translate('Automatic Location Failed')}:</strong> {locationError}</p>
                           <p id="manual-location-label" className={`font-semibold ${currentlySpokenId === 'manual-location-label' ? 'tts-highlight' : ''}`}>{translate('You can manually enter your location below.')}</p>
                           <div>
                                <label htmlFor="manual-location" className="sr-only">{translate('Manual Location')}</label>
                                <div className="relative">
                                    <input
                                        id="manual-location"
                                        type="text"
                                        value={manualLocation}
                                        onChange={(e) => setManualLocation(e.target.value)}
                                        placeholder={translate('e.g., City, Address, or Zip Code')}
                                        className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 pr-10 text-gray-900 dark:text-gray-200 ${currentlySpokenId === 'manual-location-placeholder' ? 'tts-highlight' : ''}`}
                                        aria-label={translate("Manual location input")}
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                                        {isSupported && <VoiceInputButton onTranscript={handleTranscript} isListening={isListening} toggleListening={toggleListening} />}
                                    </div>
                                </div>
                           </div>
                        </div>
                    )}
                </div>
                
                <div className="p-6 space-y-4">
                     <button
                        onClick={onDialEmergency}
                        className="w-full flex items-center justify-center gap-3 text-lg font-bold bg-teal-600 text-white p-4 rounded-xl shadow-md hover:bg-teal-700 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-teal-300 dark:focus:ring-teal-800"
                    >
                        <PhoneOutgoingIcon className="h-6 w-6" />
                        <span id="panic-call-btn" className={currentlySpokenId === 'panic-call-btn' ? 'tts-highlight' : ''}>{translate('Call Emergency (112)')}</span>
                    </button>
                    <button
                        onClick={onDialAmbulance}
                        className="w-full flex items-center justify-center gap-3 text-lg font-bold bg-sky-600 text-white p-4 rounded-xl shadow-md hover:bg-sky-700 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-sky-300 dark:focus:ring-sky-800"
                    >
                        <HeartPulseIcon className="h-6 w-6" />
                        <span id="panic-ambulance-btn" className={currentlySpokenId === 'panic-ambulance-btn' ? 'tts-highlight' : ''}>{translate('Call Ambulance (108)')}</span>
                    </button>
                     <button
                        onClick={onFindHospital}
                        disabled={!hasLocation || !isOnline}
                        title={!isOnline ? translate('This feature requires an internet connection.') : ''}
                        className="w-full flex items-center justify-center gap-3 text-lg font-bold bg-emerald-600 text-white p-4 rounded-xl shadow-md hover:bg-emerald-700 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed dark:disabled:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-800"
                    >
                        <HospitalIcon className="h-6 w-6" />
                        <span id="panic-hospital-btn" className={currentlySpokenId === 'panic-hospital-btn' ? 'tts-highlight' : ''}>{translate('Find Nearest Hospital')} {locationError ? `(${translate('Auto')})` : ''}</span>
                    </button>
                     <button
                        onClick={onOpenDistressForm}
                        className="w-full flex items-center justify-center gap-3 text-lg font-bold bg-amber-500 text-white p-4 rounded-xl shadow-md hover:bg-amber-600 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-amber-300 dark:focus:ring-amber-800"
                    >
                        <FileTextIcon className="h-6 w-6" />
                        <span id="panic-form-btn" className={currentlySpokenId === 'panic-form-btn' ? 'tts-highlight' : ''}>{translate('Fill Distress Form')}</span>
                    </button>
                    {locationError && (
                         <button
                            onClick={handleManualSearch}
                            disabled={!manualLocation.trim() || !isOnline}
                            title={!isOnline ? translate('This feature requires an internet connection.') : ''}
                            className="w-full flex items-center justify-center gap-3 text-lg font-bold bg-cyan-600 text-white p-4 rounded-xl shadow-md hover:bg-cyan-700 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed dark:disabled:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-cyan-300 dark:focus:ring-cyan-800"
                        >
                            <HospitalIcon className="h-6 w-6" />
                            <span id="panic-manual-hospital-btn" className={currentlySpokenId === 'panic-manual-hospital-btn' ? 'tts-highlight' : ''}>{translate('Find Hospital (Manual)')}</span>
                        </button>
                    )}
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full font-semibold text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <span id="panic-cancel-btn" className={currentlySpokenId === 'panic-cancel-btn' ? 'tts-highlight' : ''}>{translate("Cancel / I'm Safe")}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PanicModal;