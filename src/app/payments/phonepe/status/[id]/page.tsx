
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

function StatusChecker() {
    const router = useRouter();
    const params = useParams();
    const orderId = params.id as string;

    const [status, setStatus] = useState('PENDING');
    const [attempts, setAttempts] = useState(0);

    useEffect(() => {
        if (!orderId) return;

        const checkStatus = async () => {
            try {
                const response = await fetch(`/api/payments/phonepe/status?orderId=${orderId}`);
                if (!response.ok) {
                    // Stop polling on server error
                    setStatus('ERROR');
                    router.push(`/payment/failed?orderId=${orderId}&reason=error`);
                    return;
                }
                const result = await response.json();

                if (result.status === 'PAYMENT_SUCCESS') {
                    setStatus('SUCCESS');
                    router.push(`/payment/success?orderId=${orderId}`);
                } else if (['PAYMENT_ERROR', 'PAYMENT_CANCELLED', 'TIMED_OUT', 'PAYMENT_DECLINED', 'TRANSACTION_NOT_FOUND'].includes(result.status)) {
                    setStatus('FAILED');
                    router.push(`/payment/failed?orderId=${orderId}`);
                } else {
                    setAttempts(prev => prev + 1);
                }
            } catch (error) {
                console.error("Status check failed:", error);
                setStatus('ERROR');
                 router.push(`/payment/failed?orderId=${orderId}&reason=error`);
            }
        };

        const intervalId = setInterval(() => {
            // Stop polling after 10 attempts (e.g., 30 seconds)
            if (attempts >= 10) {
                clearInterval(intervalId);
                setStatus('TIMED_OUT');
                 router.push(`/payment/failed?orderId=${orderId}&reason=timeout`);
                return;
            }
            if (status === 'PENDING') {
              checkStatus();
            }
        }, 3000); // Poll every 3 seconds

        // Cleanup interval on component unmount
        return () => clearInterval(intervalId);

    }, [orderId, router, attempts, status]);

    return (
        <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex items-center justify-center">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                </div>
                <CardTitle className="font-headline text-2xl font-bold">Verifying Payment</CardTitle>
                <CardDescription>
                    Please wait while we confirm your payment status. Do not close this window.
                </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
                <p>Order ID: {orderId}</p>
                <p className="mt-2">This may take a few moments.</p>
            </CardContent>
        </Card>
    );
}


export default function PaymentStatusPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
           <Suspense fallback={<Loader2 className="h-16 w-16 animate-spin text-primary" />}>
                <StatusChecker />
           </Suspense>
        </div>
    );
}
