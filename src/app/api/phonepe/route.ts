
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const { amount, userId } = await req.json();

    if (!amount || !userId) {
        return NextResponse.json({ error: 'Amount and User ID are required.' }, { status: 400 });
    }
    
    const merchantTransactionId = `T${uuidv4().slice(0, 10).replace(/-/g, '')}`;

    const payload = {
        merchantId: process.env.PHONEPE_CLIENT_ID,
        merchantTransactionId: merchantTransactionId,
        merchantUserId: userId,
        amount: amount * 100, // Amount in paise
        redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`, // A dummy redirect URL
        redirectMode: "POST",
        callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/phonepe/webhook`, // A dummy callback URL
        mobileNumber: "9999999999", // Dummy phone number
        paymentInstrument: {
            type: "PAY_PAGE"
        }
    };

    const payloadString = JSON.stringify(payload);
    const base64Payload = Buffer.from(payloadString).toString('base64');
    
    const saltKey = process.env.PHONEPE_CLIENT_SECRET;
    const saltIndex = process.env.PHONEPE_CLIENT_VERSION;

    const stringToHash = `${base64Payload}/pg/v1/pay${saltKey}`;
    const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
    const checksum = `${sha256}###${saltIndex}`;

    // In a real application, you would now make a POST request to PhonePe's API endpoint
    // with the base64Payload and the checksum in the headers.
    // For this prototype, we will simulate a successful response from PhonePe.
    
    console.log("Simulating PhonePe API call with checksum:", checksum);

    // Simulate a successful response that provides a redirect URL for the payment page.
    const simulatedPhonePeResponse = {
        success: true,
        code: "PAYMENT_INITIATED",
        message: "Your payment has been successfully initiated.",
        data: {
            merchantId: process.env.PHONEPE_CLIENT_ID,
            merchantTransactionId: merchantTransactionId,
            instrumentResponse: {
                type: "PAY_PAGE",
                redirectInfo: {
                    url: `/payment-success?plan=${req.nextUrl.searchParams.get('plan')}`, // Simulate a redirect to a success page
                    method: "GET"
                }
            }
        }
    };
    
    // The actual PhonePe API would return a real URL to their payment page.
    // We are simulating this by pointing to a local success page.
    const paymentUrl = simulatedPhonePeResponse.data.instrumentResponse.redirectInfo.url;

    return NextResponse.json({ paymentUrl });

  } catch (error) {
    console.error("PhonePe API Error:", error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}

// A dummy webhook handler to complete the flow.
// In a real app, this would receive POST requests from PhonePe's servers.
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const transactionId = searchParams.get('transactionId');

    if (status === 'success') {
        // Here you would verify the payment status with your database and update the user's profile.
        console.log(`Webhook: Payment successful for transaction ${transactionId}`);
    } else {
        console.log(`Webhook: Payment failed for transaction ${transactionId}`);
    }
    
    // Redirect user to their dashboard after processing.
    return NextResponse.redirect(new URL('/dashboard', req.url));
}
