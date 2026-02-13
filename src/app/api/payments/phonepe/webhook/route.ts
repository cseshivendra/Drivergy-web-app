
'use server';

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  console.log("🔔 PhonePe webhook received");

  let body;
  try {
    body = await req.json();
  } catch (e) {
    console.error("❌ Invalid JSON body", e);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { payload } = body;

  if (!payload || !payload.merchantOrderId) {
    console.error("❌ Invalid webhook payload");
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const orderId = payload.merchantOrderId;
  const phonepeOrderId = payload.orderId;
  const state = payload.state;
  const txn = payload.paymentDetails?.[0];
  const transactionId = txn?.transactionId || null;
  const utr = txn?.rail?.utr || null;

  try {
    if (!adminDb) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

    const orderRef = adminDb.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      console.error("❌ Order not found:", orderId);
      return NextResponse.json({ error: "Order Not Found" }, { status: 404 });
    }

    const orderData = orderSnap.data()!;

    // Avoid duplicate processing
    if (orderData.status === 'PAYMENT_SUCCESS') {
        return NextResponse.json({ success: true, message: "Already processed" });
    }

    if (state === "COMPLETED") {
      const timestamp = new Date().toISOString();
      
      await orderRef.update({
        status: "PAYMENT_SUCCESS",
        state: "SUCCESS",
        phonepeOrderId,
        transactionId,
        utr,
        webhookData: body,
        paymentVerified: true,
        paidAt: timestamp,
        updatedAt: timestamp,
      });

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

        // Existing Trainer Wallet Credit Logic
        const userData = userDoc.data();
        if (userData?.assignedTrainerId) {
            const trainerId = userData.assignedTrainerId;
            const amount = orderData.originalAmount || orderData.amount;
            const trainerShare = amount * 0.80;
            const description = `Earning from student: ${userData.name} (${orderData.plan})`;

            const walletRef = adminDb.collection('trainer_wallets').doc(trainerId);
            const walletDoc = await walletRef.get();

            if (walletDoc.exists) {
                const currentBalance = walletDoc.data()?.balance || 0;
                const currentTotal = walletDoc.data()?.totalEarnings || 0;
                await walletRef.update({
                    balance: currentBalance + trainerShare,
                    totalEarnings: currentTotal + trainerShare,
                });
            } else {
                await walletRef.set({
                    trainerId,
                    trainerName: userData.assignedTrainerName || "Trainer",
                    balance: trainerShare,
                    totalEarnings: trainerShare,
                    totalWithdrawn: 0,
                });
            }

            await adminDb.collection('wallet_transactions').add({
                trainerId,
                type: 'Credit',
                amount: trainerShare,
                description,
                studentName: userData.name,
                planName: orderData.plan,
                status: 'Successful',
                timestamp,
            });
        }
      }

      console.log("✅ Webhook Payment SUCCESS:", orderId);
    } else {
      await orderRef.update({
        status: "PAYMENT_FAILED",
        state,
        phonepeOrderId,
        webhookData: body,
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error("❌ Webhook Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
