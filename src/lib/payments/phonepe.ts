

'use server';
import axios from 'axios';
import { URLSearchParams } from 'url';

let tokenCache: { token: string | null; expiresAt: number } = {
  token: null,
  expiresAt: 0,
};

export async function getPhonePeTokenV2(): Promise<string> {
  const { PHONEPE_CLIENT_ID, PHONEPE_CLIENT_SECRET, PHONEPE_CLIENT_VERSION, PHONEPE_AUTH_URL } = process.env;

  if (!PHONEPE_CLIENT_ID || !PHONEPE_CLIENT_SECRET || !PHONEPE_CLIENT_VERSION || !PHONEPE_AUTH_URL) {
    console.error('Missing PhonePe OAuth env variables');
    throw new Error('Server configuration error: Missing PhonePe credentials.');
  }

  const now = Math.floor(Date.now() / 1000);
  if (tokenCache.token && tokenCache.expiresAt > now + 300) {
    console.log('Using cached PhonePe auth token');
    return tokenCache.token!;
  }
  
  console.log('Fetching new PhonePe auth token');

  const formData = new URLSearchParams();
  formData.append('client_id', PHONEPE_CLIENT_ID);
  formData.append('client_version', PHONEPE_CLIENT_VERSION);
  formData.append('client_secret', PHONEPE_CLIENT_SECRET);
  formData.append('grant_type', 'client_credentials');

  try {
    const response = await axios({
      method: 'post',
      url: PHONEPE_AUTH_URL,
      data: formData.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const tokenData = response.data;
    if (!tokenData?.access_token) {
      console.error('Invalid auth response from PhonePe:', tokenData);
      throw new Error('Invalid auth response from PhonePe: Missing access_token');
    }
    
    console.log('Auth token obtained successfully');

    tokenCache = {
      token: tokenData.access_token,
      expiresAt: tokenData.expires_at || now + 3600,
    };

    return tokenData.access_token;
  } catch (error: any) {
    console.error('Error getting PhonePe auth token:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    throw new Error('Failed to obtain PhonePe auth token.');
  }
}

/* ======================================================
   PAYMENT STATUS
====================================================== */
export async function getStatusV2(merchantOrderId: string) {
  const token = await getPhonePeTokenV2();
  const { PHONEPE_BASE_URL, PHONEPE_CLIENT_ID } = process.env;

  const url =
    `${PHONEPE_BASE_URL}/checkout/v2/order/${merchantOrderId}/status`;

  const response = await axios.get(url, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `O-Bearer ${token}`,
      'X-MERCHANT-ID': PHONEPE_CLIENT_ID,
    }
  });

  return response.data;
}

/* ======================================================
   REFUND
====================================================== */
export async function initiateRefundV2(
  merchantRefundId: string,
  originalTransactionId: string,
  amountPaise: number
) {
  const token = await getPhonePeTokenV2();
  const { PHONEPE_BASE_URL, PHONEPE_CLIENT_ID } = process.env;

  const payload = {
    merchantId: PHONEPE_CLIENT_ID,
    merchantRefundId,
    originalTransactionId,
    amount: amountPaise
  };

  const response = await axios.post(
    `${PHONEPE_BASE_URL}/v2/refund`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `O-Bearer ${token}`
      }
    }
  );

  return response.data;
}

