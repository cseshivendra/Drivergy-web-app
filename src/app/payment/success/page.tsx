'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, ShoppingBag, Fingerprint } from 'lucide-react';

function SuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');

    return (
        <Card className="w-full max-w-lg text-center shadow-2xl border-t-4 border-green-500">
            <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4 bg-green-100 dark:bg-green-900/30">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <CardTitle className="text-3xl font-bold">
                    Payment Successful!
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground pt-2">
                    Thank you for your purchase. Your driving journey starts now!
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>Your enrollment is confirmed. You can now access all the features of your selected plan from your dashboard.</p>
                {orderId && (
                    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2">
                        <Fingerprint className="h-4 w-4 text-gray-500" />
                        <span className="font-mono text-gray-700 dark:text-gray-300">{orderId}</span>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="w-full" variant="outline">
                    <button>
                        <Download className="mr-2 h-4 w-4" />
                        Download Receipt
                    </button>
                </Button>
                <Button asChild className="w-full">
                    <Link href="/dashboard/complete-profile">
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Complete Your Profile
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function PaymentSuccessPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
