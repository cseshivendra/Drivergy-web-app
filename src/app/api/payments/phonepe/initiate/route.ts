import { NextResponse } from "next/server";
import { postPhonePe } from "@/lib/payments/phonepe";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  try {
    const { amount, userId } = await req.json();

    if (!amount || !userId) {
      return NextResponse.json(
        { error: "Amount and userId required" },
        { status: 400 }
      );
    }

    const txnId = `TXN_${nanoid(10)}`;

    const body = {
      merchantId: process.env.PHONEPE_UAT_CLIENT_ID, // IMPORTANT FIX
      merchantTransactionId: txnId,
      merchantUserId: String(userId),
      amount: Number(amount) * 100, // paise
      redirectUrl: `${process.env.APP_BASE_URL}/payment/success`,
      redirectMode: "POST",
      callbackUrl: `${process.env.APP_BASE_URL}/api/phonepe/webhook`,
      paymentInstrument: { type: "PAY_PAGE" },
    };

    const result = await postPhonePe("/pg/v1/pay", body);

    return NextResponse.json({
      success: true,
      url: result.data.instrumentResponse.redirectInfo.url,
      txnId,
    });
  } catch (err: any) {
    console.error("PHONEPE INIT ERROR", err);
    return NextResponse.json(
      { error: err.message || "Payment failed" },
      { status: 500 }
    );
  }
}
