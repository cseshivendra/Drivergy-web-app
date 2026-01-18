
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, ShieldCheck, User, Phone, Mail, IndianRupee, UserPlus, Lock } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Loading from '@/app/loading';
import { DrivergyLogo } from '@/components/ui/logo';
import Image from 'next/image';
import Link from 'next/link';

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
      <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
    </svg>
);

export default function PaymentPage() {
    const { user, loading: authLoading, signInWithGoogle } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [isProcessing, setIsProcessing] = useState(false);
    
    const plan = searchParams.get('plan') || 'Selected Plan';
    const price = searchParams.get('price') || '0';
    
    useEffect(() => {
        if (!authLoading && user && user.subscriptionPlan && user.subscriptionPlan !== 'None') {
            toast({
                title: "Already Subscribed",
                description: "You already have an active subscription. Redirecting to your dashboard.",
            });
            router.push('/dashboard');
        }
    }, [user, authLoading, router, toast]);
    
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
    
    const handleGoogleSignIn = async () => {
        await signInWithGoogle();
        // After signInWithGoogle, the useAuth effect will trigger a re-render.
        // The component will then show the payment summary for the now-logged-in user.
    };

    if (authLoading || (user && user.subscriptionPlan && user.subscriptionPlan !== 'None')) {
        return <Loading />;
    }
    
    // AUTHENTICATION GATE
    if (!user) {
        const redirectPath = `/payment?plan=${plan}&price=${price}`;
        const loginUrl = `/login?redirect=${encodeURIComponent(redirectPath)}`;
        const registerUrl = `/register?role=customer&redirect=${encodeURIComponent(redirectPath)}`;

        return (
            <div className="flex items-center justify-center p-4 min-h-screen bg-gray-50 dark:bg-gray-900">
                <Card className="w-full max-w-md shadow-2xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-3 flex items-center justify-center rounded-full bg-primary/10 p-3 w-fit">
                            <Lock className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="font-headline text-2xl font-bold">Authentication Required</CardTitle>
                        <CardDescription>
                            Please sign in or create an account to purchase the <span className="font-semibold text-primary">{plan}</span> plan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button onClick={handleGoogleSignIn} className="w-full h-12 text-base">
                            <GoogleIcon /> Continue with Google
                        </Button>
                        <div className="relative my-2">
                          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                          <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div>
                        </div>
                         <Button asChild variant="secondary" className="w-full h-12 text-base">
                            <Link href={registerUrl}>
                                <UserPlus className="mr-2 h-5 w-5" /> Register as a New Customer
                            </Link>
                        </Button>
                    </CardContent>
                    <CardFooter className="flex justify-center text-sm">
                        <p className="text-muted-foreground">Already have an account? <Link href={loginUrl} className="font-semibold text-primary hover:underline">Log in</Link></p>
                    </CardFooter>
                </Card>
            </div>
        );
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
