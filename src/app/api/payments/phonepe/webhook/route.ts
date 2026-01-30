'use server';

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import crypto from 'crypto';
import { query, where } from "firebase/firestore";

export async function POST(req: Request) {
    // 1. Authenticate the webhook request using SHA256 hash
    const headersList = req.headers;
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

        // The payload is a base64 encoded string in the 'response' field
        const base64Payload = body.response;
        if (!base64Payload) {
            console.error("❌ Webhook missing 'response' field.");
            return NextResponse.json({ error: "Invalid webhook payload: missing response" }, { status: 400 });
        }
        
        const decodedPayload = Buffer.from(base64Payload, 'base64').toString('utf-8');
        const payload = JSON.parse(decodedPayload);
        
        console.log("📝 Decoded webhook payload:", payload);

        const { merchantTransactionId: orderId, state, transactionId } = payload;
        
        if (!orderId) {
            console.error("❌ Decoded payload missing 'merchantTransactionId'.");
            return NextResponse.json({ error: "Invalid webhook payload: missing merchantTransactionId" }, { status: 400 });
        }

        // Find order in DB using orderId
        const ordersRef = adminDb.collection("orders");
        const q = query(ordersRef, where("orderId", "==", orderId));
        const querySnapshot = await q.get();


        if (querySnapshot.empty) {
            console.error(`❌ Order ${orderId} not found in DB.`);
            return NextResponse.json({ error: "Order Not Found" }, { status: 404 });
        }
        
        const orderDoc = querySnapshot.docs[0];
        const orderRef = orderDoc.ref;
        
        const orderData = orderDoc.data();
        if (!orderData) {
            console.error(`❌ Order data is invalid for ${orderId}.`);
            return NextResponse.json({ error: "Invalid Order Data" }, { status: 500 });
        }
        
        // Trust the webhook's state
        if (state === "COMPLETED") {
            // Update order status in DB
            await orderRef.update({
                status: "PAYMENT_SUCCESS",
                state: state, // Store the final state from PhonePe
                webhookData: payload, // Store the decoded payload
                updatedAt: new Date().toISOString(),
                paidAt: new Date().toISOString(),
                transactionId: transactionId
            });

            // Update user's subscription plan
            const userRef = adminDb.collection("users").doc(orderData.userId);
            await userRef.update({ subscriptionPlan: orderData.plan });

            console.log(`✅ Webhook processed successfully for ${orderId}: PAYMENT_SUCCESS`);
        } else {
             await orderRef.update({
                status: "PAYMENT_FAILED",
                state: state, // Store the final state from PhonePe
                webhookData: payload,
                updatedAt: new Date().toISOString(),
            });
            console.log(`✅ Webhook processed successfully for ${orderId}: PAYMENT_FAILED with state ${state}`);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("❌ Webhook processing error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
