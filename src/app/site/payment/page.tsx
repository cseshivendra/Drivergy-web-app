
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Calendar, Lock, Car, User, QrCode, ShieldCheck, UserPlus, LogIn, Ticket, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import Loading from '@/app/loading';
import { useState } from 'react';

// Replicated SiteLogo for this page
const SiteLogo = () => (
    <Link href="/site" className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-ring rounded-md">
      <div className="p-1.5 bg-primary/10 rounded-lg transition-all duration-300">
        <Car className="h-7 w-7 text-primary shrink-0" />
      </div>
      <span className="font-headline text-2xl font-extrabold text-primary tracking-tighter">
        Drivergy
      </span>
    </Link>
  );

function PaymentGateway() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  
  const plan = searchParams.get('plan') || 'Selected Plan';
  const price = searchParams.get('price') || '0';

  const [referralCode, setReferralCode] = useState('');
  const [finalPrice, setFinalPrice] = useState(price);
  const [discountApplied, setDiscountApplied] = useState(false);

  const handleSubmit = (e: React.FormEvent, method: 'Card' | 'UPI') => {
    e.preventDefault();
    // Simulate payment processing
    toast({
      title: "Payment Successful!",
      description: `Your subscription for the ${plan} plan has been activated using ${method}. Redirecting to your dashboard.`,
    });
    // In a real app, you would redirect to a success page or dashboard.
    router.push('/');
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

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    const redirectUrl = encodeURIComponent(`/site/payment?plan=${plan}&price=${price}`);
    const registerUrl = `/site/register/customer?plan=${encodeURIComponent(plan)}&price=${price}`;
    
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
                                    src="https://placehold.co/150x150.png"
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
     <div className="flex flex-col min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8">
            <SiteLogo />
            <Button variant="outline" asChild>
                <Link href="/site">Back to Site</Link>
            </Button>
            </div>
        </header>
        <main className="flex-grow flex items-center justify-center p-4">
            <PaymentGateway />
        </main>
        <footer className="border-t border-border/40 bg-background py-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground space-y-4">
                <div className="flex justify-center mb-4">
                    <SiteLogo />
                </div>
                 <div className="flex justify-center items-center gap-6">
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Facebook className="h-5 w-5" />
                        <span className="sr-only">Facebook</span>
                    </a>
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Twitter className="h-5 w-5" />
                        <span className="sr-only">Twitter</span>
                    </a>
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Instagram className="h-5 w-5" />
                        <span className="sr-only">Instagram</span>
                    </a>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Linkedin className="h-5 w-5" />
                        <span className="sr-only">LinkedIn</span>
                    </a>
                </div>
                <div className="flex items-center justify-center gap-x-8 pt-4">
                    <Image src="https://placehold.co/120x40.png" alt="Startup India Logo" width={120} height={40} data-ai-hint="startup india logo" />
                    <Image src="https://placehold.co/120x40.png" alt="Made in India Logo" width={120} height={40} data-ai-hint="made in india logo" />
                </div>
                <p className="text-sm pt-2">
                    &copy; {new Date().getFullYear()} Drivergy. All rights reserved.
                </p>
            </div>
      </footer>
    </div>
  );
}
