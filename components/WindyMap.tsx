import React, { useEffect, useState, useCallback } from 'react';
import type { Institution, ReliefCamp } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS, type TTSText } from '../contexts/TTSContext';
import WeatherForecast from './WeatherForecast';
import LocationAlerts from './LocationAlerts';
import ReliefCamps from './ReliefCamps';
import { getCoordinatesForLocation, getLocationNameForCoordinates } from '../services/geocodingService';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ChevronUpIcon } from './icons/ChevronUpIcon';
import { SearchIcon } from './icons/SearchIcon';
import { StarIcon } from './icons/StarIcon';
import { LocationIcon } from './icons/LocationIcon';

interface LocationState {
    name: string;
    lat: number;
    lon: number;
}

interface WindyMapProps {
    institution: Institution;
}

const WindyMap: React.FC<WindyMapProps> = ({ institution }) => {
    const { translate } = useTranslate();
    const { registerTexts, currentlySpokenId } = useTTS();
    
    const [isForecastVisible, setIsForecastVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentLocation, setCurrentLocation] = useState<LocationState | null>(null);
    const [defaultLocation, setDefaultLocation] = useState<LocationState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [zoom, setZoom] = useState(7);

    const handleSearch = useCallback(async (query: string, isInitialLoad = false) => {
        const locationToSearch = query.trim();
        if (!locationToSearch) return;

        setIsLoading(true);
        setError(null);
        try {
            const { lat, lon } = await getCoordinatesForLocation(locationToSearch);
            const locationState = { name: locationToSearch, lat, lon };
            setCurrentLocation(locationState);
            setZoom(isInitialLoad ? 7 : 10);
            if (isInitialLoad && !localStorage.getItem('defaultWeatherLocation')) {
                setDefaultLocation(locationState);
            }
        } catch (err) {
            setError(translate('Could not find location. Please try a different search term.'));
            console.error(err);
        } finally {
            setIsLoading(false);
            if (!isInitialLoad) {
                setSearchQuery('');
            }
        }
    }, [translate]);
    
    const initializeLocation = useCallback(async () => {
        // 1. Check for user-saved default in localStorage
        try {
            const savedLocation = localStorage.getItem('defaultWeatherLocation');
            if (savedLocation) {
                const parsed = JSON.parse(savedLocation);
                setDefaultLocation(parsed);
                setCurrentLocation(parsed);
                setZoom(7);
                setIsLoading(false);
                return;
            }
        } catch (e) {
            console.error("Failed to parse saved location", e);
        }

        // 2. Use institution address if available
        if (institution.address) {
            const parts = institution.address.split(',');
            const generalLocation = (parts.length > 1 ? parts.slice(-2).join(',') : institution.address)
                .replace(/-\s*\d+/, '')       // Removes Indian PIN codes like "- 110022"
                .replace(/\b\d{5,6}\b/g, '') // Removes US-style ZIP codes
                .replace(/,/g, ' ')           // Replace commas with spaces
                .replace(/\s+/g, ' ')         // Collapse multiple spaces
                .trim();
            
            if (generalLocation) {
                await handleSearch(generalLocation, true);
                return;
            }
        }

        // 3. Fallback to user's current geolocation
        if (navigator.geolocation) {
            setIsLoading(true);
            setError(null);
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const locationName = await getLocationNameForCoordinates(latitude, longitude);
                        setCurrentLocation({ name: locationName, lat: latitude, lon: longitude });
                        setZoom(7);
                    } catch (err) {
                        setError(translate('Could not determine your location name. Please search for a location manually.'));
                        setCurrentLocation({ name: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`, lat: latitude, lon: longitude });
                        setZoom(7);
                    } finally {
                        setIsLoading(false);
                    }
                },
                (err) => {
                    console.error("Geolocation error:", err);
                    setError(translate('Could not access your location. Please enable location services or search for a location manually.'));
                    setCurrentLocation(null);
                    setIsLoading(false);
                }
            );
        } else {
            // Geolocation not supported, and no other info available.
            setError(translate('Could not determine your location. Please search for a location manually.'));
            setCurrentLocation(null);
            setIsLoading(false);
        }
    }, [institution.address, handleSearch, translate]);

    useEffect(() => {
        initializeLocation();
    }, [initializeLocation]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(searchQuery);
    };

    const handleSetDefault = () => {
        if (currentLocation) {
            localStorage.setItem('defaultWeatherLocation', JSON.stringify(currentLocation));
            setDefaultLocation(currentLocation);
        }
    };

    const handleClearDefault = useCallback(() => {
        localStorage.removeItem('defaultWeatherLocation');
        setDefaultLocation(null);
        // Re-run the initialization logic to fall back to institution/geolocation
        initializeLocation();
    }, [initializeLocation]);
    
    const handleCampSelect = useCallback((camp: ReliefCamp) => {
        if (camp.latitude && camp.longitude) {
            setCurrentLocation({
                name: camp.name,
                lat: camp.latitude,
                lon: camp.longitude,
            });
            setZoom(14); // Zoom in on the specific camp location
        }
    }, []);

    const headerText = translate('Live Wind & Weather Map');
    const subHeaderText = translate('Search for any location worldwide to see real-time meteorological data. Pan and zoom on the map for more detail.');

    useEffect(() => {
        const textsToRead: TTSText[] = [
            { id: 'windy-map-header', text: headerText },
            { id: 'windy-map-subheader', text: subHeaderText },
        ];
        registerTexts(textsToRead);
    }, [headerText, subHeaderText, registerTexts]);
    
    const isCurrentLocationDefault = defaultLocation && currentLocation && defaultLocation.name === currentLocation.name;

    return (
        <div className="flex flex-col h-full">
            <div className="mb-4">
                <h1 
                    id="windy-map-header" 
                    className={`text-4xl font-extrabold text-gray-800 dark:text-white ${currentlySpokenId === 'windy-map-header' ? 'tts-highlight' : ''}`}
                >
                    {headerText}
                </h1>
                <p 
                    id="windy-map-subheader" 
                    className={`text-gray-600 dark:text-gray-400 mt-2 ${currentlySpokenId === 'windy-map-subheader' ? 'tts-highlight' : ''}`}
                >
                    {subHeaderText}
                </p>
            </div>

            {/* Search and Location Management */}
            <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md">
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-grow">
                         <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={translate('Search any city, region, or address...')}
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                    <button type="submit" disabled={isLoading} className="px-6 py-2 bg-teal-600 text-white font-semibold rounded-full hover:bg-teal-700 disabled:bg-gray-400">
                        {isLoading ? translate('Searching...') : translate('Search')}
                    </button>
                </form>
                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
                
                {currentLocation && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{translate('Showing data for:')} {currentLocation.name}</span>
                        {isCurrentLocationDefault ? (
                            <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 rounded-full">
                                <StarIcon className="h-4 w-4" /> {translate('Default')}
                            </span>
                        ) : (
                             <button onClick={handleSetDefault} className="flex items-center gap-1 px-2 py-1 bg-amber-400 hover:bg-amber-500 text-amber-900 font-semibold dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-amber-900 rounded-full transition-colors">
                                <StarIcon className="h-4 w-4" /> {translate('Set as Default')}
                            </button>
                        )}
                        {defaultLocation && (
                             <button onClick={handleClearDefault} className="flex items-center gap-1 px-2 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full">
                                <LocationIcon className="h-4 w-4" /> {translate('Use Profile Location')}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {currentLocation && <LocationAlerts location={currentLocation.name} />}
            
            <div className="my-4">
                <button
                    onClick={() => setIsForecastVisible(prev => !prev)}
                    className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold text-sm transition-colors py-2 px-4 rounded-full shadow-sm"
                    aria-expanded={isForecastVisible}
                >
                     {isForecastVisible ? (
                        <>
                            <span>{translate('Hide 7-Day Forecast')}</span>
                            <ChevronUpIcon className="h-5 w-5" />
                        </>
                    ) : (
                         <>
                            <span>{translate('Show 7-Day Forecast')}</span>
                            <ChevronDownIcon className="h-5 w-5" />
                        </>
                    )}
                </button>
            </div>
            
            {isForecastVisible && currentLocation && (
                <WeatherForecast locationName={currentLocation.name} />
            )}

            <div className="h-[70vh] w-full bg-gray-200 dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                 {currentLocation ? (
                    <iframe
                        key={`${currentLocation.name}-${zoom}`} // Force re-render on location/zoom change
                        width="100%"
                        height="100%"
                        src={`https://embed.windy.com/embed.html?lat=${currentLocation.lat}&lon=${currentLocation.lon}&detailLat=${currentLocation.lat}&detailLon=${currentLocation.lon}&width=100%&height=100%&zoom=${zoom}&level=surface&overlay=wind&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B°C&radarRange=-1`}
                        frameBorder="0"
                        title={headerText}
                        allowFullScreen
                    ></iframe>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                        {isLoading ? translate('Determining your location...') : translate('Enter a location to begin.')}
                    </div>
                )}
            </div>
            
            <ReliefCamps onCampSelect={handleCampSelect} />
            
        </div>
    );
};

export default WindyMap;