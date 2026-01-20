
'use server';

import axios from 'axios';

// -------- V2 AUTH TOKEN --------
export async function getPhonePeTokenV2(): Promise<string> {
  const clientId = process.env.PHONEPE_CLIENT_ID;
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
  const clientVersion = process.env.PHONEPE_CLIENT_VERSION;

  if (!clientId || !clientSecret || !clientVersion) {
    throw new Error("Missing PhonePe V2 credentials. Check environment variables: CLIENT_ID, CLIENT_SECRET, CLIENT_VERSION");
  }
  
  const authUrl = "https://api.phonepe.com/apis/identity-manager/v1/oauth/token";

  try {
    const formData = new URLSearchParams();
    formData.append('client_id', clientId);
    formData.append('client_version', clientVersion);
    formData.append('client_secret', clientSecret);
    formData.append('grant_type', 'client_credentials');
    
    // Explicitly convert the form data to a string to ensure correct encoding.
    const requestBody = formData.toString();

    const response = await axios({
        method: 'post',
        url: authUrl,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: requestBody,
    });
    
    if (!response.data || !response.data.access_token) {
      console.error("Invalid auth response from PhonePe:", response.data);
      throw new Error('Invalid auth response from PhonePe: Missing access_token');
    }

    console.log("✅ PhonePe V2 token obtained successfully");
    return response.data.access_token;

  } catch (error: any) {
    console.error('Error getting PhonePe auth token:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    // Re-throw a more specific error to be caught by the API route
    const errorMessage = error.response?.data?.msg || error.response?.data?.message || "Failed to obtain payment gateway token";
    throw new Error(errorMessage);
  }
}

// -------- V2 ORDER STATUS --------
export async function getStatusV2(merchantTransactionId: string) {
  const phonepeBaseUrl = process.env.PHONEPE_BASE_URL;
  if (!phonepeBaseUrl) {
      throw new Error("PhonePe base URL not set for status check.");
  }
  const token = await getPhonePeTokenV2();
  const statusUrl = `${phonepeBaseUrl}/checkout/v2/order/${merchantTransactionId}/status`;

  try {
    const response = await axios.get(statusUrl, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `O-Bearer ${token}`,
      },
    });

    console.log("✅ Payment status retrieved:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Failed to check payment status:", error.message);
    if (error.response) {
        console.error('Status Check Response Status:', error.response.status);
        console.error('Status Check Response Data:', JSON.stringify(error.response.data, null, 2));
    }
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
  if (!phonepeBaseUrl) {
      throw new Error("PhonePe environment variables not set for refund.");
  }
  const token = await getPhonePeTokenV2();
  const refundUrl = `${phonepeBaseUrl}/payments/v2/refund`;

  const payload = {
    merchantId: process.env.PHONEPE_CLIENT_ID,
    merchantRefundId,      // must be unique refund id
    originalTransactionId, // PhonePe txn id
    amount: amount * 100,  // paise
  };

  try {
    const response = await axios.post(refundUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `O-Bearer ${token}`,
      },
    });
    console.log("✅ Refund initiated:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Failed to initiate refund:", error.message);
     if (error.response) {
        console.error('Refund Response Status:', error.response.status);
        console.error('Refund Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}
