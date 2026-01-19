
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { phonepeEnv, getPhonePeTokenV2 } from "@/lib/payments/phonepe";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(req: Request) {
  try {
    // Validate database connection
    if (!adminDb) {
      console.error("❌ Database not configured");
      return NextResponse.json(
        { error: "Internal Server Error", details: "Database not configured." },
        { status: 500 }
      );
    }
    
    // Parse and validate request body
    const { amount, userId, plan, mobile } = await req.json();

    console.log("📝 Payment initiation request:", { amount, userId, plan, mobile });

    if (!amount || !userId || !plan || !mobile) {
      return NextResponse.json(
        { error: "Missing required fields", details: "amount, userId, plan, and mobile are required" },
        { status: 400 }
      );
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount", details: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    // Validate mobile number (basic validation)
    if (!/^\d{10}$/.test(mobile)) {
      return NextResponse.json(
        { error: "Invalid mobile number", details: "Mobile number must be 10 digits" },
        { status: 400 }
      );
    }

    // Generate unique merchant transaction ID
    const merchantTransactionId = "DRV_" + uuidv4().replace(/-/g, '').slice(0, 30);

    // Create order in database
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

    // Get PhonePe configuration
    const { baseUrl, clientId } = await phonepeEnv();
    console.log("📱 PhonePe config loaded - Base URL:", baseUrl);
    
    // Get OAuth token
    let token: string;
    try {
      token = await getPhonePeTokenV2();
    } catch (tokenError: any) {
      console.error("❌ Token generation failed:", tokenError.message);
      
      // Update order status in DB
      await adminDb.collection("orders").doc(merchantTransactionId).update({
        status: "TOKEN_FAILED",
        error: tokenError.message,
        updatedAt: new Date().toISOString(),
      });
      
      // Return the specific error to the client
      return NextResponse.json(
        { error: "Authentication Failed", details: tokenError.message },
        { status: 500 }
      );
    }

    // Prepare payment payload
    const payload = {
      merchantId: clientId,
      merchantTransactionId,
      merchantUserId: userId.slice(0, 35), // PhonePe limit
      amount: Math.round(amount * 100), // Convert to paise
      redirectUrl: `${process.env.APP_BASE_URL}/payments/phonepe/status/${merchantTransactionId}`,
      callbackUrl: `${process.env.APP_BASE_URL}/api/payments/phonepe/webhook`,
      mobileNumber: mobile,
      paymentInstrument: {
        type: "PAY_PAGE"
      },
    };

    console.log("💳 Initiating payment with payload:", {
      ...payload,
      amount: `₹${amount} (${payload.amount} paise)`
    });

    // Call PhonePe payment API
    const paymentUrl = `${baseUrl}/pg/checkout/v2/pay`;
    
    const res = await fetch(paymentUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-MERCHANT-ID": clientId,
      },
      body: JSON.stringify(payload),
    });

    const responseData = await res.json();

    console.log("📡 PhonePe API response status:", res.status);
    console.log("📡 PhonePe API response data:", responseData);

    // Handle non-OK responses
    if (!res.ok) {
      console.error("❌ PhonePe API error:", responseData);
      
      await adminDb.collection("orders").doc(merchantTransactionId).update({
        status: "INITIATION_FAILED",
        error: responseData.message || `API returned ${res.status}`,
        phonepeResponse: responseData,
        updatedAt: new Date().toISOString(),
      });
      
      return NextResponse.json(
        { 
          error: "Payment Initiation Failed", 
          details: responseData.message || `PhonePe API returned ${res.status}`,
          code: responseData.code
        },
        { status: 500 }
      );
    }

    // Validate success response from PhonePe
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

    // Extract payment URL
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

    // Update order with payment URL
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
    console.error("❌ PHONEPE INIT EXCEPTION:", error);
    console.error("Stack trace:", error.stack);
    
    return NextResponse.json(
      { 
        error: "Internal Server Error", 
        details: error.message || "An unexpected error occurred"
      },
      { status: 500 }
    );
  }
}
