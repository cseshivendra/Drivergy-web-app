
'use server';

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { headers } from "next/headers";
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
    
    const credentials = `${webhookUser}:${webhookPass}`;
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
        if (!payload || !payload.orderId) {
            console.error("❌ Webhook missing 'payload' or 'orderId'.");
            return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
        }

        const { orderId, state, transactionId } = payload;

        // Update Database based on webhook status directly
        const orderRef = adminDb.collection("orders").doc(orderId);
        const orderSnap = await orderRef.get();

        if (!orderSnap.exists) {
            console.error(`❌ Order ${orderId} not found in DB.`);
            return NextResponse.json({ error: "Order Not Found" }, { status: 404 });
        }
        
        if (state === "COMPLETED") {
            // If we reach here, the payment is considered successful based on webhook.
            await orderRef.update({
                status: "PAYMENT_SUCCESS",
                webhookData: body,
                updatedAt: new Date().toISOString(),
                paidAt: new Date().toISOString(),
                transactionId: transactionId
            });

            const orderData = orderSnap.data()!;
            const userRef = adminDb.collection("users").doc(orderData.userId);
            await userRef.update({ subscriptionPlan: orderData.plan });

            console.log(`✅ Webhook processed successfully for ${orderId}: PAYMENT_SUCCESS`);
        } else {
             await orderRef.update({
                status: "PAYMENT_FAILED",
                webhookData: body,
                updatedAt: new Date().toISOString(),
            });
            console.log(`✅ Webhook processed successfully for ${orderId}: PAYMENT_FAILED`);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("❌ Webhook processing error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
