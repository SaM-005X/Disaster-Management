import { GoogleGenAI, Type } from '@google/genai';
import type { Alert } from '../types';
import { handleApiError } from './apiErrorHandler';

// Simple in-memory cache for the session to avoid repeated API calls for the same location
const alertCache = new Map<string, Alert[]>();

// A function to return plausible, generic mock alerts when the API fails.
const getMockAlerts = (): Alert[] => [
    {
      severity: 'Advisory',
      title: 'Monsoon Season Advisory',
      details: 'Increased rainfall is expected in the coming weeks. Check for localized waterlogging and plan travel accordingly.'
    },
    {
      severity: 'Watch',
      title: 'High Temperatures Watch',
      details: 'Temperatures are expected to rise. Stay hydrated and avoid outdoor activities during peak afternoon hours.'
    }
];

export async function fetchRealTimeAlerts(location: string): Promise<Alert[]> {
  const cacheKey = location.toLowerCase().trim();
  if (alertCache.has(cacheKey)) {
    return alertCache.get(cacheKey) || [];
  }

  // --- START OF GUARD FOR MISSING API KEY ---
  // If the API_KEY environment variable is not set, immediately return mock data
  // to prevent an inevitable API error and ensure the UI remains functional.
  if (!process.env.API_KEY) {
      console.warn("API_KEY is not configured. Returning mock alert data.");
      const mockAlerts = getMockAlerts();
      alertCache.set(cacheKey, mockAlerts);
      return mockAlerts;
  }
  // --- END OF GUARD FOR MISSING API KEY ---

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Act as a national disaster alert system. Based on the current real-world date and the provided location, generate a realistic, short array of 0 to 3 disaster alerts.
  The location is: "${location}".
  
  For each alert, provide:
  1. "severity": Must be one of 'Warning' (imminent threat), 'Watch' (conditions are favorable for a threat), or 'Advisory' (less serious conditions, be aware).
  2. "title": A concise, impactful title (e.g., "Severe Thunderstorm Warning").
  3. "details": A brief, one-sentence summary of the alert.
  
  - Your goal is to be proactive. Generate at least one relevant alert (including less severe advisories like heat or wind) if there is any plausible weather event. Only return an empty array if conditions are perfectly clear and unremarkable.
  - Prioritize common weather or geographical events relevant to the location (e.g., cyclones in coastal areas, heatwaves in summer).
  - The response MUST be a valid JSON array of alert objects, with no extra text, explanations, or markdown.`;

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
              severity: { type: Type.STRING },
              title: { type: Type.STRING },
              details: { type: Type.STRING },
            },
            required: ["severity", "title", "details"],
          },
        },
      },
    });

    let jsonString = response.text.trim();
    const jsonMatch = jsonString.match(/\[.*\]/s);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }

    const alerts = JSON.parse(jsonString) as Alert[];
    
    // Validate severity and filter out any invalid ones
    const validAlerts = alerts.filter(alert => ['Warning', 'Watch', 'Advisory'].includes(alert.severity));

    alertCache.set(cacheKey, validAlerts);
    return validAlerts;

  } catch (error) {
    const errorMessage = handleApiError(error);
    console.error('Alert Generation API error:', errorMessage);
    // Re-throw the error to be handled by the calling component.
    throw new Error(errorMessage);
  }
}
