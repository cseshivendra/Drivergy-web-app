'use server';

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { headers } from "next/headers";

export async function POST(req) {

  console.log("🔔 PhonePe webhook received");

  /* =============================
     AUTH (OPTIONAL BUT RECOMMENDED)
  ============================== */

  const headersList = headers();
  const auth = headersList.get("authorization");

  const user = process.env.PHONEPE_WEBHOOK_USER;
  const pass = process.env.PHONEPE_WEBHOOK_PASS;

  if (user && pass) {

    const expected =
      "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");

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
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log("📦 Webhook Body:", JSON.stringify(body, null, 2));


  /* =============================
     VALIDATE PAYLOAD (V2 FORMAT)
  ============================== */

  const { payload } = body;

  if (!payload || !payload.orderId) {
    console.error("❌ Invalid payload");
    return NextResponse.json(
      { error: "Invalid webhook payload" },
      { status: 400 }
    );
  }


  /* =============================
     EXTRACT DATA
  ============================== */

  const phonepeOrderId = payload.orderId; // OMO_xxx
  const state = payload.state;

  const txn = payload.paymentDetails?.[0];

  const transactionId = txn?.transactionId || null;
  const utr = txn?.rail?.utr || null;


  /* =============================
     FIND ORDER (BY OMO ID)
  ============================== */

  try {

    const snap = await adminDb
      .collection("orders")
      .where("phonepeOrderId", "==", phonepeOrderId)
      .limit(1)
      .get();


    if (snap.empty) {
      console.error("❌ Order not found:", phonepeOrderId);
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


      console.log("✅ Payment SUCCESS:", phonepeOrderId);
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

      console.log("⚠️ Payment FAILED:", phonepeOrderId);
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
