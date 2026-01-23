const axios = require('axios');
const querystring = require('querystring');
const crypto = require('crypto');

const config = {
  sandbox: {
    AUTH_URL: "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token",
    BASE_URL: "https://api-preprod.phonepe.com/apis/pg-sandbox",
    MERCHANT_ID: process.env.PHONEPE_MERCHANT_ID || "M22MWGDFGFD6UUAT",
    CLIENT_ID: process.env.PHONEPE_CLIENT_ID || "M22MWK1SG3L6UUAT_2502061114552324324324297",
    CLIENT_SECRET: process.env.PHONEPE_CLIENT_SECRET || "MDRlNTQSD4fdgfdggfdgGDFDzLThkMmEtOGVmZmYxMTM5ZWIy",
    CLIENT_VERSION: "1"
  },
  production: {
    AUTH_URL: "https://api.phonepe.com/apis/identity-manager/v1/oauth/token",
    BASE_URL: "https://api.phonepe.com/apis/pg",
    MERCHANT_ID: process.env.PHONEPE_MERCHANT_ID || "M22MWGDFGFD6UUAT",
    CLIENT_ID: process.env.PHONEPE_CLIENT_ID || "SU250305202148979887207371",
    CLIENT_SECRET: process.env.PHONEPE_CLIENT_SECRET || "ba46ef40-67gjf-40b2-a4d9-7345gfdg5ca35aecb",
    CLIENT_VERSION: process.env.PHONEPE_CLIENT_VERSION || "1"
  }
};

const ENV = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
console.log(`Using PhonePe ${ENV} environment`);

const { AUTH_URL, BASE_URL, MERCHANT_ID, CLIENT_ID, CLIENT_SECRET, CLIENT_VERSION } = config[ENV];

let tokenCache = {
  token: null,
  expiresAt: 0
};

const getAuthToken = async () => {
  try {
    const now = Math.floor(Date.now() / 1000);
    if (tokenCache.token && tokenCache.expiresAt > now + 300) {
      console.log('Using cached PhonePe auth token');
      return tokenCache.token;
    }

    console.log(`Fetching new PhonePe auth token (${ENV})`);
    
    const formData = new URLSearchParams();
    formData.append('client_id', CLIENT_ID);
    formData.append('client_version', CLIENT_VERSION);
    formData.append('client_secret', CLIENT_SECRET);
    formData.append('grant_type', 'client_credentials');
    
    console.log('Auth request form data:', formData.toString());

    const response = await axios({
      method: 'post',
      url: AUTH_URL,
      data: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('Auth response:', response.data);

    if (!response.data || !response.data.access_token) {
      console.error('Invalid auth response from PhonePe:', response.data);
      throw new Error('Invalid auth response from PhonePe: Missing access_token');
    }
    
    console.log('Auth token obtained successfully');
    
    tokenCache = {
      token: response.data.access_token,
      expiresAt: response.data.expires_at || (now + 3600)
    };
    
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting PhonePe auth token:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Response Headers:', JSON.stringify(error.response.headers, null, 2));
    }
    throw error;
  }
};

const createPhonePeOrder = async (orderId, amount, customerDetails) => {
  try {
    const token = await getAuthToken();
    
    const merchantOrderId = orderId || `TX${Date.now()}`;
    
    const amountInPaise = Math.round(amount * 100);
    
    const payload = {
      merchantOrderId: merchantOrderId,
      amount: amountInPaise,
      expireAfter: 1200,
      metaInfo: {
        udf1: customerDetails.customerId || "",
        udf2: customerDetails.customerEmail || "",
        udf3: customerDetails.customerPhone || "",
        udf4: "",
        udf5: ""
      },
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: "Payment for Drivergy",
        merchantUrls: {
          redirectUrl: `${process.env.FRONTEND_URL || 'https://drivergy.in'}/add-money/verify?transactionId=${merchantOrderId}`
        }
      }
    };
    
    console.log(`PhonePe Order Payload (${ENV}):`, JSON.stringify(payload, null, 2));
    
    const payApiUrl = `${BASE_URL}/checkout/v2/pay`;
    
    console.log('Making PhonePe API request:', {
      url: payApiUrl,
      merchantOrderId: merchantOrderId
    });

    const response = await axios.post(
      payApiUrl,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `O-Bearer ${token}`
        }
      }
    );
    
    console.log("PhonePe Order Response:", JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.redirectUrl) {
      return {
        success: true,
        transactionId: merchantOrderId,
        paymentUrl: response.data.redirectUrl,
        orderAmount: amount,
        orderId: merchantOrderId,
        pgOrderId: response.data.orderId
      };
    } else {
      throw new Error(response.data?.message || "Failed to create PhonePe order");
    }
  } catch (error) {
    console.error('Error creating PhonePe order:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
};

const verifyPhonePePayment = async (merchantOrderId) => {
  try {
    const token = await getAuthToken();
    
    console.log(`Verifying payment for transaction (${ENV}):`, merchantOrderId);
    
    const statusApiUrl = `${BASE_URL}/checkout/v2/order/${merchantOrderId}/status`;
    
    const response = await axios.get(
      statusApiUrl,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `O-Bearer ${token}`
        }
      }
    );
    
    console.log("PhonePe Verification Response:", JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.state) {
      const state = response.data.state;
      const amount = (response.data.amount || 0) / 100;
      
      if (state === "COMPLETED") {
        return {
          success: true,
          amount: amount,
          transactionId: merchantOrderId,
          pgOrderId: response.data.orderId,
          state: state
        };
      } else if (state === "PENDING") {
        return {
          success: false,
          message: "Payment is still pending",
          state: state
        };
      } else {
        return {
          success: false,
          message: response.data.errorCode || "Payment failed",
          errorDetails: response.data.errorContext || {},
          state: state
        };
      }
    } else {
      return {
        success: false,
        message: "Invalid response from PhonePe",
        data: response.data
      };
    }
  } catch (error) {
    console.error('Error verifying PhonePe payment:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    return { 
      success: false, 
      error: error.message, 
      details: error.response?.data 
    };
  }
};

const verifyWebhookSignature = (authHeader, username, password) => {
  if (!authHeader || !username || !password) return false;
  
  try {
    const receivedHash = authHeader.replace('SHA256 ', '');
    
    const credentials = `${username}:${password}`;
    const expectedHash = crypto
      .createHash('sha256')
      .update(credentials)
      .digest('hex');
    
    return expectedHash === receivedHash;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
};

module.exports = { 
  createPhonePeOrder, 
  verifyPhonePePayment,
  verifyWebhookSignature
};
