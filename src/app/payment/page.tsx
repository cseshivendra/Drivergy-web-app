'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, UserPlus, LogIn, Ticket, Loader2, SkipForward } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import Loading from '@/app/loading';
import { useState, useEffect } from 'react';

function PaymentGateway() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const plan = searchParams.get('plan') || 'Selected Plan';
  const price = searchParams.get('price') || '0';

  const [referralCode, setReferralCode] = useState('');
  const [finalPrice, setFinalPrice] = useState(price);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && user && user.subscriptionPlan && user.subscriptionPlan !== 'None') {
      toast({
        title: "Already Subscribed",
        description: "You already have an active subscription. Redirecting to your dashboard.",
      });
      router.push('/dashboard');
    }
  }, [user, authLoading, router, toast]);
  
  const handleApplyCode = () => {
    if (referralCode.trim().toUpperCase() === 'DRIVERGY10') {
      const originalPrice = parseInt(price, 10);
      if (isNaN(originalPrice) || originalPrice <= 0) return;

      const discountAmount = originalPrice * 0.10;
      setFinalPrice((originalPrice - discountAmount).toString());
      setDiscountApplied(true);
      toast({
        title: "Discount Applied!",
        description: "A 10% discount has been applied to your order."
      });
    } else {
      toast({
        title: "Invalid Code",
        description: "The referral or discount code you entered is not valid.",
        variant: "destructive"
      });
    }
  };

  const handlePhonePePayment = async () => {
    if (!user) return;
    setIsProcessing(true);

    try {
        const response = await fetch('/api/payments/phonepe/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                amount: parseInt(finalPrice, 10),
                userId: user.id,
                plan: plan,
             }),
        });

        const data = await response.json();

        if (response.ok && data.redirectUrl) {
            toast({ title: "Redirecting to Payment...", description: "Please complete your payment."});
            window.location.href = data.redirectUrl;
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
  
   const handleSkipPayment = () => {
        toast({
            title: "Payment Skipped",
            description: "Proceeding to profile completion.",
        });
        router.push(`/dashboard/complete-profile?plan=${encodeURIComponent(plan)}&price=${finalPrice}`);
    };

  if (authLoading || (user && user.subscriptionPlan && user.subscriptionPlan !== 'None')) {
    return <Loading />;
  }

  if (!user) {
    const redirectUrl = encodeURIComponent(`/payment?plan=${plan}&price=${price}`);
    const registerUrl = `/register?role=customer&plan=${plan}&price=${price}&redirect=${redirectUrl}`;
    
    return (
       <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex items-center justify-center rounded-full bg-primary/10 p-3 w-fit">
                <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-headline text-3xl font-bold">Authentication Required</CardTitle>
            <CardDescription>
                Please log in or create an account to purchase the <span className="font-semibold text-primary">{plan}</span> plan.
            </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-4 pt-6">
           <Button asChild size="lg" className="w-full">
              <Link href={`/login?redirect=${redirectUrl}`}>
                  <LogIn className="mr-2 h-5 w-5" />
                  Login to Continue
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full">
              <Link href={registerUrl}>
                  <UserPlus className="mr-2 h-5 w-5" />
                  Create New Account
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground pt-4">Creating an account is quick and easy!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex items-center justify-center rounded-full bg-primary/10 p-3 w-fit">
                <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-headline text-3xl font-bold">Secure Payment</CardTitle>
            <CardDescription>
                Complete your purchase for the <span className="font-semibold text-primary">{plan}</span> plan.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-3 border-b pb-6">
              <Label htmlFor="referral-code" className="flex items-center"><Ticket className="mr-2 h-4 w-4" />Referral/Discount Code (Optional)</Label>
              <div className="flex items-center space-x-2">
                  <Input
                      id="referral-code"
                      placeholder="e.g., DRIVERGY10"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      disabled={discountApplied || isProcessing}
                  />
                  <Button
                      type="button"
                      variant="outline"
                      onClick={handleApplyCode}
                      disabled={discountApplied || !referralCode.trim() || isProcessing}
                  >
                      {discountApplied ? "Applied" : "Apply"}
                  </Button>
              </div>
            </div>

            <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">Amount to Pay</p>
                {discountApplied && (
                    <p className="text-sm text-muted-foreground line-through">
                        Original Price: ₹{price}
                    </p>
                )}
                <p className="text-4xl font-bold text-foreground">₹{finalPrice}</p>
                {discountApplied && (
                    <p className="text-sm font-semibold text-green-600 mt-1">
                        You saved ₹{parseInt(price, 10) - parseInt(finalPrice, 10)}!
                    </p>
                )}
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
                 <Button onClick={handlePhonePePayment} className="w-full h-12 text-lg" disabled={isProcessing}>
                    {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : `Pay ₹${finalPrice} with PhonePe`}
                </Button>
                 <Button onClick={handleSkipPayment} variant="outline" className="w-full sm:w-auto" disabled={isProcessing}>
                    <SkipForward className="mr-2 h-4 w-4" /> Skip for now
                </Button>
            </div>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground text-center w-full">You will be redirected to PhonePe to complete your payment securely.</p>
        </CardFooter>
    </Card>
  )
}

export default function PaymentPage() {
  return (
    <div className="flex items-center justify-center p-4 min-h-[calc(100vh-10rem)]">
        <PaymentGateway />
    </div>
  );
}

    