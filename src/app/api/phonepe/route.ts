import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

interface PhonePePaymentRequest {
    merchantId: string;
    merchantTransactionId: string;
    merchantUserId: string;
    amount: number; // in paise
    redirectUrl: string;
    redirectMode: 'POST';
    callbackUrl: string;
    paymentInstrument: {
        type: 'PAY_PAGE';
    };
}

export async function POST(req: NextRequest) {
  try {
    const { amount, userId, plan } = await req.json();
    const host = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';

    if (!amount || !userId || !plan) {
        return NextResponse.json({ error: 'Amount, User ID, and Plan are required.' }, { status: 400 });
    }
    
    const merchantTransactionId = `T${uuidv4().slice(0, 10).replace(/-/g, '')}${Date.now()}`;
    const callbackPath = `/api/phonepe/webhook?merchantTransactionId=${merchantTransactionId}&userId=${userId}&plan=${plan}`;

    const data: PhonePePaymentRequest = {
        merchantId: process.env.PHONEPE_CLIENT_ID!,
        merchantTransactionId: merchantTransactionId,
        merchantUserId: userId,
        amount: amount * 100, // Amount in paise
        redirectUrl: `${host}/dashboard/complete-profile?plan=${encodeURIComponent(plan)}`,
        redirectMode: 'POST',
        callbackUrl: `${host}${callbackPath}`,
        paymentInstrument: {
            type: 'PAY_PAGE'
        }
    };
    
    const payload = JSON.stringify(data);
    const payloadBase64 = Buffer.from(payload).toString('base64');
    
    const saltKey = process.env.PHONEPE_CLIENT_SECRET!;
    const saltIndex = parseInt(process.env.PHONEPE_CLIENT_VERSION!, 10);
    
    const stringToHash = `${payloadBase64}/pg/v1/pay${saltKey}`;
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
    const checksum = `${sha256}###${saltIndex}`;

    const response = await fetch('https://api.phonepe.com/apis/hermes/pg/v1/pay', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': checksum,
        },
        body: JSON.stringify({ request: payloadBase64 }),
    });
    
    const responseData = await response.json();

    if (responseData.success) {
      return NextResponse.json({ paymentUrl: responseData.data.instrumentResponse.redirectInfo.url });
    } else {
      console.error("PhonePe API Error:", responseData.message);
      return NextResponse.json({ error: 'Failed to initiate payment.', details: responseData.message }, { status: 500 });
    }

  } catch (error: any) {
    console.error("PhonePe Route Error:", error);
    return NextResponse.json({ error: 'An internal server error occurred.', details: error.message }, { status: 500 });
  }
}

// Webhook handler to receive payment status updates from PhonePe
export async function POST_WEBHOOK(req: NextRequest) {
    try {
        const body = await req.json();
        const checksum = req.headers.get('x-verify') || '';

        // This is a simplified verification. The SDK or manual crypto would be needed here.
        // For now, we'll assume the callback is valid if it reaches here.
        console.log("Received PhonePe Webhook:", body);

        // Here you would typically:
        // 1. Verify the checksum/signature.
        // 2. Check the payment status (`body.code`).
        // 3. If successful, update the user's subscription and profile in your database.
        
        // Example: If payment is successful
        if (body.code === 'PAYMENT_SUCCESS') {
            const { merchantTransactionId, userId, plan } = req.nextUrl.searchParams;
            // Update user profile, etc.
            console.log(`Payment successful for user ${userId}, plan ${plan}`);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
    }
}