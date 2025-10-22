// src/lib/payments/phonepe.ts
import crypto from "crypto";

type EnvCfg = {
  merchantId: string;
  saltKey: string;
  saltIndex: string;
  baseUrl: string;
};

export function phonepeEnv(): EnvCfg {
  const isProd = process.env.PHONEPE_ENV === "production";
  return {
    merchantId: process.env.PHONEPE_MERCHANT_ID!,
    saltKey: isProd ? process.env.PHONEPE_MERCHANT_PROD_SALT_KEY! : process.env.PHONEPE_MERCHANT_UAT_SALT_KEY!,
    saltIndex: process.env.PHONEPE_MERCHANT_SALT_INDEX || "1",
    baseUrl: isProd ? process.env.PHONEPE_BASE_URL_PROD! : process.env.PHONEPE_BASE_URL_SANDBOX!,
  };
}

// PhonePe requires payload base64 + X-VERIFY header: SHA256(payload + "/pg/v1/pay" + saltKey) + "###" + saltIndex
// Endpoints and signature patterns vary; confirm in latest docs for your chosen flow.
export function signForPath(base64Payload: string, path: string, saltKey: string, saltIndex: string) {
  const toSign = base64Payload + path + saltKey;
  const sha = crypto.createHash("sha256").update(toSign).digest("hex");
  return `${sha}###${saltIndex}`;
}

export async function postPhonePe(path: string, body: unknown) {
  const { baseUrl, saltKey, saltIndex } = phonepeEnv();
  const payload = Buffer.from(JSON.stringify(body)).toString("base64");
  const xVerify = signForPath(payload, path, saltKey, saltIndex);

  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-VERIFY": xVerify,
    },
    body: JSON.stringify({ request: payload }),
    cache: "no-store",
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`PhonePe ${path} failed: ${res.status} ${t}`);
  }
  return res.json();
}

// For order status verify: GET with X-VERIFY built over path only form; check docs for exact pattern.
export function signForStatus(path: string, saltKey: string, saltIndex: string) {
  const sha = crypto.createHash("sha256").update(path + saltKey).digest("hex");
  return `${sha}###${saltIndex}`;
}

export async function getStatus(merchantId: string, merchantTransactionId: string) {
  const { baseUrl, saltKey, saltIndex } = phonepeEnv();
  const path = `/pg/v1/status/${merchantId}/${merchantTransactionId}`;
  const xVerify = signForStatus(path, saltKey, saltIndex);

  const res = await fetch(`${baseUrl}${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json", "X-VERIFY": xVerify, "X-MERCHANT-ID": merchantId },
    cache: "no-store",
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`PhonePe status failed: ${res.status} ${t}`);
  }
  return res.json();
}
