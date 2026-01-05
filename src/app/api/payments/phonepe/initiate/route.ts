import { NextResponse } from "next/server";
import crypto from "crypto";
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
      merchantId: process.env.PHONEPE_PROD_CLIENT_ID, // YOUR LIVE MERCHANT ID
      merchantTransactionId: txnId,
      merchantUserId: String(userId),
      amount: Number(amount) * 100,
      redirectUrl: `${process.env.APP_BASE_URL}/payment/success`,
      redirectMode: "POST",
      callbackUrl: `${process.env.APP_BASE_URL}/api/phonepe/webhook`,
      paymentInstrument: { type: "PAY_PAGE" },
    };

    const payload = Buffer.from(JSON.stringify(body)).toString("base64");

    const checksum =
      crypto
        .createHash("sha256")
        .update(payload + "/pg/v1/pay" + process.env.PHONEPE_PROD_CLIENT_SECRET)
        .digest("hex") + "###1";

        const res = await fetch(
          "https://api.phonepe.com/apis/pg/pg/v1/pay",        
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
        },
        body: JSON.stringify({ request: payload }),
      }
    );

    const text = await res.text();
    if (!res.ok) throw new Error(text);

    return NextResponse.json(JSON.parse(text));
  } catch (err: any) {
    console.error("PHONEPE INIT ERROR", err);
    return NextResponse.json(
      { error: err.message || "Payment failed" },
      { status: 500 }
    );
  }
}
