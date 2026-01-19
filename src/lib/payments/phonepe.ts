
'use server';

export async function phonepeEnv() {
  if (
    !process.env.PHONEPE_API_DOMAIN ||
    !process.env.PHONEPE_CLIENT_ID ||
    !process.env.PHONEPE_CLIENT_SECRET
  ) {
    throw new Error("Missing PhonePe V2 credentials");
  }

  return {
    apiDomain: process.env.PHONEPE_API_DOMAIN,
    clientId: process.env.PHONEPE_CLIENT_ID,
    clientSecret: process.env.PHONEPE_CLIENT_SECRET,
  };
}

// -------- V2 AUTH TOKEN --------
export async function getPhonePeTokenV2() {
  const { apiDomain, clientId, clientSecret } = await phonepeEnv();
  
  const authUrl = `${apiDomain}/apis/identity-manager/v1/oauth/token`;

  const res = await fetch(authUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CLIENT-ID": clientId,
      "X-CLIENT-SECRET": clientSecret,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("PhonePe V2 token error:", text);
    throw new Error("Failed to get V2 token");
  }

  const data = await res.json();
  return data.data.accessToken;
}

// -------- V2 ORDER STATUS --------
export async function getStatusV2(merchantTransactionId: string) {
  const { apiDomain, clientId } = await phonepeEnv();
  const token = await getPhonePeTokenV2();

  const statusUrl = `${apiDomain}/apis/pg/checkout/v2/order/${merchantTransactionId}/status`;

  const res = await fetch(
    statusUrl,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-MERCHANT-ID": clientId,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("PhonePe V2 status error:", text);
    throw new Error("Status check failed");
  }

  return res.json();
}
