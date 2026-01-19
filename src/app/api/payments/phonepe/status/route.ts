
import { NextResponse } from "next/server";
import { getStatusV2 } from "@/lib/payments/phonepe";

export async function GET(
    req: Request
) {
  const { searchParams } = new URL(req.url);
  const merchantTransactionId = searchParams.get("merchantTransactionId");
  
  if (!merchantTransactionId) {
    return NextResponse.json({ error: "Missing merchantTransactionId" }, { status: 400 });
  }

  try {
    console.log("🔍 Checking status for order:", merchantTransactionId);

    const statusData = await getStatusV2(merchantTransactionId);
    
    // No need to update DB here, the webhook should be the source of truth.
    // This route is for the client-side redirect only.
    
    console.log(`✅ Status check for ${merchantTransactionId} successful:`, statusData.code);
    
    // Return the code and data to the client status page
    return NextResponse.json({ 
        status: statusData.code,
        data: statusData.data 
    });

  } catch (error: any) {
    console.error(`❌ Status check error for ${merchantTransactionId}:`, error.message);
    return NextResponse.json(
      { error: "Status Check Failed", details: error.message },
      { status: 500 }
    );
  }
}
