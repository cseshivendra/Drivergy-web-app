
'use server';
/**
 * @fileOverview A chatbot flow for Drivergy.
 *
 * - chat - A function that handles chatbot queries.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { fetchUserById } from '@/lib/server-data';
import type { UserProfile } from '@/types';

const SUPPORTED_API_KEY_ENV_VARS = [
  'GOOGLE_API_KEY',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'GOOGLE_GENAI_API_KEY',
  'GEMINI_API_KEY',
] as const;

const DRIVERGY_CHAT_MODEL = process.env.DRIVERGY_CHAT_MODEL || 'googleai/gemini-1.5-flash';

const ChatInputSchema = z.object({
  query: z.string().describe("The user's question for the chatbot."),
  userId: z.string().optional().describe("The ID of the logged-in user, if available."),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe("The chatbot's answer to the user."),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  return drivergyChatFlow(input);
}

// Define a specific Zod schema for the user context passed to the prompt.
// By preparing the data beforehand, we can make all fields required here,
// which makes the prompt template simpler and more reliable.
const UserContextSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  uniqueId: z.string(),
  subscriptionPlan: z.string(),
  approvalStatus: z.string(),
  assignedTrainerName: z.string(),
  upcomingLesson: z.string(),
  completedLessons: z.number(),
  totalLessons: z.number(),
}).optional();

const prompt = ai.definePrompt({
  name: 'drivergyChatPrompt',
  model: DRIVERGY_CHAT_MODEL,
  input: {
    schema: z.object({
      query: z.string(),
      user: UserContextSchema,
    }),
  },
  output: {schema: ChatOutputSchema},
  prompt: `You are a very friendly and helpful chatbot for "Drivergy", a modern platform for driving education. Your goal is to answer user questions about our services, courses, and pricing. Be conversational, concise, and clear.

Here is some key information about Drivergy:

**About Us:**
Our mission is to revolutionize driving education by providing a seamless, efficient, and transparent platform for both students and instructors. We connect aspiring drivers with qualified instructors.

**Founder & CEO:**
When asked about the founder or CEO, respond with: "Shivendra Singh is the Founder & CEO of Drivergy, from Prayagraj, Uttar Pradesh. He is a Senior Software Engineer by profession. To know more, you can visit his LinkedIn profile: https://www.linkedin.com/in/skyshivendra/".

**COO:**
When asked about the COO, respond with: "Awdhesh Verma is the COO of Drivergy."

**Company Location:**
When asked where Drivergy is from or based, state that its head office is in Gurugaon sector 33, Haryana.

**Services & Courses:**
1.  **Comprehensive Car Program:** Our flagship program for cars.
2.  **Motorcycle Rider Course:** To learn riding a two-wheeler safely.
3.  **RTO Test Preparation / License Assistance:** We help users pass the official RTO test.
4.  **Defensive Driving Courses:** For advanced driving techniques.

**Subscription Plans for Customers:**
- **Basic Plan:** Offer price ₹3,999 (Original: ₹4,999). Includes 10 practical driving sessions, basic theory classes, learner's license assistance, and 15 sets of RTO test quizzes.
- **Gold Plan:** Offer price ₹7,499 (Original: ₹9,999). Includes 15 practical driving sessions, comprehensive theory, mock tests, progress tracking, and 15 sets of RTO test quizzes.
- **Premium Plan:** Offer price ₹9,999 (Original: ₹12,999, Most Popular). Includes 20 practical driving sessions, advanced theory, defensive driving concepts, RTO test slot booking, dedicated instructor support, and 15 sets of RTO test quizzes.

**For Trainers:**
Instructors can register on our platform to manage their schedule, track student progress, and grow their business.

**Frequently Asked Questions (FAQ):**
- **Q: What documents do I need to enroll?**
  A: For customer registration, you'll need a valid photo ID (like Aadhaar, PAN card, or Passport). If you already have a Learner's or Permanent License, you'll be asked to provide its details. Trainers need to provide their professional certifications and vehicle documents.
- **Q: Can I choose my instructor?**
  A: Yes! Our platform allows you to specify your preference for a male or female instructor during registration. We do our best to accommodate your choice based on instructor availability in your location.
- **Q: How do I book a driving lesson slot?**
  A: Once your registration is approved and you have an active subscription, you can log in to your customer dashboard. From there, you'll be able to view available slots for your chosen instructor and book them according to your convenience.
- **Q: What types of vehicles are available for training?**
  A: We offer training for both two-wheelers (scooters, motorcycles) and four-wheelers (manual and automatic cars). You can select your vehicle preference during registration.
- **Q: What if I need to cancel or reschedule a lesson?**
  A: You can manage your bookings through your dashboard. Please refer to our cancellation policy for details on timelines to avoid any charges. We recommend rescheduling at least 24 hours in advance.
- **Q: How do I redeem a coupon code?**
  A: You can apply a coupon or referral code on the payment page when you subscribe to a plan. Look for the 'Referral/Discount Code' field, enter your code, and click 'Apply' to see the discount on your total amount.
- **Q: How can I use the points earned from referrals?**
  A: Referral points you earn can be used to get discounts on your subscription renewals or for other services within the Drivergy platform. Currently, points cannot be withdrawn as cash but offer great value towards your learning journey.
- **Q: Is our driving school completion certificate valid at the RTO?**
  A: Drivergy Certificates are valid at RTO office as we are authorized partner.

{{#if user}}
You are currently speaking with {{user.name}}. If they ask a question about their own account, use the following information to answer them.
- **User ID:** {{user.uniqueId}}
- **Username:** {{user.username}}
- **Subscription Plan:** {{user.subscriptionPlan}}
- **Account Status:** {{user.approvalStatus}}
- **Assigned Trainer:** {{user.assignedTrainerName}}
- **Next Lesson:** {{user.upcomingLesson}}
- **Completed Lessons:** {{user.completedLessons}} out of {{user.totalLessons}}
{{/if}}

When asked about things outside of Drivergy, politely state that you can only answer questions about the driving school.

Now, please answer the user's question.
User query: {{{query}}}
`,
});

const drivergyChatFlow = ai.defineFlow(
  {
    name: 'drivergyChatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const hasGoogleApiKey = SUPPORTED_API_KEY_ENV_VARS.some((envVarName) => Boolean(process.env[envVarName]));
    if (!hasGoogleApiKey) {
      console.warn(
        `Drivergy Assistant is disabled because no Google AI API key is configured. Set one of: ${SUPPORTED_API_KEY_ENV_VARS.join(', ')}.`
      );
      return {
        response:
          "The Drivergy Assistant isn't available right now because the AI service hasn't been configured. Please set a valid Gemini/Google AI API key and try again.",
      };
    }

    let userProfile: UserProfile | null = null;
    // We only fetch the user profile if a userId is actually passed.
    // The prompt is designed to handle cases where there is no user.
    if (input.userId) {
      // Use the server action to securely fetch user data.
      userProfile = await fetchUserById(input.userId);
    }
    
    // Prepare a clean user context for the prompt, providing default values.
    // This makes the prompt template much simpler and more robust.
    const userContext = userProfile ? {
        id: userProfile.id,
        name: userProfile.name,
        username: userProfile.username || 'N/A',
        uniqueId: userProfile.uniqueId,
        subscriptionPlan: userProfile.subscriptionPlan,
        approvalStatus: userProfile.approvalStatus,
        assignedTrainerName: userProfile.assignedTrainerName ?? 'Not yet assigned',
        upcomingLesson: userProfile.upcomingLesson ?? 'Not yet scheduled',
        completedLessons: userProfile.completedLessons ?? 0,
        totalLessons: userProfile.totalLessons ?? 0,
    } : undefined;

    try {
      const {output} = await prompt({
          query: input.query,
          user: userContext,
      });
      if (!output) {
        return { response: "I'm sorry, I had trouble generating a response. Please try again." };
      }
      return output;
    } catch (e) {
      const rawErrorMessage = e instanceof Error ? e.message : String(e);
      const normalizedErrorMessage = rawErrorMessage.toLowerCase();

      console.error('Drivergy Assistant API error:', {
        message: rawErrorMessage,
        model: DRIVERGY_CHAT_MODEL,
      });

      if (
        normalizedErrorMessage.includes('api key') ||
        normalizedErrorMessage.includes('unauthorized') ||
        normalizedErrorMessage.includes('permission denied') ||
        normalizedErrorMessage.includes('auth')
      ) {
        return {
          response:
            "Drivergy Assistant couldn't authenticate with the AI service. Please verify your Gemini/Google API key configuration.",
        };
      }

      if (
        normalizedErrorMessage.includes('quota') ||
        normalizedErrorMessage.includes('rate limit') ||
        normalizedErrorMessage.includes('resource_exhausted')
      ) {
        return {
          response:
            "Drivergy Assistant is temporarily unavailable because the AI usage limit has been reached. Please try again shortly.",
        };
      }

      if (
        normalizedErrorMessage.includes('model') &&
        (normalizedErrorMessage.includes('not found') || normalizedErrorMessage.includes('unsupported'))
      ) {
        return {
          response:
            `Drivergy Assistant is misconfigured with an unavailable AI model (${DRIVERGY_CHAT_MODEL}). Please update DRIVERGY_CHAT_MODEL or use the default model.`,
        };
      }

      return { response: "I'm having some trouble right now. Please try again later." };
    }
  }
);
