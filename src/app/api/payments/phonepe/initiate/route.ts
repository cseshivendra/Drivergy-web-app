
'use server';

import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { adminDb } from "@/lib/firebase/admin";
import axios from 'axios';
import { getPhonePeTokenV2 } from "@/lib/payments/phonepe";
import { WalletRedemptionConfig } from "@/types";

export async function POST(req: Request) {
  try {
    if (!adminDb) {
      console.error("❌ Database not configured");
      return NextResponse.json(
        { error: "Internal Server Error", details: "Database not configured." },
        { status: 500 }
      );
    }
    
    const { amount, userId, plan, mobile, redeemWallet } = await req.json();

    console.log("📝 Payment initiation request:", { amount, userId, plan, mobile, redeemWallet });

    if (!amount || !userId || !plan || !mobile) {
      return NextResponse.json(
        { error: "Missing required fields", details: "amount, userId, plan, and mobile are required" },
        { status: 400 }
      );
    }

    // SERVER SIDE WALLET VALIDATION
    let walletUsed = 0;
    let finalPayableAmount = amount;

    if (redeemWallet) {
        const [userDoc, walletDoc] = await Promise.all([
            adminDb.collection('users').doc(userId).get(),
            adminDb.collection('customer_wallets').doc(userId).get()
        ]);

        if (userDoc.exists && walletDoc.exists) {
            const userData = userDoc.data();
            const walletData = walletDoc.data();
            const purchaseCount = (userData?.purchaseCount || 0) + 1;
            const walletBalance = walletData?.balance || 0;

            const percentage = WalletRedemptionConfig[purchaseCount as keyof typeof WalletRedemptionConfig] || WalletRedemptionConfig.default;
            
            if (percentage > 0) {
                walletUsed = Math.floor(walletBalance * percentage);
                // Ensure walletUsed doesn't exceed balance
                walletUsed = Math.min(walletUsed, walletBalance);
                finalPayableAmount = Math.max(0, amount - walletUsed);
            }
        }
    }

    const orderId = "ORD_" + uuidv4().replace(/-/g, '').slice(0, 30);

    try {
      await adminDb.collection("orders").doc(orderId).set({
        orderId: orderId,
        userId,
        plan,
        amount: finalPayableAmount,
        originalAmount: amount,
        walletUsed,
        mobile,
        status: "PAYMENT_INITIATED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log("✅ Order created in database:", orderId);
    } catch (dbError: any) {
      console.error("❌ Database error:", dbError.message);
      return NextResponse.json(
        { error: "Database Error", details: dbError.message },
        { status: 500 }
      );
    }
    
    let token: string;
    try {
      token = await getPhonePeTokenV2();
    } catch (tokenError: any) {
      console.error("❌ Token generation failed in API route:", tokenError.message);
      await adminDb.collection("orders").doc(orderId).update({
        status: "TOKEN_FAILED",
        error: tokenError.message,
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.json(
        { error: "Authentication Failed", details: tokenError.message || "Failed to obtain payment gateway token" },
        { status: 500 }
      );
    }

    const payload = {
        merchantTransactionId: orderId,
        amount: Math.round(finalPayableAmount * 100),
        expireAfter: 1200,
        paymentFlow: {
            type: "PG_CHECKOUT",
            message: "Payment for Drivergy",
            merchantUrls: {
                redirectUrl: `${process.env.APP_BASE_URL}/payments/phonepe/status/${orderId}`
            }
        },
        disablePaymentRetry: true,
        // Crucial fields from the original payload structure
        merchantId: process.env.PHONEPE_CLIENT_ID,
        merchantUserId: userId,
        callbackUrl: `${process.env.APP_BASE_URL}/api/payments/phonepe/webhook`,
        mobileNumber: mobile,
    };

    const paymentUrl = `https://api.phonepe.com/apis/pg/checkout/v2/pay`;
    
    const response = await axios.post(paymentUrl, payload, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `O-Bearer ${token}`,
        },
    });

    const responseData = response.data;

    const paymentRedirectUrl = responseData?.redirectUrl;
    
    if (!paymentRedirectUrl) {
      const errorMessage = responseData.message || "Payment initiation failed and no redirect URL was provided.";
      console.error("❌ Missing payment URL in PhonePe response:", responseData);
      await adminDb.collection("orders").doc(orderId).update({
        status: "INITIATION_FAILED",
        error: errorMessage,
        phonepeResponse: responseData,
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.json(
        { 
          error: "Payment Initiation Failed", 
          details: errorMessage
        },
        { status: 500 }
      );
    }

    // If we have a redirectUrl, it's a success, regardless of the 'success' flag
    await adminDb.collection("orders").doc(orderId).update({
      status: "PAYMENT_PENDING",
      paymentUrl: paymentRedirectUrl,
      phonepeResponse: responseData,
      updatedAt: new Date().toISOString(),
    });

    console.log("✅ Payment initiated successfully:", orderId);

    return NextResponse.json({
      success: true,
      url: paymentRedirectUrl,
      orderId: orderId,
    });

  } catch (error: any) {
    console.error("❌ PHONEPE INIT EXCEPTION:", error.message);
    return NextResponse.json(
      { 
        error: "Payment Initiation Failed", 
        details: error.response?.data?.message || error.message || "An unexpected error occurred"
      },
      { status: 500 }
    );
  }
}
