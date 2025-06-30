'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Calendar, Lock, Car, User, QrCode, ShieldCheck } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

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

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const plan = searchParams.get('plan') || 'Selected Plan';
  const price = searchParams.get('price') || '0';

  const handleSubmit = (e: React.FormEvent, method: 'Card' | 'UPI') => {
    e.preventDefault();
    // Simulate payment processing
    toast({
      title: "Payment Successful!",
      description: `Your subscription for the ${plan} plan has been activated using ${method}.`,
    });
    // In a real app, you would redirect to a success page or dashboard.
  };

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
                    <div className="text-center mb-6 p-4 bg-muted/50 rounded-lg">
                        <p className="text-muted-foreground">Amount to Pay</p>
                        <p className="text-4xl font-bold text-foreground">₹{price}</p>
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
                                    Pay ₹{price}
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
                                    Verify & Pay ₹{price}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </main>
        <footer className="border-t border-border/40 bg-background py-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
            <div className="flex justify-center mb-4">
                <SiteLogo />
            </div>
            <p className="text-sm">
                &copy; {new Date().getFullYear()} Drivergy. All rights reserved.
            </p>
            </div>
      </footer>
    </div>
  );
}
