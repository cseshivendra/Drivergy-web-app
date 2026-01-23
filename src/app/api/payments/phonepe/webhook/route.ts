
'use server';

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { headers } from "next/headers";
import { getStatusV2 } from "@/lib/payments/phonepe";
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        if (!adminDb) {
            console.error("Webhook Error: Database not configured.");
            return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
        }

        const body = await req.json();
        console.log("🔔 PhonePe webhook received:", JSON.stringify(body, null, 2));

        // PhonePe V2 sends webhook with "event" and "payload"
        const { event, payload } = body;
        
        if (!payload || !payload.merchantOrderId) {
            console.error("❌ Webhook missing 'payload' or 'merchantOrderId'.");
            return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
        }

        const { merchantOrderId, state } = payload;
        console.log(`📦 Processing webhook for order: ${merchantOrderId}, state: ${state}, event: ${event}`);

        // Get order from database
        const orderRef = adminDb.collection("orders").doc(merchantOrderId);
        const orderSnap = await orderRef.get();

        if (!orderSnap.exists) {
            console.error(`❌ Order ${merchantOrderId} not found in DB.`);
            return NextResponse.json({ error: "Order Not Found" }, { status: 404 });
        }

        // Verify status with PhonePe S2S API (Security Best Practice)
        let verifiedStatusResult = null;
        try {
            verifiedStatusResult = await getStatusV2(merchantOrderId);
            console.log(`✅ S2S Verification Response:`, JSON.stringify(verifiedStatusResult, null, 2));
        } catch (verifyError: any) {
            console.error(`⚠️ S2S Verification failed for ${merchantOrderId}:`, verifyError.message);
            
            // Even if S2S fails, trust webhook data if it's marked as completed
            // Store webhook data and mark as needs verification
            await orderRef.update({
                status: state === "COMPLETED" ? "PAYMENT_SUCCESS_PENDING_VERIFICATION" : "PAYMENT_FAILED",
                webhookData: body,
                s2sVerificationError: verifyError.message,
                updatedAt: new Date().toISOString(),
            });
            
            return NextResponse.json({ 
                success: true, 
                message: "Webhook received but S2S verification failed. Manual verification needed." 
            });
        }

        // Process verified result
        const verifiedState = verifiedStatusResult?.data?.state || state;
        
        if (verifiedState === "COMPLETED") {
            // Payment is verified as successful
            await orderRef.update({
                status: "PAYMENT_SUCCESS",
                webhookData: body,
                s2sVerificationResponse: verifiedStatusResult?.data,
                updatedAt: new Date().toISOString(),
                paidAt: new Date().toISOString(),
                transactionId: verifiedStatusResult?.data?.transactionId || payload.transactionId
            });

            // Update user subscription
            const orderData = orderSnap.data()!;
            if (orderData.userId && orderData.plan) {
                const userRef = adminDb.collection("users").doc(orderData.userId);
                await userRef.update({ subscriptionPlan: orderData.plan });
                console.log(`✅ Updated subscription for user ${orderData.userId}`);
            }

            console.log(`✅ Webhook processed successfully for ${merchantOrderId}: PAYMENT_SUCCESS`);
        } else {
            // Payment failed
            await orderRef.update({
                status: "PAYMENT_FAILED",
                webhookData: body,
                s2sVerificationResponse: verifiedStatusResult?.data,
                updatedAt: new Date().toISOString(),
            });
            console.log(`✅ Webhook processed successfully for ${merchantOrderId}: PAYMENT_FAILED`);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("❌ Webhook processing error:", error);
        console.error("Error stack:", error.stack);
        return NextResponse.json({ 
            error: "Internal Server Error", 
            message: error.message 
        }, { status: 500 });
    }
}
