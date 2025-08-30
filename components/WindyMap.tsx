import React, { useEffect, useState, useCallback } from 'react';
import type { User, ReliefCamp } from '../types';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS, type TTSText } from '../contexts/TTSContext';
import WeatherForecast from './WeatherForecast';
import LocationAlerts from './LocationAlerts';
import ReliefCamps from './ReliefCamps';
import { getCoordinatesForLocation, getLocationNameForCoordinates } from '../services/geocodingService';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ChevronUpIcon } from './icons/ChevronUpIcon';
import { SearchIcon } from './icons/SearchIcon';
import { LocationIcon } from './icons/LocationIcon';
import ErrorMessage from './ErrorMessage';
import { Theme } from '../App';

interface LocationState {
    name: string;
    lat: number;
    lon: number;
}

interface WindyMapProps {
    user: User;
    theme: Theme;
}

const WindyMap: React.FC<WindyMapProps> = ({ user, theme }) => {
    const { translate } = useTranslate();
    const { registerTexts, currentlySpokenId } = useTTS();
    
    const [isForecastVisible, setIsForecastVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentLocation, setCurrentLocation] = useState<LocationState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [zoom, setZoom] = useState(7);

    const handleSearch = useCallback(async (query: string) => {
        const locationToSearch = query.trim();
        if (!locationToSearch) return;

        setIsLoading(true);
        setError(null);
        try {
            const { lat, lon } = await getCoordinatesForLocation(locationToSearch);
            const locationState = { name: locationToSearch, lat, lon };
            setCurrentLocation(locationState);
            setZoom(10);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError(translate('Could not find location. Please try a different search term.'));
            }
            console.error(err);
        } finally {
            setIsLoading(false);
            if (searchQuery) setSearchQuery('');
        }
    }, [translate, searchQuery]);

    const handleGetMyLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setError(translate('Geolocation is not supported by your browser.'));
            return;
        }

        setIsLoading(true);
        setError(null);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const locationName = await getLocationNameForCoordinates(latitude, longitude);
                    setCurrentLocation({ name: locationName, lat: latitude, lon: longitude });
                    setZoom(10);
                } catch (err) {
                    if (err instanceof Error) {
                        setError(err.message);
                    } else {
                        setError(translate('Could not determine your location name.'));
                    }
                    setCurrentLocation({ name: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`, lat: latitude, lon: longitude });
                    setZoom(10);
                } finally {
                    setIsLoading(false);
                }
            },
            (err) => {
                console.error("Geolocation error:", err);
                setError(translate('Could not access your location. Please enable location services or search for a location manually.'));
                setIsLoading(false);
            }
        );
    }, [translate]);

    // Effect for initial location loading
    useEffect(() => {
        const initializeLocation = () => {
            if (!navigator.geolocation) {
                setError(translate('Geolocation not supported. Showing institution location.'));
                const fallbackLocation = user.institutionAddress || user.institutionName;
                handleSearch(fallbackLocation);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    handleGetMyLocation(); // On success, get the location details
                },
                (err) => {
                    console.error("Initial geolocation error:", err);
                    setError(translate('Location access denied. Showing institution location as fallback.'));
                    const fallbackLocation = user.institutionAddress || user.institutionName;
                    handleSearch(fallbackLocation);
                }
            );
        };
        initializeLocation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(searchQuery);
    };
    
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
    const windyTheme = theme === 'dark' ? 'dark' : 'light';

    useEffect(() => {
        const textsToRead: TTSText[] = [
            { id: 'windy-map-header', text: headerText },
            { id: 'windy-map-subheader', text: subHeaderText },
        ];
        registerTexts(textsToRead);
    }, [headerText, subHeaderText, registerTexts]);

    return (
        <div className="flex flex-col">
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
                {error && <ErrorMessage message={error} />}
                
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                     <button onClick={handleGetMyLocation} className="flex items-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold dark:bg-blue-900/50 dark:hover:bg-blue-900 dark:text-blue-200 rounded-full transition-colors">
                        <LocationIcon className="h-4 w-4" /> {translate('Use My Current Location')}
                    </button>
                    {currentLocation && (
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                            {translate('Showing data for:')} {currentLocation.name}
                        </span>
                    )}
                </div>
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

            <div className="w-full aspect-video max-h-[500px] bg-gray-200 dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                 {currentLocation ? (
                    <iframe
                        key={`${currentLocation.name}-${zoom}-${theme}`} // Force re-render on location/zoom/theme change
                        width="100%"
                        height="100%"
                        src={`https://embed.windy.com/embed.html?lat=${currentLocation.lat}&lon=${currentLocation.lon}&detailLat=${currentLocation.lat}&detailLon=${currentLocation.lon}&width=100%&height=100%&zoom=${zoom}&level=surface&overlay=wind&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B°C&radarRange=-1&theme=${windyTheme}`}
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
