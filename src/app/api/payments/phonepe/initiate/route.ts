
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

    const phonepeBaseUrl = process.env.PHONEPE_BASE_URL;
    const phonepeClientId = process.env.PHONEPE_CLIENT_ID;
    
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
        { error: "Authentication Failed", details: tokenError.message },
        { status: 500 }
      );
    }

    const payload = {
      merchantId: phonepeClientId,
      merchantTransactionId,
      merchantUserId: userId.slice(0, 35),
      amount: Math.round(amount * 100),
      redirectUrl: `${process.env.APP_BASE_URL}/payments/phonepe/status/${merchantTransactionId}`,
      callbackUrl: `${process.env.APP_BASE_URL}/api/payments/phonepe/webhook`,
      mobileNumber: mobile,
      paymentInstrument: {
        type: "PAY_PAGE"
      },
    };

    const paymentUrl = `${phonepeBaseUrl}/checkout/v2/pay`;
    
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

    const paymentRedirectUrl = responseData?.data?.instrumentResponse?.redirectInfo?.url;
    
    if (!paymentRedirectUrl) {
      console.error("❌ Missing payment URL in response:", responseData);
      await adminDb.collection("orders").doc(merchantTransactionId).update({
        status: "INITIATION_FAILED",
        error: "Missing payment redirect URL",
        phonepeResponse: responseData,
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.json(
        { error: "Invalid Response", details: "Payment URL not found in response" },
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
