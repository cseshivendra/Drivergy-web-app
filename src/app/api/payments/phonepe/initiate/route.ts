import { NextResponse } from "next/server";
import crypto from "crypto";
import { nanoid } from "nanoid";

const PAY_URL = "https://api.phonepe.com/apis/pg/pg/v1/pay";

export async function POST(req: Request) {
  try {
    const { amount, userId } = await req.json();

    if (!amount || !userId) {
      return NextResponse.json({ error: "Amount & userId required" }, { status: 400 });
    }

    const txnId = `TXN_${nanoid(10)}`;

    const payloadObj = {
      merchantId: process.env.PHONEPE_PROD_CLIENT_ID,
      merchantTransactionId: txnId,
      merchantUserId: String(userId),
      amount: Number(amount) * 100,
      redirectUrl: `${process.env.APP_BASE_URL}/payment/success`,
      redirectMode: "POST",
      callbackUrl: `${process.env.APP_BASE_URL}/api/phonepe/webhook`,
      paymentInstrument: { type: "PAY_PAGE" }
    };

    const base64Payload = Buffer.from(JSON.stringify(payloadObj)).toString("base64");

    const checksum =
      crypto.createHash("sha256")
        .update(base64Payload + "/pg/v1/pay" + process.env.PHONEPE_PROD_CLIENT_SECRET)
        .digest("hex") + "###1";

    const phonepeRes = await fetch(PAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      body: JSON.stringify({ request: base64Payload }),
    });

    const text = await phonepeRes.text();
    if (!phonepeRes.ok) throw new Error(text);

    return NextResponse.json(JSON.parse(text));
  } catch (e: any) {
    console.error("PHONEPE INIT ERROR:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
