import { generateContent } from './aiService';

const safeMarkdownToHTML = (text: string | undefined | null): string => {
    if (!text) return '';
    const escapedText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    const blocks = escapedText.split(/(\r?\n){2,}/);
    const htmlBlocks = blocks.map(block => {
        if (!block || block.trim() === '') return '';
        const lines = block.trim().split(/\r?\n/);
        if (lines.every(line => /^\s*[-*]\s/.test(line))) {
            const listItems = lines.map(line => `<li>${line.replace(/^\s*[-*]\s+/, '')}</li>`).join('');
            return `<ul class="list-disc list-inside space-y-1">${listItems}</ul>`;
        }
        if (lines.every(line => /^\s*\d+\.\s/.test(line))) {
            const listItems = lines.map(line => `<li>${line.replace(/^\s*\d+\.\s+/, '')}</li>`).join('');
            return `<ol class="list-decimal list-inside space-y-1">${listItems}</ul>`;
        }
        return `<p>${block.replace(/\r?\n/g, '<br />')}</p>`;
    });
    let finalHtml = htmlBlocks.join('');
    finalHtml = finalHtml.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
    return finalHtml;
};


export async function summarizeContent(content: string): Promise<string> {
  const prompt = `Summarize the following text into a few key bullet points. The text is from a user's personal notebook. Use markdown for formatting.

Text to summarize:
---
${content}
---`;

  try {
    const response = await generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return safeMarkdownToHTML(response.text.trim());
  } catch (error) {
    throw error; // The aiService wrapper already formats the error
  }
}

export async function suggestNextSteps(content: string, title: string): Promise<string> {
    const prompt = `Based on the following note/task from a user's notebook, suggest 3-5 actionable next steps or related ideas. The suggestions should be concise and formatted as a markdown list.

Note Title: "${title}"
Note Content:
---
${content}
---`;

    try {
        const response = await generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return safeMarkdownToHTML(response.text.trim());
    } catch (error) {
        throw error;
    }
}

export async function explainConcept(content: string): Promise<string> {
    const prompt = `Act as a helpful tutor. Explain the key concepts found in the following text in a simple and clear way. Use analogies if helpful. Format the explanation with markdown for readability.

Text to explain:
---
${content}
---`;
    try {
        const response = await generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return safeMarkdownToHTML(response.text.trim());
    } catch (error) {
        throw error;
    }
}
