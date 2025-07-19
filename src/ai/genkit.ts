import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// By explicitly passing the apiKey from the environment variables,
// we ensure the Genkit plugin is initialized correctly in Vercel's
// serverless environment, avoiding any potential race conditions.
// The environment variable GOOGLE_API_KEY must be set in Vercel.
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY,
    }),
  ],
});
