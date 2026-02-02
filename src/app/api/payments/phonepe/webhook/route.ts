'use server';

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(req: Request) {
  console.log("🔔 PhonePe webhook received");

  // Read body
  let body;
  try {
    body = await req.json();
  } catch (e) {
    console.error("❌ Failed to parse webhook body as JSON:", e);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  
  console.log("📦 Webhook Body:", JSON.stringify(body, null, 2));

  // Extract and decode payload (V2 Format)
  const { response: base64Response } = body;

  if (!base64Response) {
      console.error("❌ Webhook missing 'response' field.");
      return NextResponse.json({ error: "Invalid webhook payload, missing 'response' field." }, { status: 400 });
  }

  let payload;
  try {
    const decodedPayload = Buffer.from(base64Response, 'base64').toString('utf8');
    payload = JSON.parse(decodedPayload);
  } catch (e) {
      console.error("❌ Failed to decode or parse webhook payload.", e);
      return NextResponse.json({ error: "Invalid webhook payload format." }, { status: 400 });
  }
  
  console.log("📄 Decoded Payload:", JSON.stringify(payload, null, 2));

  const { merchantTransactionId, state } = payload;

  if (!merchantTransactionId) {
    console.error("❌ Decoded webhook payload missing 'merchantTransactionId'.");
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  const orderId = merchantTransactionId;
  const txn = payload.paymentDetails?.[0];
  const transactionId = txn?.transactionId || null;
  const utr = txn?.rail?.utr || null;

  // Find order and update
  try {
    if (!adminDb) {
        console.error("❌ Database not configured in webhook.");
        return NextResponse.json({ error: "Internal Server Error", details: "Database not configured." }, { status: 500 });
    }
    
    const snap = await adminDb
      .collection("orders")
      .doc(orderId)
      .get();

    if (!snap.exists) {
      console.error("❌ Order not found in webhook:", orderId);
      return NextResponse.json({ error: "Order Not Found" }, { status: 404 });
    }

    const orderData = snap.data();
    const orderRef = snap.ref;

    // Handle COMPLETED state
    if (state === "COMPLETED") {
      await orderRef.update({
        status: "PAYMENT_SUCCESS",
        state: "SUCCESS",
        transactionId,
        utr,
        webhookData: body,
        paymentVerified: true,
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Update user subscription
      if (orderData?.userId) {
        await adminDb
          .collection("users")
          .doc(orderData.userId)
          .update({
            subscriptionPlan: orderData.plan,
            paymentVerified: true,
            updatedAt: new Date().toISOString(),
          });
      }

      console.log("✅ Payment SUCCESS updated via Webhook:", orderId);
    } 
    // Handle FAILED states
    else if (["FAILED", "CANCELLED", "TIMED_OUT", "DECLINED"].includes(state)) {
      await orderRef.update({
        status: "PAYMENT_FAILED",
        state,
        webhookData: body,
        updatedAt: new Date().toISOString(),
      });
      console.log(`⚠️ Payment ${state} updated via Webhook:`, orderId);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("❌ Webhook Processing Error:", error);
    let errorMessage = "An unexpected error occurred.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: "Server Error", message: errorMessage }, { status: 500 });
  }
}
