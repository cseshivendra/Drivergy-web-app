
// src/app/api/payments/phonepe/initiate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';
import { phonepeEnv, postPhonePe } from "@/lib/payments/phonepe";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const { amount, plan, userId } = await req.json();
    if (!amount || !plan || !userId) {
      return NextResponse.json({ error: "amount, plan, and userId required" }, { status: 400 });
    }

    const { merchantId } = phonepeEnv();
    const appBase = process.env.APP_BASE_URL!;
    const merchantTransactionId = `T${uuidv4().slice(0, 10).replace(/-/g, '')}${Date.now()}`;

    // Persist your order with status="PENDING" here
    if (adminDb) {
        await adminDb.collection('orders').doc(merchantTransactionId).set({
            userId,
            plan,
            amount,
            status: 'PENDING',
            createdAt: new Date(),
        });
    }


    const payload = {
      merchantId,
      merchantTransactionId,
      merchantUserId: userId,
      amount: amount * 100, // in paise
      redirectUrl: `${appBase}/payments/phonepe/status/${merchantTransactionId}`,
      redirectMode: "REDIRECT",
      callbackUrl: `${appBase}/api/payments/phonepe/webhook`,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const data = await postPhonePe("/pg/v1/pay", payload);

    const redirectUrl =
      data?.data?.instrumentResponse?.redirectInfo?.url ||
      null;

    if (!redirectUrl) {
      console.error("PhonePe Initiation Error Raw Response:", data);
      return NextResponse.json({ error: "No redirect URL received", raw: data }, { status: 500 });
    }

    return NextResponse.json({ redirectUrl, merchantTransactionId });
  } catch (e: any) {
    console.error("PhonePe Initiate Error:", e);
    return NextResponse.json({ error: e.message || "initiate failed" }, { status: 500 });
  }
}
