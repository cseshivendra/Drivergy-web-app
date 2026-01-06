export async function getPhonePeToken() {
  const body = new URLSearchParams({
    client_id: process.env.PHONEPE_CLIENT_ID!,
    client_secret: process.env.PHONEPE_CLIENT_SECRET!,
    client_version: process.env.PHONEPE_CLIENT_VERSION!,
    grant_type: "client_credentials",
  });

  const res = await fetch(
    `${process.env.PHONEPE_BASE_URL}/identity-manager/v1/oauth/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    }
  );

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
