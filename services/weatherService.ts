import { GoogleGenAI, Type } from '@google/genai';
import type { ForecastDay } from '../types';
import { handleApiError } from './apiErrorHandler';

const weatherCache = new Map<string, ForecastDay[]>();

export async function fetchWeatherForecast(location: string): Promise<ForecastDay[]> {
  const cacheKey = location.toLowerCase().trim();
  if (weatherCache.has(cacheKey)) {
    return weatherCache.get(cacheKey) || [];
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Based on the current real-world date, generate a 7-day weather forecast for the location: "${location}".
  
  For each of the 7 days, provide:
  1. "day": The day of the week (e.g., "Monday").
  2. "date": The calendar date (e.g., "July 29").
  3. "highTemp": The high temperature in Celsius.
  4. "lowTemp": The low temperature in Celsius.
  5. "condition": A brief, one or two-word weather description (e.g., "Sunny", "Partly Cloudy", "Showers", "Thunderstorms", "Windy").
  6. "windSpeed": The average wind speed in km/h.
  7. "windDirection": The cardinal wind direction (e.g., 'N', 'SW', 'E').
  8. "precipitationChance": The chance of precipitation as a percentage (0-100).

  The response MUST be a valid JSON array of 7 forecast objects, with no extra text, explanations, or markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.STRING },
              date: { type: Type.STRING },
              highTemp: { type: Type.INTEGER },
              lowTemp: { type: Type.INTEGER },
              condition: { type: Type.STRING },
              windSpeed: { type: Type.INTEGER },
              windDirection: { type: Type.STRING },
              precipitationChance: { type: Type.INTEGER },
            },
            required: ["day", "date", "highTemp", "lowTemp", "condition", "windSpeed", "windDirection", "precipitationChance"],
          },
        },
      },
    });

    let jsonString = response.text.trim();
    const jsonMatch = jsonString.match(/\[.*\]/s);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }
    
    const forecast = JSON.parse(jsonString) as ForecastDay[];
    weatherCache.set(cacheKey, forecast);
    return forecast;

  } catch (error) {
    const errorMessage = handleApiError(error);
    throw new Error(`Failed to fetch weather forecast: ${errorMessage}`);
  }
}
