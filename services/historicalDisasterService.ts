import { GoogleGenAI, Type } from '@google/genai';
import type { HistoricalDisaster, HazardType } from '../types';
import { handleApiError } from './apiErrorHandler';

const historyCache = new Map<string, HistoricalDisaster[]>();

export async function fetchHistoricalDisasters(): Promise<HistoricalDisaster[]> {
  const cacheKey = 'historical-disasters';
  if (historyCache.has(cacheKey)) {
    return historyCache.get(cacheKey)!;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Generate a diverse list of 10 major historical natural disasters from around the world.
  For each disaster, provide:
  1. "id": A unique string identifier (e.g., "dis-1").
  2. "eventName": The common name of the event (e.g., "2004 Indian Ocean earthquake and tsunami").
  3. "date": The month and year (e.g., "December 2004").
  4. "type": The primary hazard type. Must be one of: 'Earthquake', 'Flood', 'Cyclone', 'Fire', 'Landslide', 'Tsunami', 'Thunderstorm', 'Chemical Spill'.
  5. "location": The primary affected region/country.
  6. "fatalities": The estimated number of fatalities as an integer.
  7. "economicImpactUSD": The estimated economic impact in USD as a string (e.g., "230 Billion").
  8. "summary": A concise one-sentence summary of the event's impact.

  The response MUST be a valid JSON array of 10 disaster objects.
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
              id: { type: Type.STRING },
              eventName: { type: Type.STRING },
              date: { type: Type.STRING },
              type: { type: Type.STRING },
              location: { type: Type.STRING },
              fatalities: { type: Type.INTEGER },
              economicImpactUSD: { type: Type.STRING },
              summary: { type: Type.STRING },
            },
            required: ["id", "eventName", "date", "type", "location", "fatalities", "economicImpactUSD", "summary"],
          },
        },
      },
    });

    let jsonString = response.text.trim();
    const jsonMatch = jsonString.match(/\[.*\]/s);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }
    
    const disasters = JSON.parse(jsonString) as HistoricalDisaster[];
    historyCache.set(cacheKey, disasters);
    return disasters;

  } catch (error) {
    const errorMessage = handleApiError(error);
    throw new Error(`Failed to fetch historical disaster data: ${errorMessage}`);
  }
}