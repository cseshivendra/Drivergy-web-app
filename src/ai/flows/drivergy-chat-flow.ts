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
import { fetchUserById } from '@/lib/mock-data';
import type { UserProfile } from '@/types';

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

const prompt = ai.definePrompt({
  name: 'drivergyChatPrompt',
  input: {
    schema: z.object({
      query: z.string(),
      user: z.custom<UserProfile>().optional(),
    }),
  },
  output: {schema: ChatOutputSchema},
  prompt: `You are a friendly and helpful chatbot for "Drivergy", a modern platform for driving education. Your goal is to answer user questions about our services, courses, and pricing. Be conversational, concise, and clear.

Here is some key information about Drivergy:

**About Us:**
Our mission is to revolutionize driving education by providing a seamless, efficient, and transparent platform for both students and instructors. We connect aspiring drivers with qualified instructors.

**Founder & CEO:**
When asked about the founder or CEO, respond with: "Shivendra Singh is the Founder & CEO of Drivergy, from Prayagraj, Uttar Pradesh. He is a Senior Software Engineer by profession. To know more, you can visit his LinkedIn profile: https://www.linkedin.com/in/skyshivendra/".

**Company Location:**
When asked where Drivergy is from or based, state that its head office is in Gurugaon sector 33, Haryana.

**Services & Courses:**
1.  **Comprehensive Car Program:** Our flagship program for cars.
2.  **Motorcycle Rider Course:** To learn riding a two-wheeler safely.
3.  **RTO Test Preparation / License Assistance:** We help users pass the official RTO test.
4.  **Defensive Driving Courses:** For advanced driving techniques.

**Subscription Plans for Customers:**
- **Basic Plan:** ₹3,999. Includes 10 practical driving sessions, basic theory classes, and assistance for a learner's license.
- **Gold Plan:** ₹7,499. Includes 15 practical driving sessions, comprehensive theory, mock tests, and progress tracking.
- **Premium Plan:** ₹9,999 (Most Popular). Includes 20 practical driving sessions, advanced theory, defensive driving concepts, RTO test slot booking, and dedicated instructor support.

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
- **Subscription Plan:** {{user.subscriptionPlan}}
- **Account Status:** {{user.approvalStatus}}
- **Assigned Trainer:** {{#if user.assignedTrainerName}}{{user.assignedTrainerName}}{{else}}Not yet assigned{{/if}}
- **Next Lesson:** {{#if user.upcomingLesson}}{{user.upcomingLesson}}{{else}}Not yet scheduled{{/if}}
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
    let userProfile: UserProfile | null = null;
    if (input.userId) {
      userProfile = await fetchUserById(input.userId);
    }
    
    try {
      const {output} = await prompt({
          query: input.query,
          user: userProfile || undefined,
      });
      if (!output) {
        return { response: "I'm sorry, I had trouble generating a response. Please try again." };
      }
      return output;
    } catch (e) {
      console.error("Chatbot API error:", e);
      // It's better to return a user-friendly message. The console.error will log details for debugging.
      return { response: "I'm having some trouble right now. Please try again later." };
    }
  }
);
