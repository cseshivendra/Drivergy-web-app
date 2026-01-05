
'use server';

import nodemailer from 'nodemailer';

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

// This function sends an email using Nodemailer.
// It retrieves SMTP configuration from environment variables.
export const sendEmail = async (data: EmailPayload) => {
    
  // Zoho Mail SMTP Configuration
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST || 'smtp.zoho.in',
    port: Number(process.env.EMAIL_SERVER_PORT) || 587,
    secure: false, // STARTTLS uses secure: false
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
    tls: {
      ciphers:'SSLv3'
    }
  });

  // Verify connection configuration
  try {
    await transporter.verify();
  } catch (error) {
    console.error("Email server connection error:", error);
    throw new Error("Failed to connect to email server. Please check your configuration.");
  }

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Drivergy Support'}" <${process.env.EMAIL_FROM || 'support@drivergy.in'}>`,
    ...data,
    headers: {
        'X-Mailer': 'Drivergy Nodemailer',
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal'
    }
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email.");
  }
};
