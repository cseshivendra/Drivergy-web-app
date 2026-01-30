'use server';

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(req: Request) {

  console.log("🔔 PhonePe webhook received");

  /* =============================
     AUTH (OPTIONAL BUT RECOMMENDED)
  ============================== */

  const auth = req.headers.get("authorization");

  const user = process.env.PHONEPE_WEBHOOK_USER;
  const pass = process.env.PHONEPE_WEBHOOK_PASS;

  if (user && pass) {
    const expected = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
    if (auth !== expected) {
      console.error("❌ Invalid webhook auth");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  /* =============================
     READ BODY
  ============================== */
  let body;
  try {
    body = await req.json();
  } catch (e) {
    console.error("❌ Failed to parse webhook body as JSON:", e);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  console.log("📦 Webhook Body:", JSON.stringify(body, null, 2));

  /* =============================
     VALIDATE & DECODE PAYLOAD (V2 FORMAT)
  ============================== */
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
  
  const { merchantTransactionId, state } = payload;

  if (!merchantTransactionId) {
    console.error("❌ Decoded webhook payload missing 'merchantTransactionId'.");
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }


  /* =============================
     EXTRACT DATA
  ============================== */
  const orderId = merchantTransactionId;
  const txn = payload.paymentDetails?.[0];
  const transactionId = txn?.transactionId || null;
  const utr = txn?.rail?.utr || null;


  /* =============================
     FIND ORDER & UPDATE
  ============================== */
  try {
    if (!adminDb) {
        console.error("❌ Database not configured in webhook.");
        return NextResponse.json({ error: "Internal Server Error", details: "Database not configured." }, { status: 500 });
    }
    
    const snap = await adminDb
      .collection("orders")
      .where("orderId", "==", orderId)
      .limit(1)
      .get();

    if (snap.empty) {
      console.error("❌ Order not found in webhook:", orderId);
      return NextResponse.json({ error: "Order Not Found" }, { status: 404 });
    }

    const orderDoc = snap.docs[0];
    const orderRef = orderDoc.ref;
    const orderData = orderDoc.data();

    /* =============================
       SUCCESS
    ============================== */
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

      // Update user
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

      console.log("✅ Payment SUCCESS:", orderId);
    }
    /* =============================
       FAILURE
    ============================== */
    else {
      await orderRef.update({
        status: "PAYMENT_FAILED",
        state,
        webhookData: body,
        updatedAt: new Date().toISOString(),
      });
      console.log("⚠️ Payment FAILED:", orderId);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("❌ Webhook Error:", error);
    let errorMessage = "An unexpected error occurred.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json(
      {
        error: "Server Error",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
