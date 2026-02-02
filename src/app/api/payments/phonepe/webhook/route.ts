'use server';

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(req) {

  console.log("🔔 PhonePe webhook received");

  /* ===============================
     READ BODY
  =============================== */

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


  /* ===============================
     VALIDATE V2 PAYLOAD
  =============================== */

  const { payload } = body;

  if (!payload || !payload.merchantOrderId) {
    console.error("❌ Invalid webhook payload");
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    );
  }


  /* ===============================
     EXTRACT DATA
  =============================== */

  const orderId = payload.merchantOrderId; // ORD_xxx (YOUR ID)
  const phonepeOrderId = payload.orderId;  // OMO_xxx
  const state = payload.state;

  const txn = payload.paymentDetails?.[0];

  const transactionId = txn?.transactionId || null;
  const utr = txn?.rail?.utr || null;


  /* ===============================
     FIND ORDER
  =============================== */

  try {

    if (!adminDb) {
      return NextResponse.json(
        { error: "DB not configured" },
        { status: 500 }
      );
    }

    const orderRef = adminDb
      .collection("orders")
      .doc(orderId);

    const orderSnap = await orderRef.get();


    if (!orderSnap.exists) {

      console.error("❌ Order not found:", orderId);

      return NextResponse.json(
        { error: "Order Not Found" },
        { status: 404 }
      );
    }

    const orderData = orderSnap.data();


    /* ===============================
       SUCCESS
    =============================== */

    if (state === "COMPLETED") {

      await orderRef.update({

        status: "PAYMENT_SUCCESS",
        state: "SUCCESS",

        phonepeOrderId,

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


    /* ===============================
       FAILURE
    =============================== */

    else {

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


  } catch (error) {

    console.error("❌ Webhook Error:", error);

    return NextResponse.json(
      {
        error: "Server Error",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
