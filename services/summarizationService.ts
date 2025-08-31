import { generateContent } from './aiService';

const summaryCache = new Map<string, string>();

export async function generateSummaryFromTitle(title: string, existingSummary?: string): Promise<string> {
  const cacheKey = title;
  if (summaryCache.has(cacheKey)) {
    return summaryCache.get(cacheKey)!;
  }

  const prompt = `You are a news editor. The following news article has a weak or missing summary. Based on the title, write a new, more informative one-sentence summary. Respond ONLY with the summary text, without any introductory phrases like "Here is a summary:".

Title: "${title}"
${existingSummary ? `Existing Summary: "${existingSummary}"` : ''}

New One-Sentence Summary:`;

  try {
    const response = await generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    const newSummary = response.text.trim();
    if (!newSummary) {
        throw new Error("Generated summary was empty.");
    }

    summaryCache.set(cacheKey, newSummary);
    return newSummary;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to generate summary for title "${title}":`, errorMessage);
    // On failure, return the best available text to avoid showing nothing.
    return existingSummary || title;
  }
}
