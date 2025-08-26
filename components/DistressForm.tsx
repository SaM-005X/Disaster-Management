import React, { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS, type TTSText } from '../contexts/TTSContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import VoiceInputButton from './VoiceInputButton';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { StopIcon } from './icons/StopIcon';

interface DistressFormProps {
  user: User;
  onBack: () => void;
}

const DistressForm: React.FC<DistressFormProps> = ({ user, onBack }) => {
    const [name, setName] = useState(user.name);
    const [contact, setContact] = useState('');
    const [location, setLocation] = useState('');
    const [locationStatus, setLocationStatus] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle');
    const [locationError, setLocationError] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { translate } = useTranslate();
    const { registerTexts, currentlySpokenId, toggleReadAloud, stopReadAloud, isPlaying, isPaused, hasQueue } = useTTS();
    
    const handleLocationTranscript = useCallback((t: string) => setLocation(prev => prev + t), []);
    const { isListening, toggleListening, isSupported } = useSpeechRecognition(handleLocationTranscript);

    useEffect(() => {
        const textsToRead: TTSText[] = [
            { id: 'distress-title', text: translate('Distress Call & Rescue Form') },
            { id: 'distress-desc', text: translate('Fill this form only in a real emergency. Your location and details will be sent to the nearest rescue authorities.') },
            { id: 'distress-name-label', text: translate('Your Name') },
            { id: 'distress-contact-label', text: translate('Contact Number') },
            { id: 'distress-location-label', text: translate('Your Current Location') },
            { id: 'distress-location-placeholder', text: translate('Describe your location, nearby landmarks, or address.') },
            { id: 'distress-auto-location-btn', text: translate('Get Auto Location') },
            { id: 'distress-submit-btn', text: translate('SEND EMERGENCY ALERT') },
        ];
        registerTexts(textsToRead);
    }, [registerTexts, translate]);

    const handleGetLocation = useCallback(() => {
        setLocationStatus('fetching');
        setLocationError('');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // In a real app, you'd use a reverse geocoding service here.
                // For this demo, we'll just use the coordinates.
                setLocation(`${latitude}, ${longitude}`);
                setLocationStatus('success');
            },
            (error: GeolocationPositionError) => {
                console.error("Geolocation error:", error.message);
                let message = translate("Could not get your location. Please enter it manually.");
                if (error.code === 1) message = translate("Location access denied. Please enable location permissions or enter it manually.");
                setLocationError(message);
                setLocationStatus('error');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, [translate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !contact || !location) {
            alert(translate('Please fill all fields.'));
            return;
        }
        // In a real application, this would send data to a backend server
        // which would then contact emergency services.
        console.log('Distress call submitted:', { name, contact, location });
        setIsSubmitted(true);
    };

    if (isSubmitted) {
        return (
            <div className="max-w-2xl mx-auto text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
                <CheckCircleIcon className="h-20 w-20 text-emerald-500 mx-auto" />
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white mt-4">{translate('Alert Sent!')}</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">{translate('Help is on the way. The authorities have been notified with your details. Please move to a safe location if possible and wait for contact.')}</p>
                <button onClick={onBack} className="mt-6 bg-teal-600 text-white font-bold py-3 px-8 rounded-full hover:bg-teal-700 transition-colors">
                    {translate('Back to Dashboard')}
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <button
                onClick={onBack}
                className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 hover:underline font-semibold mb-6"
            >
                <ArrowLeftIcon className="h-5 w-5" />
                <span>{translate('Back to Dashboard')}</span>
            </button>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
                <div className="text-center mb-6">
                    <AlertTriangleIcon className="h-12 w-12 text-red-500 mx-auto" />
                    <h1 id="distress-title" className={`text-3xl font-bold text-gray-800 dark:text-white mt-2 ${currentlySpokenId === 'distress-title' ? 'tts-highlight' : ''}`}>{translate('Distress Call & Rescue Form')}</h1>
                    <p id="distress-desc" className={`text-red-600 dark:text-red-400 mt-2 font-semibold ${currentlySpokenId === 'distress-desc' ? 'tts-highlight' : ''}`}>{translate('Fill this form only in a real emergency. Your location and details will be sent to the nearest rescue authorities.')}</p>
                </div>

                <div className="flex items-center justify-center p-2 mb-6 bg-gray-100 dark:bg-gray-900/50 rounded-full">
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

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" id="distress-name-label" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${currentlySpokenId === 'distress-name-label' ? 'tts-highlight' : ''}`}>{translate('Your Name')}</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-gray-200"
                        />
                    </div>
                     <div>
                        <label htmlFor="contact" id="distress-contact-label" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${currentlySpokenId === 'distress-contact-label' ? 'tts-highlight' : ''}`}>{translate('Contact Number')}</label>
                        <input
                            type="tel"
                            id="contact"
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                            required
                            placeholder={translate('A number where rescue teams can reach you')}
                            className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-gray-900 dark:text-gray-200"
                        />
                    </div>
                     <div>
                        <label htmlFor="location" id="distress-location-label" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${currentlySpokenId === 'distress-location-label' ? 'tts-highlight' : ''}`}>{translate('Your Current Location')}</label>
                        <div className="mt-1 flex flex-col sm:flex-row gap-2">
                             <div className="relative flex-grow">
                                <textarea
                                    id="location"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    required
                                    rows={3}
                                    placeholder={translate('Describe your location, nearby landmarks, or address.')}
                                    className={`block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 pr-12 text-gray-900 dark:text-gray-200 ${currentlySpokenId === 'distress-location-placeholder' ? 'tts-highlight' : ''}`}
                                />
                                <div className="absolute top-2 right-2">
                                     {isSupported && <VoiceInputButton onTranscript={handleLocationTranscript} isListening={isListening} toggleListening={toggleListening} />}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleGetLocation}
                                disabled={locationStatus === 'fetching'}
                                className="w-full sm:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
                            >
                                <span id="distress-auto-location-btn" className={currentlySpokenId === 'distress-auto-location-btn' ? 'tts-highlight' : ''}>
                                    {locationStatus === 'fetching' ? translate('Fetching...') : translate('Get Auto Location')}
                                </span>
                            </button>
                        </div>
                         {locationStatus === 'success' && <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{translate('Location fetched successfully!')}</p>}
                         {locationStatus === 'error' && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{locationError}</p>}
                    </div>

                    <button
                        type="submit"
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-lg font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        <span id="distress-submit-btn" className={currentlySpokenId === 'distress-submit-btn' ? 'tts-highlight' : ''}>
                           {translate('SEND EMERGENCY ALERT')}
                        </span>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DistressForm;