import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase/admin';
import { phonepeEnv } from '@/lib/payments/phonepe';

export async function POST(req: Request) {
    if (!adminDb) {
        return NextResponse.json({ error: "Database not configured." }, { status: 500 });
    }
    
    try {
        const xVerify = req.headers.get('x-verify') || '';
        const body = await req.json();
        const base64Response = body.response;
        
        const { saltKey, saltIndex } = phonepeEnv();

        // 1. Verify the signature
        const calculatedSignature = crypto.createHash('sha256').update(base64Response + saltKey).digest('hex') + `###${saltIndex}`;

        if (calculatedSignature !== xVerify) {
            console.error("Webhook signature mismatch.");
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Decode the response
        const decodedResponse = JSON.parse(Buffer.from(base64Response, 'base64').toString());

        const { success, code, merchantTransactionId } = decodedResponse;
        
        let newStatus: "SUCCESS" | "FAILED" = "FAILED";
        if (success && code === 'PAYMENT_SUCCESS') {
            newStatus = "SUCCESS";
        }

        // 3. Update the database
        const paymentRef = adminDb.collection('payments').doc(merchantTransactionId);
        await paymentRef.update({
            status: newStatus,
            phonepeResponse: decodedResponse // Storing the full response for auditing
        });
        
        console.log(`Payment status for ${merchantTransactionId} updated to ${newStatus}`);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
    }
}
