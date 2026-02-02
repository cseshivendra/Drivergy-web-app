import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getStatusV2 } from "@/lib/payments/phonepe";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  try {
    if (!adminDb) {
      console.error("❌ Database not configured");
      return NextResponse.json(
        { error: "Internal Server Error", details: "Database not configured." },
        { status: 500 }
      );
    }

    console.log("🔍 Checking status for order:", orderId);

    // 1. Fetch current data from local DB
    const orderRef = adminDb.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    let orderData = orderSnap.data();

    // 2. If locally still pending, fetch live status from PhonePe
    if (orderData?.status === "PAYMENT_PENDING" || orderData?.status === "PAYMENT_INITIATED") {
      console.log("📡 Fetching live status from PhonePe for:", orderId);
      try {
        const liveStatus = await getStatusV2(orderId);
        console.log("📡 PhonePe live status response:", liveStatus);

        if (liveStatus && liveStatus.state) {
          const newState = liveStatus.state;
          const newStatus = newState === "COMPLETED" ? "PAYMENT_SUCCESS" : 
                            (["FAILED", "CANCELLED", "TIMED_OUT", "DECLINED"].includes(newState) ? "PAYMENT_FAILED" : orderData.status);

          if (newStatus !== orderData.status) {
            console.log(`✅ Updating order ${orderId} to ${newStatus}`);
            
            const updatePayload: any = {
              status: newStatus,
              state: newState,
              updatedAt: new Date().toISOString(),
            };

            if (newState === "COMPLETED") {
              updatePayload.paymentVerified = true;
              updatePayload.paidAt = new Date().toISOString();
              
              // Also update user profile
              if (orderData.userId && orderData.plan) {
                await adminDb.collection("users").doc(orderData.userId).update({
                  subscriptionPlan: orderData.plan,
                  paymentVerified: true,
                  updatedAt: new Date().toISOString(),
                });
              }
            }

            await orderRef.update(updatePayload);
            
            // Update local variable for response
            orderData = { ...orderData, ...updatePayload };
          }
        }
      } catch (liveError) {
        console.error("⚠️ Failed to fetch live status, falling back to local DB:", liveError);
      }
    }

    // Return current status
    return NextResponse.json({
      success: true,
      status: orderData?.status,
      state: orderData?.state || null,
      transactionId: orderData?.transactionId || null,
      updatedAt: orderData?.updatedAt || null,
    });

  } catch (error) {
    console.error("❌ Status API error:", error);
    let errorMessage = "An unexpected error occurred.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: "Status Check Failed", message: errorMessage }, { status: 500 });
  }
}
