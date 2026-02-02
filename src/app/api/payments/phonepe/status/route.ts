import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(req) {

  const { searchParams } = new URL(req.url);

  const orderId = searchParams.get("orderId"); // ORD_xxx

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


  } catch (error) {

    console.error("❌ Status API Error:", error);

    return NextResponse.json(
      {
        error: "Status Check Failed",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
