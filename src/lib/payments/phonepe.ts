
import crypto from "crypto";

// Provides PhonePe credentials.
export function phonepeEnv() {
    return {
        merchantId: process.env.PHONEPE_MERCHANT_ID!,
        saltKey: process.env.PHONEPE_SALT_KEY!,
        saltIndex: parseInt(process.env.PHONEPE_SALT_INDEX!, 10),
        baseUrl: process.env.PHONEPE_BASE_URL!,
        webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/phonepe/webhook`,
    };
}

// Function to generate the X-VERIFY signature for the /pg/v1/pay API
export function generatePayPageSignature(base64Payload: string, saltKey: string, saltIndex: number): string {
    const dataToSign = base64Payload + '/pg/v1/pay' + saltKey;
    const sha256 = crypto.createHash('sha256').update(dataToSign).digest('hex');
    return `${sha256}###${saltIndex}`;
}

// Function to verify the webhook signature
export function verifyWebhookSignature(base64Payload: string, saltKey: string, saltIndex: number, xVerifyHeader: string): boolean {
    const expectedSignature = crypto.createHash('sha256').update(base64Payload + saltKey).digest('hex') + '###' + saltIndex;
    return expectedSignature === xVerifyHeader;
}
