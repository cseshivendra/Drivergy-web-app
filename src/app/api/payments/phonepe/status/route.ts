import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getStatusV2 } from "@/lib/payments/phonepe";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json(
      { error: "Missing orderId" },
      { status: 400 }
    );
  }

  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: "DB not configured" },
        { status: 500 }
      );
    }

    console.log("🔍 Checking DB status for:", orderId);

    const orderRef = adminDb.collection("orders").doc(orderId);
    let orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    let orderData = orderSnap.data();

    // If the local database still says pending, perform a live check with PhonePe
    if (orderData?.status === 'PAYMENT_PENDING' || orderData?.status === 'PAYMENT_INITIATED') {
        console.log("🔄 Local status is pending, performing live PhonePe check...");
        try {
            const liveStatus = await getStatusV2(orderId);
            console.log("📡 Live PhonePe Status:", liveStatus?.state);

            if (liveStatus?.state === 'COMPLETED') {
                const txn = liveStatus.paymentDetails?.[0];
                await orderRef.update({
                    status: "PAYMENT_SUCCESS",
                    state: "SUCCESS",
                    transactionId: txn?.transactionId || null,
                    utr: txn?.rail?.utr || null,
                    paymentVerified: true,
                    updatedAt: new Date().toISOString(),
                });

                // Update user subscription
                if (orderData.userId && orderData.plan) {
                    await adminDb.collection("users").doc(orderData.userId).update({
                        subscriptionPlan: orderData.plan,
                        paymentVerified: true,
                        updatedAt: new Date().toISOString(),
                    });
                }
                
                // Refresh data for response
                orderSnap = await orderRef.get();
                orderData = orderSnap.data();
            } else if (['FAILED', 'CANCELLED', 'TIMED_OUT'].includes(liveStatus?.state)) {
                await orderRef.update({
                    status: "PAYMENT_FAILED",
                    state: liveStatus.state,
                    updatedAt: new Date().toISOString(),
                });
                orderSnap = await orderRef.get();
                orderData = orderSnap.data();
            }
        } catch (liveError) {
            console.error("⚠️ Live status check failed (skipping):", liveError);
        }
    }

    return NextResponse.json({
      success: true,
      orderId,
      status: orderData?.status || null,
      state: orderData?.state || null,
      transactionId: orderData?.transactionId || null,
      utr: orderData?.utr || null,
      phonepeOrderId: orderData?.phonepeOrderId || null,
      updatedAt: orderData?.updatedAt || null,
    });

  } catch (error: unknown) {
    console.error("❌ Status API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json(
      {
        error: "Status Check Failed",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
