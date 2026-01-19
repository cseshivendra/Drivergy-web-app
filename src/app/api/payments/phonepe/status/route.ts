
import { NextResponse } from "next/server";

const PHONEPE_AUTH_URL = "https://api.phonepe.com/apis/identity-manager/v1/oauth/token";
const PHONEPE_STATUS_URL_BASE = "https://api.phonepe.com/apis/pg/checkout/v2/order";

async function getPhonePeToken(clientId: string, clientSecret: string) {
    const authRes = await fetch(PHONEPE_AUTH_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CLIENT-ID": clientId,
            "X-CLIENT-SECRET": clientSecret,
        },
    });
    if (!authRes.ok) throw new Error("Failed to get PhonePe auth token during status check.");
    const authData = await authRes.json();
    return authData.data.accessToken;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("merchantTransactionId");

    if (!id) {
      return NextResponse.json({ error: "Missing merchantTransactionId" }, { status: 400 });
    }
    
    const clientId = process.env.PHONEPE_CLIENT_ID;
    const clientSecret = process.env.PHONEPE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("Server configuration for PhonePe is incomplete.");
    }

    const token = await getPhonePeToken(clientId, clientSecret);
    const statusUrl = `${PHONEPE_STATUS_URL_BASE}/${id}/status`;

    const res = await fetch(statusUrl, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "X-MERCHANT-ID": clientId,
        },
        cache: "no-store",
    });

    if (!res.ok) {
        const text = await res.text();
        console.error("PhonePe V2 status error:", text);
        throw new Error("Status check failed with PhonePe API.");
    }
    
    const result = await res.json();
    return NextResponse.json({ status: result.code, data: result.data });

  } catch (e: any) {
     console.error("PHONEPE STATUS EXCEPTION:", e.message);
    return NextResponse.json(
      { error: "Internal Server Error", details: e.message },
      { status: 500 }
    );
  }
}
