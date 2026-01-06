import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getPhonePeToken } from "@/lib/phonepe/token";

export async function POST(req: Request) {
  try {
    const { amount, userId } = await req.json();

    if (!amount || !userId) {
      return NextResponse.json(
        { error: "amount and userId required" },
        { status: 400 }
      );
    }

    const orderId = "DRV_" + nanoid(10);

    const token = await getPhonePeToken();

    const body = {
      merchantOrderId: orderId,
      amount: Number(amount) * 100,
      expireAfter: 1200,
      metaInfo: {
        udf1: `USER_${userId}`,
        udf2: "drivergy_checkout",
        udf3: "web",
        udf4: "",
        udf5: "",
      },
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: "Drivergy Driving Course Payment",
        merchantUrls: {
          redirectUrl: `${process.env.APP_BASE_URL}/payment/success`,
        },
      },
    };

    const res = await fetch(
      `${process.env.PHONEPE_BASE_URL}/pg/checkout/v2/pay`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `O-Bearer ${token.access_token}`,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));

    return NextResponse.json({
      url: data.data.instrumentResponse.redirectInfo.url,
      orderId,
    });
  } catch (err: any) {
    console.error("PHONEPE INIT ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Payment failed" },
      { status: 500 }
    );
  }
}
