/**
 * A centralized handler for API errors.
 * It parses different error types and returns a user-friendly string.
 * @param error The unknown error caught in a try-catch block.
 * @returns A user-friendly error message string.
 */
export function handleApiError(error: unknown): string {
  // Log the raw error for debugging purposes
  console.error("API Error caught by handler:", error);

  // Handle library-specific errors that have a 'message' property
  if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string') {
    return (error as any).message;
  }
  
  if (error instanceof Error) {
    // Check for common network errors (e.g., from fetch)
    if (error.message.toLowerCase().includes('failed to fetch')) {
      return 'Network connection failed. Please check your internet connection and try again.';
    }

    // Check if the error message is a JSON string from the Gemini API
    try {
      // The Gemini SDK sometimes stringifies the JSON error into the message
      const errorJson = JSON.parse(error.message);
      if (errorJson.error && errorJson.error.message) {
        // Provide specific API error message if available
        return `An API error occurred: ${errorJson.error.message}`;
      }
    } catch (e) {
      // Not a JSON error, so we fall through to return the generic error message
    }
    
    // Return the plain error message for other standard Error objects
    return error.message;
  }
  
  // Fallback for non-Error types
  return 'An unknown error occurred. Please try again later.';
}