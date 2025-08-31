import { Type } from '@google/genai';
import type { NewsArticle } from '../types';
import { generateContent } from './aiService';

const newsCache = new Map<string, NewsArticle[]>();

export async function fetchNews(type: 'latest' | 'previous'): Promise<NewsArticle[]> {
  const cacheKey = `news-${type}`;
  if (newsCache.has(cacheKey)) {
    return newsCache.get(cacheKey) || [];
  }

  // The 'latest' news fetching remains unchanged as it's for recent, AI-generated content.
  if (type === 'latest') {
    const prompt = `Generate a list of 4 recent and significant real-world meteorological and disaster-related news events from around the globe. The events should be from the last few weeks. For each event, provide a catchy title, a one-sentence summary, a relevant and high-quality image URL from a stock photo site like Pexels, Unsplash, or Pixabay (ensure it's a direct image link), a major news source (e.g., "Reuters", "Associated Press"), and a valid link to a real news article about the event.`;
    try {
        const response = await generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                    title: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    imageUrl: { type: Type.STRING },
                    source: { type: Type.STRING },
                    link: { type: Type.STRING },
                    },
                    required: ["title", "summary", "imageUrl", "source", "link"],
                },
                },
            },
        });

        let jsonString = response.text.trim();
        const jsonMatch = jsonString.match(/\[.*\]/s);
        if (jsonMatch) {
            jsonString = jsonMatch[0];
        }
        
        const articles = JSON.parse(jsonString) as NewsArticle[];
        newsCache.set(cacheKey, articles);
        return articles;
    } catch (error) {
        throw new Error(`Failed to fetch news: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // --- NEW IMPLEMENTATION FOR 'previous' using Google Search Grounding ---
  if (type === 'previous') {
    const prompt = `You are a historical news archivist. Use Google Search to find information about 4 major historical meteorological and disaster-related news events from the past (more than 1 year ago).

For each event, provide:
1.  A title.
2.  A one-sentence summary of its impact.
3.  A relevant and high-quality image URL from a stock photo site (Pexels, Unsplash, Pixabay).
4.  The name of a major historical news source.

CRITICAL: Format your entire response as a single, valid JSON array of objects, where each object represents a news article. Do not include any other text, explanations, or markdown formatting like \`\`\`json. Each object should have keys: "title", "summary", "imageUrl", "source".`;

    try {
      const response = await generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      // Extract generated content and grounding data
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const uris = groundingChunks.map((chunk: any) => chunk.web?.uri).filter(Boolean);

      let articles: Omit<NewsArticle, 'link'>[] = [];
      try {
        let jsonString = response.text.trim();
        const jsonMatch = jsonString.match(/\[.*\]/s);
        if (jsonMatch) {
            jsonString = jsonMatch[0];
            articles = JSON.parse(jsonString);
        } else {
            console.error("Could not find a JSON array in the grounded response.");
            throw new Error("Invalid format from grounded search response.");
        }
      } catch (parseError) {
        console.error("Failed to parse grounded search response as JSON:", response.text);
        throw new Error("Could not parse the historical news data.");
      }

      // Combine articles with grounded URIs
      const groundedArticles: NewsArticle[] = articles.map((article, index) => ({
        ...article,
        // Assign a URI from grounding data, if available at the same index
        link: uris[index] || '#', // Use '#' as a fallback if no link is found
      }));
      
      newsCache.set(cacheKey, groundedArticles);
      return groundedArticles;

    } catch (error) {
        throw new Error(`Failed to fetch historical news: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Fallback for an unknown type, though this shouldn't be reached.
  return [];
}
