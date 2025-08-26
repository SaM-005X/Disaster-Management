import { GoogleGenAI, Type } from '@google/genai';

// Simple in-memory cache for the session
const apiCache = new Map<string, any>();

export async function fetchTranslations(
  texts: string[],
  targetLanguage: string
): Promise<Record<string, string>> {
  const cacheKey = `${targetLanguage}-${texts.sort().join('|')}`;
  if (apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }

  if (texts.length === 0) {
    return {};
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Translate the following JSON array of strings into ${targetLanguage}.
Respond with a single JSON array containing the translated strings in the exact same order.
The output MUST be a valid JSON array of strings, with no extra text, explanations, or markdown formatting like \`\`\`json.`;

  const contents = `${prompt}\n\n${JSON.stringify(texts)}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
      },
    });

    let jsonString = response.text.trim();
    // More robustly extract the JSON array from the response string,
    // in case the model adds any conversational text.
    const jsonMatch = jsonString.match(/\[.*\]/s);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }
    
    const translatedTexts: string[] = JSON.parse(jsonString);

    if (translatedTexts.length !== texts.length) {
      console.error("Mismatched translation count from API. Falling back to original texts.");
      throw new Error("Mismatched translation count from API.");
    }
    
    const resultMap: Record<string, string> = {};
    texts.forEach((originalText, index) => {
      // Use translated text, or fallback to original if a specific translation is empty/null
      resultMap[originalText] = translatedTexts[index] || originalText;
    });
    
    apiCache.set(cacheKey, resultMap);
    return resultMap;
  } catch (error) {
    console.error('Translation API error:', error);
    // On error, return originals so the UI doesn't break
    const errorMap: Record<string, string> = {};
    texts.forEach(text => {
      errorMap[text] = text;
    });
    return errorMap;
  }
}
