'use server';

import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Ensure that the Twilio client is only initialized if the credentials are provided.
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Sends an SMS message using Twilio.
 * @param to - The recipient's phone number in E.164 format (e.g., +919876543210).
 * @param body - The text content of the message.
 * @returns A promise that resolves to the message SID on success.
 */
export const sendSms = async (to: string, body: string): Promise<string> => {
  if (!client) {
    const errorMessage = 'Twilio client is not initialized. Please check your TWILIO environment variables.';
    console.error(`SMS Error: ${errorMessage}`);
    // In a real application, you might not want to throw an error that crashes the server,
    // but for development, this makes it clear that configuration is missing.
    throw new Error(errorMessage);
  }

  if (!twilioPhoneNumber) {
     const errorMessage = 'Twilio phone number is not configured in environment variables (TWILIO_PHONE_NUMBER).';
     console.error(`SMS Error: ${errorMessage}`);
     throw new Error(errorMessage);
  }
  
  if (!to.startsWith('+')) {
      const errorMessage = `Invalid "To" phone number: ${to}. It must be in E.164 format (e.g., +919876543210).`;
      console.error(`SMS Error: ${errorMessage}`);
      throw new Error(errorMessage);
  }

  try {
    const message = await client.messages.create({
      body: body,
      from: twilioPhoneNumber,
      to: to,
    });
    console.log(`SMS sent successfully to ${to}. SID: ${message.sid}`);
    return message.sid;
  } catch (error) {
    console.error(`Failed to send SMS to ${to}:`, error);
    // Re-throw the error so the calling function can handle it.
    throw error;
  }
};
