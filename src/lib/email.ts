
'use server';

import nodemailer from 'nodemailer';

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

// This function sends an email using Nodemailer.
// It retrieves SMTP configuration from environment variables.
export const sendEmail = async (data: EmailPayload) => {
    
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    secure: Number(process.env.EMAIL_SERVER_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });

  // Verify connection configuration
  try {
    await transporter.verify();
  } catch (error) {
    console.error("Email server connection error:", error);
    throw new Error("Failed to connect to email server. Please check your configuration.");
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    ...data,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email.");
  }
};
