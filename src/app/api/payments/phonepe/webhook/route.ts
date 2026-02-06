'use server';

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  console.log("🔔 PhonePe webhook received");

  let body;
  try {
    body = await req.json();
  } catch (e) {
    console.error("❌ Invalid JSON body", e);
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

  console.log("📦 Webhook Body:", JSON.stringify(body, null, 2));

  const { payload } = body;

  if (!payload || !payload.merchantOrderId) {
    console.error("❌ Invalid webhook payload");
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    );
  }

  const orderId = payload.merchantOrderId;
  const phonepeOrderId = payload.orderId;
  const state = payload.state;
  const txn = payload.paymentDetails?.[0];
  const transactionId = txn?.transactionId || null;
  const utr = txn?.rail?.utr || null;

  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: "DB not configured" },
        { status: 500 }
      );
    }

    const orderRef = adminDb.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      console.error("❌ Order not found:", orderId);
      return NextResponse.json(
        { error: "Order Not Found" },
        { status: 404 }
      );
    }

    const orderData = orderSnap.data();

    if (state === "COMPLETED") {
      await orderRef.update({
        status: "PAYMENT_SUCCESS",
        state: "SUCCESS",
        phonepeOrderId,
        transactionId,
        utr,
        webhookData: body,
        paymentVerified: true,
        paidAt: new Date().toISOStr ing(),
        updatedAt: new Date().toISOString(),
      });

      if (orderData?.userId) {
        await adminDb.collection("users").doc(orderData.userId).update({
          subscriptionPlan: orderData.plan,
          paymentVerified: true,
          updatedAt: new Date().toISOString(),
        });
      }

      console.log("✅ Payment SUCCESS:", orderId);
    } else {
      await orderRef.update({
        status: "PAYMENT_FAILED",
        state,
        phonepeOrderId,
        webhookData: body,
        updatedAt: new Date().toISOString(),
      });

      console.log("⚠️ Payment FAILED:", orderId, state);
    }

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error("❌ Webhook Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected server error occurred.";
    return NextResponse.json(
      {
        error: "Server Error",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
