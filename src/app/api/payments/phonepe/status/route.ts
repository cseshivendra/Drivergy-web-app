
import { NextResponse } from "next/server";
import { getStatusV2 } from "@/lib/payments/phonepe";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("merchantTransactionId");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const result = await getStatusV2(id);
  return NextResponse.json({ status: result.code, data: result.data });
}
