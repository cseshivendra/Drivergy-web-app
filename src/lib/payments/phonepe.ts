
// src/lib/payments/phonepe.ts
import crypto from "crypto";

type EnvCfg = {
  merchantId: string;
  clientId: string;
  clientSecret: string;
  baseUrl: string;
};

// Provides PhonePe V2 credentials based on the environment.
export function phonepeEnv() {
  const isProd = process.env.PHONEPE_ENV === "production";
  return {
    clientId: isProd
      ? process.env.PHONEPE_PROD_CLIENT_ID!
      : process.env.PHONEPE_UAT_CLIENT_ID!,
    clientSecret: isProd
      ? process.env.PHONEPE_PROD_CLIENT_SECRET!
      : process.env.PHONEPE_UAT_CLIENT_SECRET!,
    baseUrl: isProd
      ? "https://api.phonepe.com/apis/hermes"
      : "https://api-preprod.phonepe.com/apis/pg-sandbox",
  };
}

// PhonePe V2 Signature: SHA256(base64Payload + apiEndpoint + salt) + ### + saltIndex
// For V2, the salt is the clientSecret and the saltIndex is always 1.
export function signV2(base64Payload: string, apiEndpoint: string, clientSecret: string) {
  const toSign = base64Payload + apiEndpoint + clientSecret;
  const sha = crypto.createHash("sha256").update(toSign).digest("hex");
  return `${sha}###1`;
}

// POST request function for V2 API
export async function postPhonePe(path: string, body: unknown) {
  const { baseUrl, clientSecret, clientId } = phonepeEnv();
  const payload = Buffer.from(JSON.stringify(body)).toString("base64");
  const xVerify = signV2(payload, path, clientSecret);

  const headers = {
    "Content-Type": "application/json",
    "X-VERIFY": xVerify,
    "X-CLIENT-ID": clientId,
  };

  const requestBody = { request: payload };
  const fullUrl = `${baseUrl}${path}`;

  // --- Start of Added Debug Logging ---
  console.log("--- PhonePe V2 Request Debug Info ---");
  console.log("API Host (Endpoint):", fullUrl);
  console.log("Request Headers:", JSON.stringify(headers, null, 2));
  console.log("Request Payload (Body):", JSON.stringify(requestBody, null, 2));
  console.log("--- End of Debug Info ---");
  // --- End of Added Debug Logging ---

  const res = await fetch(fullUrl, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(requestBody),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`PhonePe POST ${path} failed: ${res.status}`, text);
    throw new Error(`PhonePe ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}


// GET request function for V2 API (used for checking status)
export async function getStatus(merchantId: string, merchantTransactionId: string) {
    const { baseUrl, clientSecret, clientId } = phonepeEnv();
    const path = `/pg/v1/status/${merchantId}/${merchantTransactionId}`;

    // For V2 GET requests, the signature is calculated on the path + salt
    const toSign = path + clientSecret;
    const sha = crypto.createHash("sha256").update(toSign).digest("hex");
    const xVerify = `${sha}###1`;

    const res = await fetch(`${baseUrl}${path}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "X-VERIFY": xVerify,
            "X-CLIENT-ID": clientId,
            "X-MERCHANT-ID": merchantId,
        },
        cache: "no-store",
    });

    if (!res.ok) {
        const text = await res.text();
        console.error(`PhonePe GET ${path} failed: ${res.status}`, text);
        throw new Error(`PhonePe status check failed: ${res.status} ${text}`);
    }
    return res.json();
}
