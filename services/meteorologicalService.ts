import { Type } from '@google/genai';
import type { Alert, ForecastDay, ReliefCamp } from '../types';
import { generateContent } from './aiService';

const meteorologicalCache = new Map<string, MeteorologicalData>();

export interface MeteorologicalData {
    alerts: Alert[];
    forecast: ForecastDay[];
    reliefCamps: ReliefCamp[];
}

export async function fetchMeteorologicalData(lat: number, lon: number, locationName: string): Promise<MeteorologicalData> {
    const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    if (meteorologicalCache.has(cacheKey)) {
        return meteorologicalCache.get(cacheKey)!;
    }

    const prompt = `You are a hyperlocal disaster preparedness information provider. Based on the current real-world date and the provided location, generate a comprehensive report.

Location Name: "${locationName}"
Coordinates: Latitude ${lat}, Longitude ${lon}

Your response MUST be a single, valid JSON object with no other text or markdown. The object must contain three top-level keys: "alerts", "forecast", and "reliefCamps".
Do not return mock or placeholder data. The data must be realistic and based on the provided location.

The JSON schema MUST be as follows:
{
  "alerts": [
    {
      "severity": "Warning" | "Watch" | "Advisory",
      "title": "Concise alert title",
      "details": "Brief one-sentence summary"
    }
  ],
  "forecast": [
    {
      "day": "Day of the week (e.g., 'Monday')",
      "date": "Calendar date (e.g., 'July 29')",
      "highTemp": "number (Celsius)",
      "lowTemp": "number (Celsius)",
      "condition": "Brief weather description (e.g., 'Sunny', 'Thunderstorms')",
      "windSpeed": "number (km/h)",
      "windDirection": "Cardinal direction (e.g., 'NW')",
      "precipitationChance": "number (0-100)"
    }
  ],
  "reliefCamps": [
    {
      "name": "Official name of the camp or organization",
      "type": "Type of service (e.g., 'Flood Relief Camp')",
      "address": "Full physical address",
      "contact": "Valid phone number or official website for contact",
      "website": "Official website URL or an empty string",
      "latitude": "number",
      "longitude": "number"
    }
  ]
}

- For "alerts", generate 0 to 3 relevant, realistic alerts.
- For "forecast", generate exactly 7 days of weather forecast.
- For "reliefCamps", find up to 6 real, existing relief centers or major NGOs near the provided coordinates.
`;

    try {
        const response = await generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        alerts: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    severity: { type: Type.STRING },
                                    title: { type: Type.STRING },
                                    details: { type: Type.STRING },
                                },
                                required: ["severity", "title", "details"],
                            }
                        },
                        forecast: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    day: { type: Type.STRING },
                                    date: { type: Type.STRING },
                                    highTemp: { type: Type.NUMBER },
                                    lowTemp: { type: Type.NUMBER },
                                    condition: { type: Type.STRING },
                                    windSpeed: { type: Type.NUMBER },
                                    windDirection: { type: Type.STRING },
                                    precipitationChance: { type: Type.NUMBER },
                                },
                                required: ["day", "date", "highTemp", "lowTemp", "condition", "windSpeed", "windDirection", "precipitationChance"],
                            }
                        },
                        reliefCamps: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    type: { type: Type.STRING },
                                    address: { type: Type.STRING },
                                    contact: { type: Type.STRING },
                                    website: { type: Type.STRING },
                                    latitude: { type: Type.NUMBER },
                                    longitude: { type: Type.NUMBER },
                                },
                                required: ["name", "type", "address", "contact", "website", "latitude", "longitude"],
                            }
                        }
                    },
                    required: ["alerts", "forecast", "reliefCamps"]
                }
            }
        });
        
        const data = JSON.parse(response.text.trim()) as MeteorologicalData;
        meteorologicalCache.set(cacheKey, data);
        return data;

    } catch (error) {
        throw new Error(`Failed to fetch meteorological data: ${error instanceof Error ? error.message : String(error)}`);
    }
}
