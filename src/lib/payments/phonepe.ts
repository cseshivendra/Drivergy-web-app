
'use server';

// -------- ENV --------
export async function phonepeEnv() {
  if (
    !process.env.PHONEPE_BASE_URL ||
    !process.env.PHONEPE_CLIENT_ID ||
    !process.env.PHONEPE_CLIENT_SECRET ||
    !process.env.PHONEPE_CLIENT_VERSION ||
    !process.env.PHONEPE_MERCHANT_ID
  ) {
    throw new Error("Missing PhonePe V2 credentials. Please check environment variables.");
  }

  return {
    baseUrl: process.env.PHONEPE_BASE_URL,
    clientId: process.env.PHONEPE_CLIENT_ID,
    clientSecret: process.env.PHONEPE_CLIENT_SECRET,
    clientVersion: process.env.PHONEPE_CLIENT_VERSION,
    merchantId: process.env.PHONEPE_MERCHANT_ID
  };
}

//--------------------------------------------------------

//-------------------------------------------------------


// -------- V2 AUTH TOKEN --------
export async function getPhonePeTokenV2() {
  const { baseUrl, clientId, clientSecret, clientVersion, merchantId } = await phonepeEnv();
  
  // As per docs, this URL is for production
  const authUrl = `${baseUrl}/identity-manager/v1/oauth/token`; 
  
  console.log("Token merchantId:", process.env.PHONEPE_MERCHANT_ID);
  console.log("Payment merchantId:", merchantId);

  try {
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('version', clientVersion);
    params.append('grant_type', 'client_credentials');

    const res = await fetch(authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
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
    console.log("✅Access Token generated");
    return responseData.access_token;
    
  } catch (error: any) {
    console.error("❌ Failed to get PhonePe token:", error.message);
    throw error;
  }
}



// -------- V2 ORDER STATUS --------
export async function getStatusV2(merchantTransactionId: string) {
  const { baseUrl, clientId } = await phonepeEnv();
 const token = await getPhonePeTokenV2();
  const statusUrl = `${baseUrl}/pg/checkout/v2/order/${merchantTransactionId}/status`;

  try {
    const res = await fetch(statusUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `O-Bearer ${token}`,
        // "X-MERCHANT-ID": clientId,
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
  const { baseUrl, clientId } = await phonepeEnv();
  const token = await getPhonePeTokenV2();

  const refundUrl = `${baseUrl}/pg/payments/v2/refund`;
  const merchantId = clientId
  const payload = {
    merchantId,
    merchantRefundId,      // must be unique refund id
    originalTransactionId, // PhonePe txn id
    amount: amount * 100,  // paise
  };

  try {
    const res = await fetch(refundUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `O-Bearer ${token}`,
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
