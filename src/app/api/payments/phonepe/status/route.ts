
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(req: Request) {

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
      console.error("❌ Database not configured");
      return NextResponse.json(
        { error: "Internal Server Error", details: "Database not configured." },
        { status: 500 }
      );
    }

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

    if (!orderData) {
        return NextResponse.json(
            { error: "Order data is invalid." },
            { status: 500 }
        );
    }

    // Return DB status to frontend
    return NextResponse.json({
      success: true,
      status: orderData.status,
      state: orderData.state || null,
      transactionId: orderData.transactionId || null,
      updatedAt: orderData.updatedAt || null,
    });

  } catch (error) {

    console.error("❌ Status API error:", error);

    let errorMessage = "An unexpected error occurred.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }

    return NextResponse.json(
      {
        error: "Status Check Failed",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
