
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getPhonePeTokenV2 } from "@/lib/payments/phonepe";
import { adminDb } from "@/lib/firebase/admin";
import axios from 'axios';

export async function POST(req: Request) {
  try {
    if (!adminDb) {
      console.error("❌ Database not configured");
      return NextResponse.json(
        { error: "Internal Server Error", details: "Database not configured." },
        { status: 500 }
      );
    }
    
    const { amount, userId, plan, mobile } = await req.json();

    console.log("📝 Payment initiation request:", { amount, userId, plan, mobile });

    if (!amount || !userId || !plan || !mobile) {
      return NextResponse.json(
        { error: "Missing required fields", details: "amount, userId, plan, and mobile are required" },
        { status: 400 }
      );
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount", details: "Amount must be a positive number" },
        { status: 400 }
      );
    }
    if (!/^\d{10}$/.test(mobile)) {
      return NextResponse.json(
        { error: "Invalid mobile number", details: "Mobile number must be 10 digits" },
        { status: 400 }
      );
    }

    const merchantTransactionId = "DRV_" + uuidv4().replace(/-/g, '').slice(0, 30);

    try {
      await adminDb.collection("orders").doc(merchantTransactionId).set({
        userId,
        plan,
        amount,
        mobile,
        status: "PAYMENT_INITIATED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log("✅ Order created in database:", merchantTransactionId);
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
      await adminDb.collection("orders").doc(merchantTransactionId).update({
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
        merchantTransactionId: merchantTransactionId,
        amount: Math.round(amount * 100),
        expireAfter: 1200,
        metaInfo: {
            udf1: userId,
            udf2: plan,
            udf3: mobile,
            udf4: "",
            udf5: "",
            udf6: "",
            udf7: "",
            udf8: "",
            udf9: "",
            udf10: "",
            udf11: "",
            udf12: "",
            udf13: "",
            udf14: "",
            udf15: ""
        },
        paymentFlow: {
            type: "PG_CHECKOUT",
            message: "Payment for Drivergy",
            merchantUrls: {
                redirectUrl: `${process.env.APP_BASE_URL}/payments/phonepe/status/${merchantTransactionId}`
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

    console.log("📡 PhonePe API response status:", response.status);
    console.log("📡 PhonePe API response data:", responseData);

    if (!responseData.success) {
      console.error("❌ PhonePe returned success=false:", responseData);
      await adminDb.collection("orders").doc(merchantTransactionId).update({
        status: "INITIATION_FAILED",
        error: responseData.message || "Payment initiation unsuccessful",
        phonepeResponse: responseData,
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.json(
        { 
          error: "Payment Initiation Failed", 
          details: responseData.message || "Payment initiation unsuccessful"
        },
        { status: 500 }
      );
    }

    // The redirect URL is now nested inside the `paymentFlow` response
    const paymentRedirectUrl = responseData?.data?.paymentFlow?.merchantUrls?.redirectUrl;
    
    if (!paymentRedirectUrl) {
      console.error("❌ Missing payment URL in new response structure:", responseData);
      await adminDb.collection("orders").doc(merchantTransactionId).update({
        status: "INITIATION_FAILED",
        error: "Missing payment redirect URL in paymentFlow",
        phonepeResponse: responseData,
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.json(
        { error: "Invalid Response", details: "Payment URL not found in new response structure" },
        { status: 500 }
      );
    }

    await adminDb.collection("orders").doc(merchantTransactionId).update({
      status: "PAYMENT_PENDING",
      paymentUrl: paymentRedirectUrl,
      phonepeResponse: responseData,
      updatedAt: new Date().toISOString(),
    });

    console.log("✅ Payment initiated successfully:", merchantTransactionId);

    return NextResponse.json({
      success: true,
      url: paymentRedirectUrl,
      orderId: merchantTransactionId,
    });

  } catch (error: any) {
    console.error("❌ PHONEPE INIT EXCEPTION:", error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    return NextResponse.json(
      { 
        error: "Payment Initiation Failed", 
        details: error.response?.data?.message || error.message || "An unexpected error occurred"
      },
      { status: 500 }
    );
  }
}
