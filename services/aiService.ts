import { GoogleGenAI, type GenerateContentParameters, type GenerateContentResponse, type GenerateImagesParameters, type GenerateImagesResponse, type Chat } from '@google/genai';
import { handleApiError } from './apiErrorHandler';

if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set. AI services will be unavailable.");
}

// Centralized AI client instance
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * A generic wrapper for the generateContent API call with centralized error handling.
 * @param params - The parameters for the generateContent call.
 * @returns A promise that resolves with the GenerateContentResponse.
 * @throws An error with a user-friendly message if the API call fails.
 */
export async function generateContent(params: GenerateContentParameters): Promise<GenerateContentResponse> {
    if (!process.env.API_KEY) {
        throw new Error("AI Service is not configured. Missing API Key.");
    }
    try {
        const response = await ai.models.generateContent(params);
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
    if (!process.env.API_KEY) {
        throw new Error("AI Service is not configured. Missing API Key.");
    }
    try {
        const response = await ai.models.generateImages(params);
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
     if (!process.env.API_KEY) {
        throw new Error("AI Service is not configured. Missing API Key.");
    }
    try {
        return ai.chats.create(params);
    } catch (error) {
        // Chat creation is synchronous and might not throw network errors, but we'll handle it just in case.
        throw new Error(handleApiError(error));
    }
}