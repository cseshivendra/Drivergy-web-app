import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import nextPlugin from '@genkit-ai/next';

// This is the correct configuration for Genkit in a Next.js app.
// The `nextPlugin` handles the server-side initialization and routing.
// We no longer manually pass the API key here; the plugin handles it.
export const ai = genkit({
  plugins: [
    googleAI(),
    nextPlugin(),
  ],
});
