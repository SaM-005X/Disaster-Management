import { GoogleGenAI, type GenerateContentParameters, type GenerateContentResponse, type GenerateImagesParameters, type GenerateImagesResponse, type Chat } from '@google/genai';
import { handleApiError } from './apiErrorHandler';

// Lazily initialize the AI client to avoid crashing on module load if the API key is missing.
let ai: GoogleGenAI | null = null;

/**
 * Gets the singleton instance of the GoogleGenAI client.
 * Initializes it on the first call.
 * @throws An error if the API key is not configured.
 * @returns The initialized GoogleGenAI client.
 */
function getAiClient(): GoogleGenAI {
    if (ai) {
        return ai;
    }
    if (!process.env.API_KEY) {
        // This error will now be thrown when an AI function is called, not on app load.
        // This allows the app to load and show a more graceful error in the UI.
        throw new Error("AI Service is not configured: Missing GOOGLE_API_KEY environment variable.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai;
}

/**
 * A generic wrapper for the generateContent API call with centralized error handling.
 * @param params - The parameters for the generateContent call.
 * @returns A promise that resolves with the GenerateContentResponse.
 * @throws An error with a user-friendly message if the API call fails.
 */
export async function generateContent(params: GenerateContentParameters): Promise<GenerateContentResponse> {
    try {
        const client = getAiClient();
        const response = await client.models.generateContent(params);
        return response;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
}

/**
 * A wrapper for the generateImages API call with centralized error handling.
 * @param params - The parameters for the generateImages call.
 * @returns A promise that resolves with the GenerateImagesResponse.
 * @throws An error with a user-friendly message if the API call fails.
 */
export async function generateImages(params: GenerateImagesParameters): Promise<GenerateImagesResponse> {
    try {
        const client = getAiClient();
        const response = await client.models.generateImages(params);
        return response;
    } catch (error) {
        throw new Error(handleApiError(error));
    }
}

/**
 * A wrapper for creating a new chat session with centralized error handling.
 * @param params - The parameters for creating the chat session, including 'model' and 'config'.
 * @returns A Chat instance.
 * @throws An error with a user-friendly message if chat creation fails.
 */
export function createChatSession(params: Omit<GenerateContentParameters, 'contents'>): Chat {
    try {
        const client = getAiClient();
        return client.chats.create(params);
    } catch (error) {
        // Chat creation might not be async, but we'll handle errors just in case.
        throw new Error(handleApiError(error));
    }
}