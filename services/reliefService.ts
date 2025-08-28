import { GoogleGenAI, Type } from '@google/genai';
import type { ReliefCamp } from '../types';
import { handleApiError } from './apiErrorHandler';

const reliefCache = new Map<string, ReliefCamp[]>();

export async function fetchReliefCamps(lat: number, lon: number): Promise<ReliefCamp[]> {
  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`; // Cache based on approximate location
  if (reliefCache.has(cacheKey)) {
    return reliefCache.get(cacheKey) || [];
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Act as a relief agency database. Find real, existing relief camps, shelters, or major NGOs (like Red Cross, Oxfam, local government shelters) that provide disaster assistance near the geographic coordinates: latitude ${lat}, longitude ${lon}.

List up to 6 relevant centers. For each center, provide:
1. "name": The official name of the camp or organization.
2. "type": A brief description of the services (e.g., "Flood Relief Camp", "Earthquake Shelter", "General Disaster Relief NGO").
3. "address": The full physical address.
4. "contact": A valid phone number or official website for contact.
5. "website": The official website URL (e.g., "https://www.redcross.org"). If a website is not available, return an empty string.
6. "latitude": The precise latitude as a number.
7. "longitude": The precise longitude as a number.

The response MUST be a valid JSON array of objects. Do not include centers that are not real. Prioritize government-run shelters and internationally recognized NGOs if possible. If no specific centers are known, list regional disaster management authority offices.`;

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
              name: { type: Type.STRING },
              type: { type: Type.STRING },
              address: { type: Type.STRING },
              contact: { type: Type.STRING },
              website: { type: Type.STRING },
              latitude: { type: Type.NUMBER },
              longitude: { type: Type.NUMBER },
            },
            required: ["name", "type", "address", "contact", "website", "latitude", "longitude"],
          },
        },
      },
    });

    let jsonString = response.text.trim();
    const jsonMatch = jsonString.match(/\[.*\]/s);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }
    
    const camps = JSON.parse(jsonString) as ReliefCamp[];
    reliefCache.set(cacheKey, camps);
    return camps;

  } catch (error) {
    const errorMessage = handleApiError(error);
    throw new Error(`Failed to fetch relief camp data: ${errorMessage}`);
  }
}