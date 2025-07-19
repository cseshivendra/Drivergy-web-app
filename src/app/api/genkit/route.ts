// IMPORTANT: This file is the new, correct way to expose Genkit flows in Next.js
// It imports your flow and makes it available as a standard API endpoint.
import {genkitNext} from '@genkit-ai/next';
import '@/ai/flows/drivergy-chat-flow';

export const {GET, POST} = genkitNext();
