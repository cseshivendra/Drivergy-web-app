
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getPhonePeToken } from "@/lib/phonepe/token";

export async function POST(req: Request) {
  try {
    const { amount, mobile, userId } = await req.json();

    if (!amount || !userId || !mobile) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const txnId = "DRV_" + nanoid(10);

    const tokenData = await getPhonePeToken();
    const accessToken = tokenData.access_token;

    const body = {
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      merchantTransactionId: txnId,
      merchantUserId: userId.toString(),
      amount: Number(amount) * 100,
      redirectUrl: `${process.env.APP_BASE_URL}/payment/success`,
      redirectMode: "POST",
      callbackUrl: `${process.env.APP_BASE_URL}/api/phonepe/webhook`,
      mobileNumber: mobile,
      paymentInstrument: { type: "PAY_PAGE" },
    };

    const res = await fetch(
      `${process.env.PHONEPE_BASE_URL}/checkout/v2/pay`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    const data = await res.json();
    if (!res.ok) {
      console.error("PhonePe Pay Error:", data);
      throw new Error(JSON.stringify(data));
    }

    return NextResponse.json({
      success: true,
      url: data.data.instrumentResponse.redirectInfo.url,
      txnId,
    });
  } catch (err: any) {
    console.error("PHONEPE INIT ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Payment failed" },
      { status: 500 }
    );
  }
}
