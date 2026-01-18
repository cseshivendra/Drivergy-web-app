import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // This endpoint is deprecated as the PhonePe integration has been updated.
  // The new flow uses a webhook and redirect pages.
  return NextResponse.json(
    { error: "This API endpoint is no longer in use." },
    { status: 410 } // HTTP 410 Gone
  );
}
