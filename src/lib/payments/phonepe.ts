
'use server';

export async function phonepeEnv() {
  if (
    !process.env.PHONEPE_BASE_URL ||
    !process.env.PHONEPE_CLIENT_ID ||
    !process.env.PHONEPE_CLIENT_SECRET
  ) {
    throw new Error("Missing PhonePe V2 credentials");
  }

  return {
    baseUrl: process.env.PHONEPE_BASE_URL, // https://api.phonepe.com/apis
    clientId: process.env.PHONEPE_CLIENT_ID,
    clientSecret: process.env.PHONEPE_CLIENT_SECRET,
  };
}

// -------- V2 AUTH TOKEN --------
export async function getPhonePeTokenV2() {
  const { clientId, clientSecret } = await phonepeEnv();
  
  const authUrl = "https://api.phonepe.com/apis/identity-manager/v1/oauth/token";

  try {
    const res = await fetch(authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CLIENT-ID": clientId,
        "X-CLIENT-SECRET": clientSecret,
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("PhonePe V2 token error response:", errorText);
      throw new Error(`Token API failed with status ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    
    if (!data?.data?.accessToken) {
      console.error("Invalid token response structure:", data);
      throw new Error("Token response missing accessToken");
    }

    console.log("✅ PhonePe token obtained successfully");
    return data.data.accessToken;
  } catch (error: any) {
    console.error("❌ Failed to get PhonePe token:", error.message);
    throw error;
  }
}

// -------- V2 ORDER STATUS --------
export async function getStatusV2(merchantTransactionId: string) {
  const { baseUrl, clientId } = await phonepeEnv();
  const token = await getPhonePeTokenV2();

  try {
    const statusUrl = `${baseUrl}/pg/checkout/v2/order/${merchantTransactionId}/status`;
    
    const res = await fetch(statusUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-MERCHANT-ID": clientId,
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
  merchantTransactionId: string,
  originalTransactionId: string,
  amount: number
) {
  const { baseUrl, clientId } = await phonepeEnv();
  const token = await getPhonePeTokenV2();

  try {
    const refundUrl = `${baseUrl}/pg/payments/v2/refund`;
    
    const payload = {
      merchantId: clientId,
      merchantTransactionId, // Unique refund transaction ID
      originalTransactionId, // Original payment transaction ID
      amount: amount * 100, // Amount in paise
    };

    const res = await fetch(refundUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-MERCHANT-ID": clientId,
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
