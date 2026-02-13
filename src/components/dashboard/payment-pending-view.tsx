'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CreditCard, IndianRupee, WalletCards, Loader2, ArrowRight, RefreshCw, XCircle, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cancelOrder } from '@/lib/server-actions';

interface PaymentPendingViewProps {
    order: any;
    onRefresh: () => void;
}

export default function PaymentPendingView({ order, onRefresh }: PaymentPendingViewProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleRetry = () => {
        const url = `/payment?plan=${encodeURIComponent(order.plan)}&price=${order.originalAmount}`;
        router.push(url);
    };

    const handleChooseAnother = async () => {
        setIsLoading(true);
        try {
            await cancelOrder(order.orderId);
            router.push('/#subscriptions');
        } catch (error) {
            toast({ title: "Error", description: "Could not cancel plan. Please try again.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto max-w-4xl p-4 py-8 sm:p-6 lg:p-8 flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="w-full space-y-6">
                <Alert className="bg-yellow-50 border-yellow-200 animate-pulse">
                    <CreditCard className="h-4 w-4 text-yellow-600" />
                    <AlertTitle className="text-yellow-800 font-bold">Action Required: Payment Pending</AlertTitle>
                    <AlertDescription className="text-yellow-700">
                        Your enrollment is nearly complete. Please finish your payment to activate your training dashboard.
                    </AlertDescription>
                </Alert>

                <Card className="shadow-xl border-t-4 border-yellow-500">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto mb-4 flex items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 p-4 w-fit">
                            <RefreshCw className="h-10 w-10 text-yellow-600" />
                        </div>
                        <CardTitle className="font-headline text-2xl font-bold">Unfinished Purchase</CardTitle>
                        <CardDescription>We found an incomplete payment for your selected driving course.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4">
                        <div className="bg-muted/50 p-6 rounded-xl border space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b">
                                <span className="text-muted-foreground font-medium">Selected Plan:</span>
                                <span className="font-bold text-lg text-primary">{order.plan}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Original Price:</span>
                                <span className="font-semibold">₹{order.originalAmount?.toLocaleString('en-IN')}</span>
                            </div>
                            {order.walletUsed > 0 && (
                                <div className="flex justify-between items-center text-sm text-green-600 font-semibold">
                                    <span className="flex items-center gap-1.5"><WalletCards className="h-4 w-4" /> Wallet Discount:</span>
                                    <span>- ₹{order.walletUsed?.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-2 border-t text-xl font-extrabold text-foreground">
                                <span>Total Payable:</span>
                                <span className="flex items-center"><IndianRupee className="h-5 w-5" /> {order.amount?.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Button size="lg" className="w-full bg-[#6739B7] hover:bg-[#562E9C]" onClick={handleRetry} disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin" /> : <><CreditCard className="mr-2 h-5 w-5" /> Complete Payment</>}
                            </Button>
                            <Button size="lg" variant="outline" className="w-full" onClick={handleChooseAnother} disabled={isLoading}>
                                <RefreshCw className="mr-2 h-5 w-5" /> Choose Another Plan
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 border-t pt-6">
                        <div className="flex items-center text-xs text-muted-foreground justify-center gap-4">
                            <div className="flex items-center"><ShieldCheck className="h-3.5 w-3.5 mr-1 text-green-500" /> Secure Checkout</div>
                            <div className="flex items-center"><RefreshCw className="h-3.5 w-3.5 mr-1 text-blue-500" /> 24/7 Support</div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => onRefresh()}>
                            I have already paid, refresh status
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}