
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { ComplaintFormSchema } from '@/types';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validationResult = ComplaintFormSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid input.', details: validationResult.error.flatten() }, { status: 400 });
    }
    
    const { name, email, phone, subject, message } = validationResult.data;
    const supportEmail = 'support@drivergy.in';

    // 1. Save to Firestore for Dashboard tracking
    if (adminDb) {
        await adminDb.collection('complaints').add({
            userName: name,
            userEmail: email,
            userPhone: phone || null,
            subject,
            message,
            status: 'Pending',
            timestamp: new Date().toISOString(),
        });
    }

    // 2. Send notification email to support
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #333;">New Support Request from Drivergy Website</h2>
        <p>A new contact form has been submitted. Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Name:</td>
            <td style="padding: 8px;">${name}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Email:</td>
            <td style="padding: 8px;"><a href="mailto:${email}">${email}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Phone:</td>
            <td style="padding: 8px;">${phone || 'Not Provided'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; font-weight: bold;">Subject:</td>
            <td style="padding: 8px;">${subject}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; vertical-align: top;">Message:</td>
            <td style="padding: 8px;">${message.replace(/\n/g, '<br>')}</td>
          </tr>
        </table>
      </div>
    `;

    const adminEmailText = `
      New Support Request from Drivergy Website:
      Name: ${name}
      Email: ${email}
      Phone: ${phone || 'Not Provided'}
      Subject: ${subject}
      Message: ${message}
    `;

    await sendEmail({
      to: supportEmail,
      subject: `New Support Request: ${subject}`,
      html: adminEmailHtml,
      text: adminEmailText,
    });

    // 3. Send acknowledgment email to the user
    const userEmailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #333;">We've received your request!</h2>
        <p>Hello ${name},</p>
        <p>Thank you for contacting Drivergy support. We have received your message regarding "<strong>${subject}</strong>" and a member of our team will get back to you as soon as possible.</p>
        <p>Here's a copy of your submission for your records:</p>
        <blockquote style="border-left: 4px solid #ccc; padding-left: 1rem; margin-left: 0; font-style: italic;">
          <p>"${message.replace(/\n/g, '<br>')}"</p>
        </blockquote>
        <p>Best regards,<br>The Drivergy Team</p>
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 0.8em; color: #777;">If you did not make this request, please disregard this email.</p>
      </div>
    `;

    const userEmailText = `
      Hello ${name},
      Thank you for contacting Drivergy support. We have received your message regarding "${subject}" and a member of our team will get back to you as soon as possible.
      Your message: "${message}"
      Best regards,
      The Drivergy Team
    `;

    await sendEmail({
      to: email,
      subject: 'Your Support Request has been Received | Drivergy',
      html: userEmailHtml,
      text: userEmailText,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('API Contact Error:', error);
    let errorMessage = 'An unexpected error occurred.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: 'Failed to send message.', details: errorMessage }, { status: 500 });
  }
}
