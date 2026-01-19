
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { phonepeEnv, getPhonePeTokenV2 } from "@/lib/payments/phonepe";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(req: Request) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: "Internal Server Error", details: "Database not configured." },
        { status: 500 }
      );
    }
    
    const { amount, userId, plan, mobile } = await req.json();

    if (!amount || !userId || !plan || !mobile) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const merchantTransactionId = "DRV_" + uuidv4().slice(-12);

    await adminDb.collection("orders").doc(merchantTransactionId).set({
      userId,
      plan,
      amount,
      status: "PAYMENT_INITIATED",
      createdAt: new Date().toISOString(),
    });

    const { baseUrl, clientId } = await phonepeEnv();
    const token = await getPhonePeTokenV2();

    const payload = {
      merchantId: clientId,
      merchantTransactionId,
      merchantUserId: userId.slice(0, 35),
      amount: amount * 100,
      redirectUrl: `${process.env.APP_BASE_URL}/payments/phonepe/status/${merchantTransactionId}`,
      callbackUrl: `${process.env.APP_BASE_URL}/api/payments/phonepe/webhook`,
      mobileNumber: mobile,
      paymentInstrument: { type: "PAY_PAGE" },
    };

    const res = await fetch(`${baseUrl}/v2/checkout/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-MERCHANT-ID": clientId,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      console.error("PhonePe V2 Initiation Error:", data);
      throw new Error(data.message || "Failed to initiate payment");
    }

    return NextResponse.json({
      url: data.data.instrumentResponse.redirectInfo.url,
      orderId: merchantTransactionId,
    });

  } catch (e: any) {
    console.error("PHONEPE INIT EXCEPTION:", e.message);
    return NextResponse.json(
      { error: "Internal Server Error", details: e.message },
      { status: 500 }
    );
  }
}
