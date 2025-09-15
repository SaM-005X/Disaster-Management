import React, { useState, useEffect } from 'react';
import { useTranslate } from '../contexts/TranslationContext';
import { useTTS, type TTSText } from '../contexts/TTSContext';
import type { ForecastDay } from '../types';
import { WeatherIcon } from './icons/WeatherIcon';
import { WindArrowIcon } from './icons/WindArrowIcon';
import ErrorMessage from './ErrorMessage';

interface WeatherForecastProps {
    locationName: string;
    forecast: ForecastDay[] | null;
    isLoading: boolean;
    error: string | null;
}

const ForecastDayCard: React.FC<{ day: ForecastDay; isHighlighted: boolean }> = ({ day, isHighlighted }) => {
    const { translate } = useTranslate();
    return (
        <div className={`p-4 rounded-lg flex flex-col items-center text-center ${isHighlighted ? 'tts-highlight' : 'bg-gray-100 dark:bg-gray-700'}`}>
            <p className="font-bold text-gray-800 dark:text-white">{translate(day.day)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{day.date}</p>
            <WeatherIcon condition={day.condition} className="h-10 w-10 text-teal-500 my-2" />
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{day.highTemp}° / {day.lowTemp}°C</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 capitalize">{translate(day.condition)}</p>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-1">
                <p>💧 {day.precipitationChance}%</p>
                <p className="flex items-center justify-center gap-1">
                    <WindArrowIcon direction={day.windDirection} className="h-3 w-3" /> 
                    {day.windSpeed} km/h
                </p>
            </div>
        </div>
    );
};


const WeatherForecast: React.FC<WeatherForecastProps> = ({ locationName, forecast, isLoading, error }) => {
    const { translate } = useTranslate();
    const { registerTexts, currentlySpokenId } = useTTS();

    useEffect(() => {
        if (forecast) {
            const textsToRead: TTSText[] = [];
            textsToRead.push({ id: 'forecast-header', text: `${translate('7-Day Forecast for')} ${locationName}` });
            forecast.forEach((day, index) => {
                textsToRead.push({
                    id: `forecast-day-${index}`,
                    text: `${translate(day.day)}, ${day.date}. ${translate(day.condition)}. High of ${day.highTemp} degrees, low of ${day.lowTemp} degrees Celsius. Wind from the ${day.windDirection} at ${day.windSpeed} kilometers per hour. Chance of precipitation ${day.precipitationChance} percent.`
                });
            });
            registerTexts(textsToRead);
        }
    }, [forecast, locationName, registerTexts, translate]);

    if (isLoading) {
        return (
            <div className="mt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {Array.from({ length: 7 }).map((_, index) => (
                        <div key={index} className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse">
                            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mx-auto mb-2"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mx-auto mb-3"></div>
                            <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto my-2"></div>
                            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mx-auto mt-1"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return <ErrorMessage message={error} className="mt-6" />;
    }
    
    if (!forecast || forecast.length === 0) {
        return <ErrorMessage message={translate('Could not find forecast data for this specific location.')} className="mt-6" />
    }

    return (
        <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
            <h2 id="forecast-header" className={`text-2xl font-bold text-gray-800 dark:text-white mb-4 ${currentlySpokenId === 'forecast-header' ? 'tts-highlight' : ''}`}>
                {translate('7-Day Forecast for')} <span className="text-teal-600 dark:text-teal-400">{locationName.split(',')[0]}</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-4">
                {forecast?.map((day, index) => (
                    <ForecastDayCard key={index} day={day} isHighlighted={currentlySpokenId === `forecast-day-${index}`} />
                ))}
            </div>
        </div>
    );
};

export default WeatherForecast;
