// src/app/api/payments/phonepe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase/admin";

function headerAuthValid(req: NextRequest) {
  const header = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!header) return false;
  
  const [scheme, token] = header.split(" ");
  if (scheme !== 'Basic' || !token) return false;
  
  const user = process.env.PHONEPE_WEBHOOK_BASIC_USER!;
  const pass = process.env.PHONEPE_WEBHOOK_BASIC_PASS!;
  
  const decoded = Buffer.from(token, 'base64').toString('utf8');
  if (decoded !== `${user}:${pass}`) return false;

  return true;
}


export async function POST(req: NextRequest) {
  try {
    if (!headerAuthValid(req)) {
      console.error("Webhook auth failed");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const textPayload = await req.text();
    const payload = JSON.parse(textPayload);
    const base64Response = payload.response;

    if (!base64Response) {
        return NextResponse.json({ error: "Invalid payload: Missing 'response' field" }, { status: 400 });
    }
    
    const decodedPayload = JSON.parse(Buffer.from(base64Response, 'base64').toString('utf8'));
    
    const orderId = decodedPayload.merchantTransactionId;
    const status = decodedPayload.code; // e.g., PAYMENT_SUCCESS, PAYMENT_ERROR

    if (adminDb && orderId) {
        const orderRef = adminDb.collection('orders').doc(orderId);
        const updateData: { status: string, webhookPayload: any, completedAt?: Date } = {
            status: status,
            webhookPayload: decodedPayload,
        };

        if (status === 'PAYMENT_SUCCESS') {
            updateData.completedAt = new Date();
        }
        await orderRef.update(updateData);
    }
    
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Webhook processing error:", e);
    return NextResponse.json({ error: e.message || "webhook error" }, { status: 500 });
  }
}
