
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const payload = await req.json();
  console.log("PhonePe Webhook Received:", payload);
  // TODO: handle/verify webhook logic here
  return NextResponse.json({ ok: true });
}
