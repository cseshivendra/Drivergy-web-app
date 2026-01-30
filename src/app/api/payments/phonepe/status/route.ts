import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(req) {

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json(
      { error: "Missing orderId" },
      { status: 400 }
    );
  }

  try {

    console.log("🔍 Checking local status for order:", orderId);

    // Fetch from Firestore
    const orderRef = adminDb
      .collection("orders")
      .doc(orderId);

    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const orderData = orderSnap.data();

    // Return DB status to frontend
    return NextResponse.json({
      success: true,
      status: orderData.status,       // PAYMENT_SUCCESS / PENDING / FAILED
      state: orderData.state || null,
      transactionId: orderData.transactionId || null,
      updatedAt: orderData.updatedAt || null,
    });

  } catch (error) {

    console.error("❌ Status API error:", error);

    return NextResponse.json(
      {
        error: "Status Check Failed",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
