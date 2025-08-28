import { GoogleGenAI, Type } from '@google/genai';
import { handleApiError } from './apiErrorHandler';

const geocodingCache = new Map<string, { lat: number; lon: number }>();
const reverseGeocodingCache = new Map<string, string>();

export async function getCoordinatesForLocation(locationName: string): Promise<{ lat: number; lon: number }> {
    const cacheKey = locationName.toLowerCase().trim();
    if (geocodingCache.has(cacheKey)) {
        return geocodingCache.get(cacheKey)!;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `Find the geographic coordinates (latitude and longitude) for the following location: "${locationName}".
    
    Respond ONLY with a valid JSON object with "lat" and "lon" keys. Example: { "lat": 40.7128, "lon": -74.0060 }`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        lat: { type: Type.NUMBER },
                        lon: { type: Type.NUMBER },
                    },
                    required: ["lat", "lon"],
                },
            },
        });

        let jsonString = response.text.trim();
        const coords = JSON.parse(jsonString);
        
        if (typeof coords.lat !== 'number' || typeof coords.lon !== 'number') {
            throw new Error("Invalid coordinate format received from API.");
        }

        geocodingCache.set(cacheKey, coords);
        return coords;

    } catch (error) {
        const errorMessage = handleApiError(error);
        throw new Error(`Failed to get coordinates for "${locationName}": ${errorMessage}`);
    }
}

export async function getLocationNameForCoordinates(lat: number, lon: number): Promise<string> {
    const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    if (reverseGeocodingCache.has(cacheKey)) {
        return reverseGeocodingCache.get(cacheKey)!;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `Provide a concise location name (e.g., "City, Country") for the coordinates: latitude ${lat}, longitude ${lon}.
    Respond ONLY with the location name as a plain string, without any introductory text, labels, or markdown.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const locationName = response.text.trim();
        
        if (!locationName) {
            throw new Error("Received empty location name from API.");
        }

        reverseGeocodingCache.set(cacheKey, locationName);
        return locationName;
    } catch (error) {
        const errorMessage = handleApiError(error);
        console.error('Reverse Geocoding API error:', errorMessage);
        // Fallback to a generic coordinate string if API fails
        return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    }
}
