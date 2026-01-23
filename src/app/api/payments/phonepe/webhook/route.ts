
'use server';

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { headers } from "next/headers";
import { getStatusV2 } from "@/lib/payments/phonepe";
import crypto from 'crypto';

export async function POST(req: Request) {
    // 1. Authenticate the webhook request using SHA256 hash
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    const webhookUser = process.env.PHONEPE_WEBHOOK_USER;
    const webhookPass = process.env.PHONEPE_WEBHOOK_PASS;

    if (!webhookUser || !webhookPass) {
        console.error("Webhook security credentials are not set on the server.");
        return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
    }
    
    const credentials = `${webhookUser}:${password}`;
    const expectedHash = crypto.createHash('sha256').update(credentials).digest('hex');

    if (authHeader !== expectedHash) {
         console.log("Webhook Forbidden: Invalid signature");
         console.log("Received header:", authHeader);
         console.log("Expected hash:", expectedHash);
         return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    console.log("✅ Webhook authenticated successfully.");

    // 2. Process the webhook payload
    try {
        if (!adminDb) {
            console.error("Webhook Error: Database not configured.");
            return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
        }

        const body = await req.json();
        console.log("🔔 PhonePe webhook received:", JSON.stringify(body, null, 2));

        const { payload } = body;
        if (!payload || !payload.merchantOrderId) {
            console.error("❌ Webhook missing 'payload' or 'merchantOrderId'.");
            return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
        }

        const { merchantOrderId } = payload;

        // 3. Verify status with PhonePe before updating DB (Security Best Practice)
        const verifiedStatusResult = await getStatusV2(merchantOrderId);
        
        if (!verifiedStatusResult || !verifiedStatusResult.success) {
            console.error(`❌ Webhook S2S verification failed for ${merchantOrderId}. Reason: ${verifiedStatusResult.code}`);
            await adminDb.collection("orders").doc(merchantOrderId).update({
                status: "VERIFICATION_FAILED",
                webhookData: body,
                s2sVerificationResponse: verifiedStatusResult,
                updatedAt: new Date().toISOString(),
            });
             return NextResponse.json({ success: true, message: "Handled unverified payment." });
        }
        
        const verifiedState = verifiedStatusResult.data.state;
        
        // 4. Update Database based on verified status
        const orderRef = adminDb.collection("orders").doc(merchantOrderId);
        const orderSnap = await orderRef.get();

        if (!orderSnap.exists) {
            console.error(`❌ Order ${merchantOrderId} not found in DB.`);
            return NextResponse.json({ error: "Order Not Found" }, { status: 404 });
        }
        
        if (verifiedState === "COMPLETED") {
            // If we reach here, the payment is verified as successful.
            await orderRef.update({
                status: "PAYMENT_SUCCESS",
                webhookData: body,
                s2sVerificationResponse: verifiedStatusResult.data,
                updatedAt: new Date().toISOString(),
                paidAt: new Date().toISOString(),
                transactionId: verifiedStatusResult.data.transactionId
            });

            const orderData = orderSnap.data()!;
            const userRef = adminDb.collection("users").doc(orderData.userId);
            await userRef.update({ subscriptionPlan: orderData.plan });

            console.log(`✅ Webhook processed successfully for ${merchantOrderId}: PAYMENT_SUCCESS`);
        } else {
             await orderRef.update({
                status: "PAYMENT_FAILED",
                webhookData: body,
                s2sVerificationResponse: verifiedStatusResult.data,
                updatedAt: new Date().toISOString(),
            });
            console.log(`✅ Webhook processed successfully for ${merchantOrderId}: PAYMENT_FAILED`);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("❌ Webhook processing error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
