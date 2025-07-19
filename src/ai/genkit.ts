import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// By not passing any configuration to googleAI(), it will automatically
// look for the API key in the environment variables (e.g., GOOGLE_API_KEY).
// This is the most robust method for Vercel deployments.
export const ai = genkit({
  plugins: [googleAI()],
});
