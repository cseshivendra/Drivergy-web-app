
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getStatusV2 } from "@/lib/payments/phonepe";

async function finalizeOrder(orderId: string, orderData: any, txn: any) {
    if (!adminDb) return;
    
    const timestamp = new Date().toISOString();
    const orderRef = adminDb.collection("orders").doc(orderId);

    await orderRef.update({
        status: "PAYMENT_SUCCESS",
        state: "SUCCESS",
        transactionId: txn?.transactionId || null,
        utr: txn?.rail?.utr || null,
        paymentVerified: true,
        updatedAt: timestamp,
    });

    // Update user subscription & purchase count
    if (orderData.userId) {
        const userRef = adminDb.collection("users").doc(orderData.userId);
        const userDoc = await userRef.get();
        const currentCount = userDoc.data()?.purchaseCount || 0;

        await userRef.update({
            subscriptionPlan: orderData.plan,
            paymentVerified: true,
            purchaseCount: currentCount + 1,
            updatedAt: timestamp,
        });

        // Deduct Wallet if used
        if (orderData.walletUsed && orderData.walletUsed > 0) {
            const walletRef = adminDb.collection('customer_wallets').doc(orderData.userId);
            const walletDoc = await walletRef.get();
            if (walletDoc.exists) {
                const currentBalance = walletDoc.data()?.balance || 0;
                await walletRef.update({
                    balance: currentBalance - orderData.walletUsed
                });

                await adminDb.collection('customer_wallet_transactions').add({
                    userId: orderData.userId,
                    type: 'Debit',
                    amount: orderData.walletUsed,
                    source: 'Purchase Discount',
                    orderId: orderId,
                    timestamp: timestamp
                });
            }
        }
    }
}

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

    const orderRef = adminDb.collection("orders").doc(orderId);
    let orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    let orderData = orderSnap.data()!;

    // If the local database still says pending, perform a live check with PhonePe
    if (orderData?.status === 'PAYMENT_PENDING' || orderData?.status === 'PAYMENT_INITIATED') {
        try {
            const liveStatus = await getStatusV2(orderId);
            if (liveStatus?.state === 'COMPLETED') {
                const txn = liveStatus.paymentDetails?.[0];
                await finalizeOrder(orderId, orderData, txn);
                
                // Refresh data for response
                orderSnap = await orderRef.get();
                orderData = orderSnap.data()!;
            } else if (['FAILED', 'CANCELLED', 'TIMED_OUT'].includes(liveStatus?.state)) {
                await orderRef.update({
                    status: "PAYMENT_FAILED",
                    state: liveStatus.state,
                    updatedAt: new Date().toISOString(),
                });
                orderSnap = await orderRef.get();
                orderData = orderSnap.data()!;
            }
        } catch (liveError) {
            console.error("⚠️ Live status check failed:", liveError);
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
    return NextResponse.json(
      {
        error: "Status Check Failed",
        message: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}
