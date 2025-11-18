
// src/app/payments/phonepe/status/[id]/page.tsx
import { getStatus } from "@/lib/payments/phonepe";
import { phonepeEnv } from "@/lib/payments/phonepe";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { adminDb } from "@/lib/firebase/admin";
import { updateUserProfile } from "@/lib/server-actions";

type Props = { params: { id: string } };

export default async function StatusPage({ params }: Props) {
  const { merchantId } = phonepeEnv();
  
  let statusResult;
  let plan = '';
  let price = '0';
  
  try {
      statusResult = await getStatus(merchantId, params.id);

      // Securely update order details in the database based on the server-side status check
      if (adminDb && statusResult?.data?.merchantTransactionId) {
          const orderRef = adminDb.collection('orders').doc(statusResult.data.merchantTransactionId);
          const orderSnap = await orderRef.get();
          if (orderSnap.exists) {
            const orderData = orderSnap.data()!;
            plan = orderData.plan;
            price = orderData.amount;
            await orderRef.update({ 
                status: statusResult.code, 
                gatewayResponse: statusResult.data 
            });

            if (statusResult.code === 'PAYMENT_SUCCESS') {
                const userRef = adminDb.collection('users').doc(orderData.userId);
                await userRef.update({
                    subscriptionPlan: orderData.plan,
                });
            }
          }
      }

  } catch (error) {
      console.error("Error fetching payment status:", error);
      statusResult = { code: 'FETCH_ERROR', message: 'Could not retrieve payment status.' };
  }


  const code = statusResult?.code;
  const isSuccess = code === 'PAYMENT_SUCCESS';

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
        <Card className="w-full max-w-md text-center shadow-xl">
            <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4">
                    {isSuccess ? <CheckCircle className="h-12 w-12 text-green-500" /> : <XCircle className="h-12 w-12 text-destructive" />}
                </div>
                <CardTitle className="text-2xl font-bold">
                    {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
                </CardTitle>
                <CardDescription>
                    {isSuccess ? 'Thank you for your payment. Your plan is now active.' : 'Unfortunately, your payment could not be processed.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="flex justify-between border-t pt-4">
                    <span>Order ID:</span>
                    <span className="font-mono">{params.id}</span>
                </div>
                <div className="flex justify-between">
                    <span>Payment Status:</span>
                    <span className="font-semibold">{code}</span>
                </div>
                 <div className="flex justify-between">
                    <span>Amount Paid:</span>
                    <span className="font-semibold">₹{(statusResult?.data?.amount || 0) / 100}</span>
                </div>
            </CardContent>
            <CardFooter>
                 <Button asChild className="w-full">
                    <Link href={isSuccess ? `/dashboard/complete-profile?plan=${encodeURIComponent(plan)}&price=${price}` : '/#subscriptions'}>
                       {isSuccess ? 'Complete Your Profile' : 'Try Another Plan'}
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    </div>
  );
}
