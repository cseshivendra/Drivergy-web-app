import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import nextPlugin from '@genkit-ai/next';

// This file is the server-side entry point for all Genkit flows.
// It ensures that Genkit is initialized with the correct server-side
// credentials and handles all AI-related API requests.

genkit({
  plugins: [
    googleAI({
      // The API key is now correctly and securely read from the
      // server-side environment variables here.
      apiKey: process.env.GOOGLE_API_KEY,
    }),
    nextPlugin(),
  ],
});

export {GET, POST} from '@genkit-ai/next';
