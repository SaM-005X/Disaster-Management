import { GoogleGenAI, Type } from '@google/genai';
import type { Alert } from '../types';

// Simple in-memory cache for the session to avoid repeated API calls for the same location
const alertCache = new Map<string, Alert[]>();

export async function fetchRealTimeAlerts(location: string): Promise<Alert[]> {
  const cacheKey = location.toLowerCase().trim();
  if (alertCache.has(cacheKey)) {
    return alertCache.get(cacheKey) || [];
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Act as a national disaster alert system. Based on the current real-world date and the provided location, generate a realistic, short array of 0 to 3 disaster alerts.
  The location is: "${location}".
  
  For each alert, provide:
  1. "severity": Must be one of 'Warning' (imminent threat), 'Watch' (conditions are favorable for a threat), or 'Advisory' (less serious conditions, be aware).
  2. "title": A concise, impactful title (e.g., "Severe Thunderstorm Warning").
  3. "details": A brief, one-sentence summary of the alert.
  
  - If there are no credible threats for the location, return an empty array.
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
    console.error('Alert Generation API error:', error);
    // Return an empty array on error to prevent UI breakage
    return [];
  }
}