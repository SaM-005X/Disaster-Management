import React, { useState, useEffect } from 'react';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS, type TTSText } from '../contexts/TTSContext';
import { fetchReliefCamps } from '../services/reliefService';
import type { ReliefCamp } from '../types';
import { PhoneIcon } from './icons/PhoneIcon';
import { LocationIcon } from './icons/LocationIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import ErrorMessage from './ErrorMessage';

interface ReliefCampsProps {
    onCampSelect: (camp: ReliefCamp) => void;
}

const ReliefCamps: React.FC<ReliefCampsProps> = ({ onCampSelect }) => {
    const [camps, setCamps] = useState<ReliefCamp[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { translate } = useTranslate();
    const { registerTexts, currentlySpokenId } = useTTS();

    useEffect(() => {
        const getCamps = () => {
            setIsLoading(true);
            setError(null);
            if (!navigator.geolocation) {
                setError(translate('Geolocation is not supported by your browser.'));
                setIsLoading(false);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        const fetchedCamps = await fetchReliefCamps(latitude, longitude);
                        setCamps(fetchedCamps);
                    } catch (apiError) {
                        console.error("Failed to fetch relief camps:", apiError);
                        if (apiError instanceof Error) {
                            setError(apiError.message);
                        } else {
                            setError(translate('Could not fetch relief center data. Please try again later.'));
                        }
                    } finally {
                        setIsLoading(false);
                    }
                },
                (geoError) => {
                    console.error("Geolocation error:", geoError.message);
                    let message = translate("Could not get your location. Please enable location services to find nearby relief centers.");
                    if (geoError.code === 1) message = translate("Location access denied. To find nearby relief centers, please enable location permissions for this site in your browser settings.");
                    setError(message);
                    setIsLoading(false);
                }
            );
        };
        getCamps();
    }, [translate]);
    
    useEffect(() => {
        const textsToRead: TTSText[] = [];
        textsToRead.push({ id: 'relief-header', text: translate('Nearby Relief Centers') });
        if (camps.length > 0) {
            textsToRead.push({ id: 'relief-subheader', text: translate('The following relief centers and NGOs have been identified near your location.') });
             camps.forEach((camp, index) => {
                textsToRead.push({ id: `camp-${index}-name`, text: translate(camp.name) });
                textsToRead.push({ id: `camp-${index}-type`, text: translate(camp.type) });
                textsToRead.push({ id: `camp-${index}-address`, text: `${translate('Address')}: ${translate(camp.address)}` });
                textsToRead.push({ id: `camp-${index}-contact`, text: `${translate('Contact')}: ${camp.contact}` });
            });
        } else if (!isLoading && !error) {
            textsToRead.push({ id: 'relief-no-camps', text: translate('No active relief centers found in your immediate area based on current data.') });
        }
        
        registerTexts(textsToRead);
    }, [camps, isLoading, error, registerTexts, translate]);

    const handleCardClick = (camp: ReliefCamp) => {
        onCampSelect(camp);
        if (camp.website) {
            window.open(camp.website, '_blank', 'noopener,noreferrer');
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse">
                            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-3"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
                        </div>
                    ))}
                </div>
            );
        }

        if (error) {
            return <ErrorMessage message={error} />;
        }

        if (camps.length === 0) {
            return <p id="relief-no-camps" className={`p-4 text-center text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg ${currentlySpokenId === 'relief-no-camps' ? 'tts-highlight' : ''}`}>{translate('No active relief centers found in your immediate area based on current data.')}</p>;
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {camps.map((camp, index) => (
                    <button 
                        key={index}
                        onClick={() => handleCardClick(camp)}
                        className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border-l-4 border-teal-500 text-left w-full transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 dark:focus:ring-offset-gray-800"
                    >
                        <h3 id={`camp-${index}-name`} className={`font-bold text-lg text-gray-800 dark:text-white ${currentlySpokenId === `camp-${index}-name` ? 'tts-highlight' : ''}`}>
                            {translate(camp.name)}
                            {camp.website && <ExternalLinkIcon className="inline-block ml-2 h-4 w-4 text-gray-500 dark:text-gray-400" />}
                        </h3>
                        <p id={`camp-${index}-type`} className={`text-sm font-semibold text-teal-600 dark:text-teal-400 mb-3 ${currentlySpokenId === `camp-${index}-type` ? 'tts-highlight' : ''}`}>{translate(camp.type)}</p>
                        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                            <div id={`camp-${index}-address`} className={`flex items-start gap-2 ${currentlySpokenId === `camp-${index}-address` ? 'tts-highlight' : ''}`}>
                                <LocationIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span>{translate(camp.address)}</span>
                            </div>
                            <div id={`camp-${index}-contact`} className={`flex items-start gap-2 ${currentlySpokenId === `camp-${index}-contact` ? 'tts-highlight' : ''}`}>
                                <PhoneIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span>{camp.contact}</span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
            <h2 id="relief-header" className={`text-2xl font-bold text-gray-800 dark:text-white mb-1 ${currentlySpokenId === 'relief-header' ? 'tts-highlight' : ''}`}>
                {translate('Nearby Relief Centers')}
            </h2>
             <p id="relief-subheader" className={`text-gray-500 dark:text-gray-400 mb-4 ${currentlySpokenId === 'relief-subheader' ? 'tts-highlight' : ''}`}>
                {translate('The following relief centers and NGOs have been identified near your location.')}
            </p>
            {renderContent()}
        </div>
    );
};

export default ReliefCamps;
