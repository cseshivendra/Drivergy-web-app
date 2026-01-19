
'use server';

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getStatusV2 } from "@/lib/payments/phonepe";

export async function POST(req: Request) {
  if (!adminDb) {
    return NextResponse.json(
      { error: "Internal Server Error", details: "Database not configured." },
      { status: 500 }
    );
  }

  const body = await req.json();

  const merchantOrderId = body.data.merchantTransactionId;
  const status = body.code;

  const orderRef = adminDb.collection("orders").doc(merchantOrderId);
  const orderSnap = await orderRef.get();

  if (!orderSnap.exists) {
    return NextResponse.json({ error: "Order Not Found" }, { status: 404 });
  }

  if (status === "PAYMENT_SUCCESS") {
    const statusResult = await getStatusV2(merchantOrderId);

    if (statusResult.code === "PAYMENT_SUCCESS") {
      await orderRef.update({
        status: "PAYMENT_SUCCESS",
        gatewayResponse: body,
        updatedAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
      });

      const orderData = orderSnap.data()!;
      const userRef = adminDb.collection("users").doc(orderData.userId);
      await userRef.update({ subscriptionPlan: orderData.plan });
    }
  } else {
    await orderRef.update({
      status: "PAYMENT_FAILED",
      gatewayResponse: body,
      updatedAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({ success: true });
}
