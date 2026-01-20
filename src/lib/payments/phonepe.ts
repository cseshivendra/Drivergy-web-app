
'use server';

// -------- V2 AUTH TOKEN --------
export async function getPhonePeTokenV2(): Promise<string> {
  const clientId = process.env.PHONEPE_CLIENT_ID;
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
  const clientVersion = process.env.PHONEPE_CLIENT_VERSION;

  if (!clientId || !clientSecret || !clientVersion) {
    throw new Error("Missing PhonePe V2 credentials. Check environment variables.");
  }
  
  // As per docs, this URL is for production
  const authUrl = "https://api.phonepe.com/apis/identity-manager/v1/oauth/token";

  try {
    const formData = new URLSearchParams();
    formData.append('client_id', clientId);
    formData.append('client_secret', clientSecret);
    formData.append('client_version', clientVersion);
    formData.append('grant_type', 'client_credentials');

    const res = await fetch(authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
      cache: "no-store",
    });

    const responseData = await res.json();

    if (!res.ok) {
      console.error("PhonePe V2 token error response:", responseData);
      throw new Error(`Token API failed with status ${res.status}: ${responseData?.msg || "Unknown authentication error"}`);
    }

    if (!responseData?.access_token) {
      console.error("Invalid token response structure:", responseData);
      throw new Error("Token response missing access_token");
    }

    console.log("✅ PhonePe V2 token obtained successfully");
    return responseData.access_token;
  } catch (error: any) {
    console.error("❌ Failed to get PhonePe token:", error.message);
    throw error;
  }
}

// -------- V2 ORDER STATUS --------
export async function getStatusV2(merchantTransactionId: string) {
  const phonepeBaseUrl = process.env.PHONEPE_BASE_URL;
  const phonepeClientId = process.env.PHONEPE_CLIENT_ID;

  if (!phonepeBaseUrl || !phonepeClientId) {
      throw new Error("PhonePe environment variables not set for status check.");
  }

  const token = await getPhonePeTokenV2();

  const statusUrl = `${phonepeBaseUrl}/checkout/v2/order/${merchantTransactionId}/status`;

  try {
    const res = await fetch(statusUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-MERCHANT-ID": phonepeClientId,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("PhonePe V2 status error:", errorText);
      throw new Error(`Status check failed with ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    console.log("✅ Payment status retrieved:", data);
    return data;
  } catch (error: any) {
    console.error("❌ Failed to check payment status:", error.message);
    throw error;
  }
}

// -------- V2 REFUND --------
export async function initiateRefundV2(
  merchantRefundId: string,
  originalTransactionId: string,
  amount: number
) {
  const phonepeBaseUrl = process.env.PHONEPE_BASE_URL;
  const phonepeClientId = process.env.PHONEPE_CLIENT_ID;

  if (!phonepeBaseUrl || !phonepeClientId) {
      throw new Error("PhonePe environment variables not set for refund.");
  }
  const token = await getPhonePeTokenV2();

  const refundUrl = `${phonepeBaseUrl}/pg/payments/v2/refund`;

  const payload = {
    merchantId: phonepeClientId,
    merchantRefundId,      // must be unique refund id
    originalTransactionId, // PhonePe txn id
    amount: amount * 100,  // paise
  };

  try {
    const res = await fetch(refundUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-MERCHANT-ID": phonepeClientId,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("PhonePe V2 refund error:", errorText);
      throw new Error(`Refund failed with ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    console.log("✅ Refund initiated:", data);
    return data;
  } catch (error: any) {
    console.error("❌ Failed to initiate refund:", error.message);
    throw error;
  }
}
