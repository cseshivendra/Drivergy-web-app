
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { headers } from "next/headers";

const PHONEPE_AUTH_URL = "https://api.phonepe.com/apis/identity-manager/v1/oauth/token";
const PHONEPE_STATUS_URL_BASE = "https://api.phonepe.com/apis/pg/checkout/v2/order";

async function verifyPaymentStatus(merchantTransactionId: string): Promise<{ code: string; data: any } | null> {
    const clientId = process.env.PHONEPE_CLIENT_ID;
    const clientSecret = process.env.PHONEPE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.error("Webhook Error: PhonePe credentials not set.");
        return null;
    }

    try {
        // Get Auth Token
        const authRes = await fetch(PHONEPE_AUTH_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CLIENT-ID": clientId,
                "X-CLIENT-SECRET": clientSecret,
            },
        });
        if (!authRes.ok) {
            console.error("Webhook Error: Failed to get auth token.");
            return null;
        }
        const authData = await authRes.json();
        const token = authData.data.accessToken;

        // Check Status
        const statusUrl = `${PHONEPE_STATUS_URL_BASE}/${merchantTransactionId}/status`;
        const statusRes = await fetch(statusUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
                "X-MERCHANT-ID": clientId,
            },
            cache: "no-store",
        });

        if (!statusRes.ok) {
            console.error("Webhook Error: Status check API call failed.");
            return null;
        }
        return statusRes.json();
    } catch (error) {
        console.error("Webhook Error: Exception during status verification.", error);
        return null;
    }
}


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
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const encodedCreds = authHeader.substring(6);
    const decodedCreds = Buffer.from(encodedCreds, 'base64').toString('utf8');
    const [username, password] = decodedCreds.split(':');

    if (username !== webhookUser || password !== webhookPass) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Process the webhook payload
    try {
        if (!adminDb) {
            console.error("Webhook Error: Database not configured.");
            return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
        }

        const body = await req.json();
        const merchantOrderId = body.data.merchantTransactionId;

        const orderRef = adminDb.collection("orders").doc(merchantOrderId);
        const orderSnap = await orderRef.get();

        if (!orderSnap.exists) {
            return NextResponse.json({ error: "Order Not Found" }, { status: 404 });
        }

        // 3. Verify status with PhonePe before updating DB
        const verifiedStatusResult = await verifyPaymentStatus(merchantOrderId);
        
        if (!verifiedStatusResult || verifiedStatusResult.code !== "PAYMENT_SUCCESS") {
             await orderRef.update({
                status: "PAYMENT_FAILED",
                gatewayResponse: body,
                verifiedStatus: verifiedStatusResult,
                updatedAt: new Date().toISOString(),
            });
             return NextResponse.json({ success: true, message: "Handled failed or unverified payment." });
        }
        
        // If we reach here, the payment is verified as successful.
        await orderRef.update({
            status: "PAYMENT_SUCCESS",
            gatewayResponse: body,
            verifiedStatus: verifiedStatusResult,
            updatedAt: new Date().toISOString(),
            paidAt: new Date().toISOString(),
        });

        const orderData = orderSnap.data()!;
        const userRef = adminDb.collection("users").doc(orderData.userId);
        await userRef.update({ subscriptionPlan: orderData.plan });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
