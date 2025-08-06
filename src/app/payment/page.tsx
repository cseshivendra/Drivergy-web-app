
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Calendar, Lock, User, QrCode, ShieldCheck, UserPlus, LogIn, Ticket } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import Loading from '@/app/loading';
import { useState, useEffect } from 'react';
import FullCustomerDetailsForm from '@/components/forms/full-customer-details-form';
import type { UserProfile } from '@/types';
import { listenToUser } from '@/lib/mock-data';

function PaymentGateway() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const plan = searchParams.get('plan') || 'Selected Plan';
  const price = searchParams.get('price') || '0';

  const [referralCode, setReferralCode] = useState('');
  const [finalPrice, setFinalPrice] = useState(price);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    if (user?.id) {
        setLoading(true);
        const unsubscribe = listenToUser(user.id, (userProfile) => {
            if (userProfile) {
                setProfile(userProfile);
                if (userProfile.pincode && userProfile.dlStatus) {
                    setShowPayment(true);
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    } else {
        setLoading(false);
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent, method: 'Card' | 'UPI') => {
    e.preventDefault();
    // Simulate payment processing
    toast({
      title: "Payment Successful!",
      description: `Your subscription for the ${plan} plan has been activated using ${method}. Redirecting to your dashboard.`,
    });
    // In a real app, you would redirect to a success page or dashboard.
    router.push('/dashboard');
  };
  
  const handleApplyCode = () => {
    // Simple mock logic for demonstration
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

  if (authLoading || loading) {
    return <Loading />;
  }

  if (!user) {
    const redirectUrl = encodeURIComponent(`/payment?plan=${plan}&price=${price}`);
    const registerUrl = `/register`;
    
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
  
  // If user is logged in, but profile is not complete, show the details form.
  if (!showPayment) {
      return (
          <Card className="w-full max-w-3xl shadow-xl">
            <CardHeader>
                <CardTitle className="font-headline text-2xl font-bold">Complete Your Profile</CardTitle>
                <CardDescription>
                    Please provide the following details to proceed with your <span className="font-semibold text-primary">{plan}</span> plan purchase.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <FullCustomerDetailsForm user={user} onFormSubmit={() => setShowPayment(true)} plan={plan} />
            </CardContent>
          </Card>
      );
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
        <CardContent>
            <div className="space-y-3 mb-6 border-b pb-6">
              <Label htmlFor="referral-code" className="flex items-center"><Ticket className="mr-2 h-4 w-4" />Referral/Discount Code (Optional)</Label>
              <div className="flex items-center space-x-2">
                  <Input
                      id="referral-code"
                      placeholder="e.g., DRIVERGY10"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      disabled={discountApplied}
                  />
                  <Button
                      type="button"
                      variant="outline"
                      onClick={handleApplyCode}
                      disabled={discountApplied || !referralCode.trim()}
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

            <Tabs defaultValue="card" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="card"><CreditCard className="mr-2 h-4 w-4" />Card</TabsTrigger>
                    <TabsTrigger value="upi"><QrCode className="mr-2 h-4 w-4" />UPI / QR Code</TabsTrigger>
                </TabsList>
                
                <TabsContent value="card" className="pt-6">
                   <form onSubmit={(e) => handleSubmit(e, 'Card')} className="space-y-6">
                        <div>
                            <Label htmlFor="cardNumber" className="flex items-center mb-1"><CreditCard className="mr-2 h-4 w-4" />Card Number</Label>
                            <Input id="cardNumber" placeholder="1234 5678 9012 3456" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="expiryDate" className="flex items-center mb-1"><Calendar className="mr-2 h-4 w-4" />Expiry Date</Label>
                                <Input id="expiryDate" placeholder="MM / YY" required />
                            </div>
                            <div>
                                <Label htmlFor="cvv" className="flex items-center mb-1"><Lock className="mr-2 h-4 w-4" />CVV</Label>
                                <Input id="cvv" placeholder="123" required />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="cardHolderName" className="flex items-center mb-1"><User className="mr-2 h-4 w-4" />Cardholder Name</Label>
                            <Input id="cardHolderName" placeholder="John Doe" required />
                        </div>
                        <Button type="submit" className="w-full h-11">
                            Pay ₹{finalPrice}
                        </Button>
                    </form>
                </TabsContent>

                <TabsContent value="upi" className="pt-6">
                    <form onSubmit={(e) => handleSubmit(e, 'UPI')} className="space-y-6">
                        <div>
                            <Label htmlFor="upiId" className="flex items-center mb-1">Enter your UPI ID</Label>
                            <Input id="upiId" placeholder="yourname@bank" required />
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <div className="flex-grow border-t border-muted"></div>
                            <span className="text-muted-foreground text-sm">OR</span>
                            <div className="flex-grow border-t border-muted"></div>
                        </div>

                        <div className="flex flex-col items-center justify-center space-y-3 p-4 border-dashed border-2 border-muted-foreground/30 rounded-lg">
                            <p className="text-sm font-medium text-muted-foreground">Scan QR Code to Pay</p>
                            <div className="p-2 bg-white rounded-md">
                                <Image 
                                    src="https://placehold.co/150x150/000000/ffffff.png"
                                    alt="UPI QR Code"
                                    width={150}
                                    height={150}
                                    data-ai-hint="qr code"
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-11">
                            Verify & Pay ₹{finalPrice}
                        </Button>
                    </form>
                </TabsContent>
            </Tabs>
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
