import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI({apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY})],
});
