import { NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';
import { phonepeEnv, generatePayPageSignature } from '@/lib/payments/phonepe';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(req: Request) {
    if (!adminDb) {
        return NextResponse.json({ error: "Database not configured." }, { status: 500 });
    }
    
    try {
        const { amount, name, phone, email } = await req.json();
        
        const { merchantId, saltKey, saltIndex, baseUrl, webhookUrl } = phonepeEnv();
        
        const merchantTransactionId = `DRV_${uuidv4().slice(0, 12)}`;
        const merchantUserId = `MUID_${uuidv4().slice(0, 6)}`;

        const paymentData = {
            order_id: merchantTransactionId,
            name,
            phone,
            email,
            amount: Number(amount),
            status: "PENDING",
            created_at: new Date().toISOString(),
        };

        // 1. Save payment details to Firestore
        await adminDb.collection('payments').doc(merchantTransactionId).set(paymentData);

        // 2. Prepare payload for PhonePe
        const payload = {
            merchantId: merchantId,
            merchantTransactionId: merchantTransactionId,
            merchantUserId: merchantUserId,
            amount: Number(amount) * 100, // Amount in paise
            redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?orderId=${merchantTransactionId}`,
            redirectMode: "POST",
            callbackUrl: webhookUrl,
            mobileNumber: phone,
            paymentInstrument: {
                type: "PAY_PAGE",
            },
        };

        const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
        const signature = generatePayPageSignature(base64Payload, saltKey, saltIndex);

        // 3. Make request to PhonePe
        const response = await fetch(`${baseUrl}/pg/v1/pay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': signature,
            },
            body: JSON.stringify({ request: base64Payload }),
        });

        const responseData = await response.json();
        
        if (responseData.success) {
            const redirectUrl = responseData.data.instrumentResponse.redirectInfo.url;
            return NextResponse.json({ success: true, redirectUrl });
        } else {
            console.error("PhonePe Initiation Error:", responseData);
            return NextResponse.json({ error: responseData.message || "Failed to initiate payment." }, { status: 400 });
        }

    } catch (error) {
        console.error("Initiate Payment Error:", error);
        return NextResponse.json({ error: "An internal server error occurred." }, { status: 500 });
    }
}
