
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // This endpoint is deprecated as the PhonePe integration has been removed.
  return NextResponse.json(
    { error: "This API endpoint is no longer available." },
    { status: 410 } // HTTP 410 Gone
  );
}
