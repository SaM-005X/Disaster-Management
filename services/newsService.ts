import { Type } from '@google/genai';
import type { NewsArticle } from '../types';
import { generateContent } from './aiService';

const newsCache = new Map<string, NewsArticle[]>();

const MOCK_LATEST_NEWS: NewsArticle[] = [
  {
    id: 'mock-latest-1',
    title: 'Severe Cyclonic Storm Approaches East Coast',
    summary: 'A powerful cyclonic storm is expected to make landfall in the next 48 hours, with authorities issuing high alerts for coastal regions.',
    imageUrl: 'https://images.unsplash.com/photo-1561079545-a72c1c7511a7?q=80&w=800',
    source: 'National Weather Service',
    link: '#',
    type: 'latest',
  },
  {
    id: 'mock-latest-2',
    title: 'Flash Floods Inundate Northern Plains',
    summary: 'Unexpectedly heavy monsoon rains have led to severe flash flooding, displacing thousands and disrupting transport networks.',
    imageUrl: 'https://images.unsplash.com/photo-1581723522203-b82b99216335?q=80&w=800',
    source: 'Associated Press',
    link: '#',
    type: 'latest',
  },
  {
    id: 'mock-latest-3',
    title: 'Heatwave Advisory Issued for Central Regions',
    summary: 'A prolonged period of extreme heat is forecast, with temperatures expected to exceed 45°C, posing health risks.',
    imageUrl: 'https://images.unsplash.com/photo-1504370805625-d32c54b16100?q=80&w=800',
    source: 'Reuters',
    link: '#',
    type: 'latest',
  },
  {
    id: 'mock-latest-4',
    title: 'Minor Earthquake Rattles Himalayan Foothills',
    summary: 'A moderate earthquake of magnitude 4.8 was recorded, causing minor tremors but no significant damage has been reported.',
    imageUrl: 'https://images.unsplash.com/photo-1590412015525-26335446a89c?q=80&w=800',
    source: 'Geological Survey',
    link: '#',
    type: 'latest',
  }
];

const MOCK_PREVIOUS_NEWS: NewsArticle[] = [
  {
    id: 'mock-prev-1',
    title: 'Retrospective: 2018 Kerala Floods',
    summary: 'A look back at the devastating floods in Kerala caused by extreme monsoon rainfall, highlighting lessons learned in disaster response.',
    imageUrl: 'https://images.unsplash.com/photo-1547823334-2a62a69b7245?q=80&w=800',
    source: 'Historical Archives',
    link: '#',
    type: 'previous',
  },
  {
    id: 'mock-prev-2',
    title: 'The Great Bhuj Earthquake of 2001',
    summary: 'Analyzing the catastrophic earthquake that struck Gujarat, leading to significant changes in India\'s seismic safety codes.',
    imageUrl: 'https://images.unsplash.com/photo-1619451998-3335824e4a2e?q=80&w=800',
    source: 'The Times',
    link: '#',
    type: 'previous',
  },
  {
    id: 'mock-prev-3',
    title: 'Impact of the 1999 Odisha Super Cyclone',
    summary: 'Remembering one of the most intense tropical cyclones in the North Indian Ocean and its long-term impact on coastal communities.',
    imageUrl: 'https://images.unsplash.com/photo-1603888399589-56839a8f4c28?q=80&w=800',
    source: 'Disaster Chronicle',
    link: '#',
    type: 'previous',
  },
  {
    id: 'mock-prev-4',
    title: 'Learning from the 2004 Indian Ocean Tsunami',
    summary: 'A review of the event that reshaped disaster management and early warning systems across the entire region.',
    imageUrl: 'https://images.unsplash.com/photo-1599385552344-484175376131?q=80&w=800',
    source: 'Global Watch',
    link: '#',
    type: 'previous',
  }
];

export async function fetchNews(type: 'latest' | 'previous'): Promise<NewsArticle[]> {
  const cacheKey = `news-${type}`;
  if (newsCache.has(cacheKey)) {
    return newsCache.get(cacheKey) || [];
  }

  // --- START OF GUARD FOR MISSING API KEY ---
  if (!process.env.API_KEY) {
    console.warn("API_KEY is not configured. Returning mock news data.");
    const mockData = type === 'latest' ? MOCK_LATEST_NEWS : MOCK_PREVIOUS_NEWS;
    newsCache.set(cacheKey, mockData);
    return mockData;
  }
  // --- END OF GUARD FOR MISSING API KEY ---


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
