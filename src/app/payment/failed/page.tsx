'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, Repeat, Fingerprint, LifeBuoy } from 'lucide-react';

function FailedContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get('orderId');

    return (
        <Card className="w-full max-w-lg text-center shadow-2xl border-t-4 border-red-500">
            <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4 bg-red-100 dark:bg-red-900/30">
                    <XCircle className="h-12 w-12 text-red-500" />
                </div>
                <CardTitle className="text-3xl font-bold">
                    Payment Failed
                </CardTitle>
                <CardDescription className="text-lg text-muted-foreground pt-2">
                    Unfortunately, we were unable to process your payment.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>Please try again. If the problem persists, contact your bank or our support team.</p>
                {orderId && (
                    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2">
                        <Fingerprint className="h-4 w-4 text-gray-500" />
                        <span className="font-mono text-gray-700 dark:text-gray-300">{orderId}</span>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="w-full" variant="outline">
                    <Link href="/contact">
                        <LifeBuoy className="mr-2 h-4 w-4" />
                        Contact Support
                    </Link>
                </Button>
                <Button onClick={() => router.back()} className="w-full">
                    <Repeat className="mr-2 h-4 w-4" />
                    Try Again
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function PaymentFailedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <FailedContent />
      </Suspense>
    </div>
  );
}
