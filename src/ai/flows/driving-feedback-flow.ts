
'use server';
/**
 * @fileOverview An AI flow to analyze a user's driving session log and provide feedback.
 *
 * - analyzeDrivingSession - A function that takes a description of a driving session and returns structured feedback.
 * - DrivingAnalysisInputSchema - The Zod schema for the input.
 * - DrivingAnalysisInput - The input type for the analyzeDrivingSession function.
 * - DrivingAnalysisOutput - The return type for the analyzeDrivingSession function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const DrivingAnalysisInputSchema = z.object({
  sessionDescription: z.string().describe("A user's description of their recent driving practice session."),
});
export type DrivingAnalysisInput = z.infer<typeof DrivingAnalysisInputSchema>;

export const DrivingAnalysisOutputSchema = z.object({
  positiveReinforcement: z.string().describe("Positive and encouraging feedback based on the user's description."),
  constructiveTips: z.string().describe("Actionable tips and advice for areas where the user struggled or can improve."),
  safetyReminder: z.string().describe("A relevant, general road safety tip related to the context of the driving session."),
});
export type DrivingAnalysisOutput = z.infer<typeof DrivingAnalysisOutputSchema>;

export async function analyzeDrivingSession(input: DrivingAnalysisInput): Promise<DrivingAnalysisOutput> {
  return drivingFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'drivingFeedbackPrompt',
  input: {schema: DrivingAnalysisInputSchema},
  output: {schema: DrivingAnalysisOutputSchema},
  prompt: `You are an expert, friendly, and encouraging driving instructor for Drivergy. Your goal is to provide helpful feedback to students based on their self-reported driving practice sessions.

Analyze the user's driving session description provided below. Based on their description, you must generate:
1.  **Positive Reinforcement:** Start by praising something they did well or a positive aspect of their practice. Be encouraging.
2.  **Constructive Tips:** Identify one or two areas where they seemed to struggle or could use advice. Provide clear, simple, and actionable tips to help them improve in those specific areas.
3.  **Safety Reminder:** Provide a general but relevant road safety tip that relates to the context of their session (e.g., if they mentioned traffic, give a tip about maintaining safe distance).

Keep your language simple, supportive, and easy to understand.

User's Driving Session Description:
{{{sessionDescription}}}
`,
});

const drivingFeedbackFlow = ai.defineFlow(
  {
    name: 'drivingFeedbackFlow',
    inputSchema: DrivingAnalysisInputSchema,
    outputSchema: DrivingAnalysisOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("Failed to generate driving analysis.");
    }
    return output;
  }
);
