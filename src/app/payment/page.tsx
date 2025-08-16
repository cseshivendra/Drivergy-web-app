
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, UserPlus, LogIn, Ticket, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import Loading from '@/app/loading';
import { useState, useCallback } from 'react';

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

  // This function now simulates initiating a payment flow.
  const handleInitiatePayment = useCallback(async () => {
    if (!user) return;
    setIsProcessing(true);
  
    // ================== PHONEPE INTEGRATION POINT ==================
    // 1. In a real app, you would send a request to your own server here.
    //    e.g., const response = await fetch('/api/phonepe-payment', { 
    //            method: 'POST', 
    //            body: JSON.stringify({ plan, price: finalPrice, userId: user.id }) 
    //          });
    //    const { redirectUrl } = await response.json();
    //
    // 2. Your server would talk to PhonePe and get the redirectUrl.
    //
    // 3. You would then redirect the user:
    //    router.push(redirectUrl);
    //
    // 4. PhonePe would handle the payment and then send a webhook to your server.
    //    Your server would verify it and then redirect the user to a success page
    //    (like our complete-profile page).
    // ==============================================================

    // For this simulation, we'll mimic a successful payment and redirect.
    toast({
      title: "Proceeding to Payment",
      description: `Redirecting you to complete your purchase for the ${plan} plan.`,
    });
  
    // Simulate a short delay as if we are talking to a server
    setTimeout(() => {
        // Redirect to the final profile completion step
        router.push(`/dashboard/complete-profile?plan=${plan}`);
    }, 1500);

  }, [user, plan, finalPrice, router, toast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleInitiatePayment();
  };
  
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

  if (authLoading) {
    return <Loading />;
  }

  if (!user) {
    const redirectUrl = encodeURIComponent(`/payment?plan=${plan}&price=${price}`);
    const registerUrl = `/register?redirect=${redirectUrl}`;
    
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
            <CardTitle className="font-headline text-3xl font-bold">Secure Checkout</CardTitle>
            <CardDescription>
                You're purchasing the <span className="font-semibold text-primary">{plan}</span> plan.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-3 mb-6 border-b pb-6">
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

            <div className="text-center mb-6 p-4 bg-muted/50 rounded-lg">
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

            <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="flex flex-col items-center justify-center space-y-3 p-4 border-dashed border-2 border-muted-foreground/30 rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground">You will be redirected to our secure payment partner.</p>
                    <Image 
                        src="https://res.cloudinary.com/dssbgilba/image/upload/v1753198083/phonepe-logo-icon_d2ttc0.png"
                        alt="PhonePe Logo"
                        width={150}
                        height={40}
                        data-ai-hint="phonepe logo"
                    />
                </div>

                <Button type="submit" className="w-full h-12 text-base" disabled={isProcessing}>
                    {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : `Proceed to Pay ₹${finalPrice}`}
                </Button>
            </form>
        </CardContent>
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
