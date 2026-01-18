'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, ShieldCheck, User, Phone, Mail, IndianRupee } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Loading from '@/app/loading';
import { DrivergyLogo } from '@/components/ui/logo';
import Image from 'next/image';

export default function PhonePePaymentPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Get plan details from URL, provide defaults for direct access
    const plan = searchParams.get('plan') || 'Selected Plan';
    const price = searchParams.get('price') || '0';

    const handlePayment = async () => {
        if (!user) {
            toast({ title: 'Authentication Error', description: 'You must be logged in to make a payment.', variant: 'destructive' });
            return;
        }

        setIsProcessing(true);
        try {
            const response = await fetch('/api/payments/phonepe/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseInt(price, 10),
                    name: user.name,
                    phone: user.phone,
                    email: user.contact,
                }),
            });

            const data = await response.json();

            if (data.success && data.redirectUrl) {
                router.push(data.redirectUrl);
            } else {
                throw new Error(data.error || 'Failed to initiate payment.');
            }
        } catch (error) {
            console.error("Payment initiation failed:", error);
            toast({
                title: 'Payment Error',
                description: error instanceof Error ? error.message : 'Could not start the payment process.',
                variant: 'destructive',
            });
            setIsProcessing(false);
        }
    };

    if (authLoading) {
        return <Loading />;
    }
    
    if (!user) {
        // This shouldn't happen with the updated auth flow, but as a fallback
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        return <Loading />;
    }

    return (
        <div className="flex items-center justify-center p-4 min-h-screen bg-gray-50 dark:bg-gray-900">
            <Card className="w-full max-w-md shadow-2xl border-t-4 border-red-600">
                <CardHeader className="text-center space-y-4">
                    <DrivergyLogo className="mx-auto h-10 w-auto" />
                    <CardTitle className="font-headline text-2xl font-bold text-gray-800 dark:text-white">
                        Payment Summary
                    </CardTitle>
                    <CardDescription>
                        Complete your secure payment with PhonePe.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 dark:text-gray-400 flex items-center"><User className="mr-2 h-4 w-4" />Customer Name:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{user.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 dark:text-gray-400 flex items-center"><Mail className="mr-2 h-4 w-4" />Email:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{user.contact}</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-gray-500 dark:text-gray-400 flex items-center"><Phone className="mr-2 h-4 w-4" />Phone:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{user.phone}</span>
                        </div>
                    </div>

                    <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-dashed border-red-200 dark:border-red-800">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Amount to Pay</p>
                        <p className="text-5xl font-bold text-red-600 dark:text-red-500 tracking-tight">
                            <IndianRupee className="inline-block h-8 w-8 -mt-2" />
                            {parseInt(price, 10).toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">For {plan} Plan</p>
                    </div>

                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button 
                        onClick={handlePayment} 
                        className="w-full h-14 text-lg bg-[#6739B7] hover:bg-[#562E9C] text-white flex items-center gap-2" 
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing...</>
                        ) : (
                            <>
                                <Image src="https://res.cloudinary.com/dssbgilba/image/upload/v1753303666/phonepe-icon-new_xxtj7t.png" alt="PhonePe" width={28} height={28} />
                                Pay with PhonePe
                            </>
                        )}
                    </Button>
                    <div className="flex items-center text-xs text-gray-400">
                        <ShieldCheck className="h-4 w-4 mr-1 text-green-500"/>
                        <span>100% Secure & Encrypted Payment</span>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
