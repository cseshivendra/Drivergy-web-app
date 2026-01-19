
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { headers } from "next/headers";
import { getStatusV2 } from "@/lib/payments/phonepe";

export async function POST(req: Request) {
    // 1. Authenticate the webhook request
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    const webhookUser = process.env.PHONEPE_WEBHOOK_USER;
    const webhookPass = process.env.PHONEPE_WEBHOOK_PASS;

    if (!webhookUser || !webhookPass) {
        console.error("Webhook security credentials are not set on the server.");
        return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
    }

    if (!authHeader || !authHeader.startsWith('Basic ')) {
        console.log("Webhook Unauthorized: Missing or malformed Basic Auth header");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const encodedCreds = authHeader.substring(6);
    const decodedCreds = Buffer.from(encodedCreds, 'base64').toString('utf8');
    const [username, password] = decodedCreds.split(':');

    if (username !== webhookUser || password !== webhookPass) {
        console.log("Webhook Forbidden: Invalid credentials");
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.log("✅ Webhook authenticated successfully.");

    // 2. Process the webhook payload
    try {
        if (!adminDb) {
            console.error("Webhook Error: Database not configured.");
            return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
        }

        const body = await req.json();
        console.log("🔔 PhonePe webhook received:", body);

        // PhonePe sends a base64 encoded response for server-to-server callbacks
        if (!body.response) {
             console.error("❌ Webhook missing 'response' field.");
             return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
        }
        
        const decodedResponse = JSON.parse(Buffer.from(body.response, 'base64').toString('utf8'));
        console.log("🔔 Decoded Webhook Response:", decodedResponse);

        const { merchantTransactionId } = decodedResponse;

        if (!merchantTransactionId) {
            console.error("❌ Webhook missing merchantTransactionId in decoded payload.");
            return NextResponse.json({ error: "Invalid webhook data" }, { status: 400 });
        }

        // 3. Verify status with PhonePe before updating DB (Security Best Practice)
        const verifiedStatusResult = await getStatusV2(merchantTransactionId);
        
        if (!verifiedStatusResult || !verifiedStatusResult.success) {
            console.error(`❌ Webhook S2S verification failed for ${merchantTransactionId}.`);
            await adminDb.collection("orders").doc(merchantTransactionId).update({
                status: "VERIFICATION_FAILED",
                webhookData: body,
                s2sVerificationResponse: verifiedStatusResult,
                updatedAt: new Date().toISOString(),
            });
             return NextResponse.json({ success: true, message: "Handled unverified payment." });
        }
        
        const verifiedState = verifiedStatusResult.data.state;
        
        // 4. Update Database based on verified status
        const orderRef = adminDb.collection("orders").doc(merchantTransactionId);
        const orderSnap = await orderRef.get();

        if (!orderSnap.exists) {
            console.error(`❌ Order ${merchantTransactionId} not found in DB.`);
            return NextResponse.json({ error: "Order Not Found" }, { status: 404 });
        }
        
        if (verifiedState === "COMPLETED") {
            // If we reach here, the payment is verified as successful.
            await orderRef.update({
                status: "PAYMENT_SUCCESS",
                webhookData: body,
                s2sVerificationResponse: verifiedStatusResult.data,
                updatedAt: new Date().toISOString(),
                paidAt: new Date().toISOString(),
                transactionId: verifiedStatusResult.data.transactionId
            });

            const orderData = orderSnap.data()!;
            const userRef = adminDb.collection("users").doc(orderData.userId);
            await userRef.update({ subscriptionPlan: orderData.plan });

            console.log(`✅ Webhook processed successfully for ${merchantTransactionId}: PAYMENT_SUCCESS`);
        } else {
             await orderRef.update({
                status: "PAYMENT_FAILED",
                webhookData: body,
                s2sVerificationResponse: verifiedStatusResult.data,
                updatedAt: new Date().toISOString(),
            });
            console.log(`✅ Webhook processed successfully for ${merchantTransactionId}: PAYMENT_FAILED`);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("❌ Webhook processing error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
