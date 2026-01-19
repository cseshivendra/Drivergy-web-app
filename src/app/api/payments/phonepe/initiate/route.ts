
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { adminDb } from "@/lib/firebase/admin";

// URLs are now hardcoded here for clarity
const PHONEPE_AUTH_URL = "https://api.phonepe.com/apis/identity-manager/v1/oauth/token";
const PHONEPE_PAY_URL = "https://api.phonepe.com/apis/pg/checkout/v2/pay";

export async function POST(req: Request) {
  try {
    // 1. Check for Firebase Admin initialization
    if (!adminDb) {
      console.error("PHONEPE INIT ERROR: Database not configured.");
      return NextResponse.json(
        { error: "Internal Server Error", details: "Database not configured." },
        { status: 500 }
      );
    }
    
    // 2. Validate environment variables for PhonePe
    const clientId = process.env.PHONEPE_CLIENT_ID;
    const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
    const appBaseUrl = process.env.APP_BASE_URL;

    if (!clientId || !clientSecret || !appBaseUrl) {
      console.error("PHONEPE INIT ERROR: Missing PhonePe or App credentials in .env file.");
      throw new Error("Server configuration is incomplete.");
    }

    // 3. Get data from client
    const { amount, userId, plan, mobile } = await req.json();

    if (!amount || !userId || !plan || !mobile) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 4. Create an order record in our database
    const merchantTransactionId = "DRV_" + uuidv4().slice(-12);
    await adminDb.collection("orders").doc(merchantTransactionId).set({
      userId,
      plan,
      amount,
      status: "PAYMENT_INITIATED",
      createdAt: new Date().toISOString(),
    });

    // 5. Get PhonePe V2 Auth Token (Inlined logic)
    const authRes = await fetch(PHONEPE_AUTH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CLIENT-ID": clientId,
          "X-CLIENT-SECRET": clientSecret,
        },
    });

    if (!authRes.ok) {
        const text = await authRes.text();
        console.error("PhonePe V2 token error:", text);
        throw new Error("Failed to get PhonePe auth token.");
    }
    const authData = await authRes.json();
    const token = authData.data.accessToken;

    // 6. Prepare and send the payment initiation request
    const payload = {
      merchantId: clientId,
      merchantTransactionId,
      merchantUserId: userId.slice(0, 35),
      amount: amount * 100, // Amount must be in paise
      redirectUrl: `${appBaseUrl}/payments/phonepe/status/${merchantTransactionId}`,
      callbackUrl: `${appBaseUrl}/api/payments/phonepe/webhook`,
      mobileNumber: mobile,
      paymentInstrument: { type: "PAY_PAGE" },
    };
    
    const paymentRes = await fetch(PHONEPE_PAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-MERCHANT-ID": clientId,
      },
      body: JSON.stringify(payload),
    });

    const paymentData = await paymentRes.json();

    if (!paymentRes.ok || !paymentData.success) {
      console.error("PhonePe V2 Initiation Error:", paymentData);
      throw new Error(paymentData.message || "Failed to initiate PhonePe payment.");
    }

    // 7. Return the redirect URL to the client
    return NextResponse.json({
      url: paymentData.data.instrumentResponse.redirectInfo.url,
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
