
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { fetchTrainerWallet, requestWithdrawal } from '@/lib/server-actions';
import type { TrainerWallet, WalletTransaction, WithdrawalRequestValues } from '@/types';
import { WithdrawalRequestSchema } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    IndianRupee, WalletCards, ArrowUpCircle, History, 
    TrendingUp, Clock, Loader2, AlertCircle, 
    CreditCard, ArrowDownRight, ArrowUpRight, Banknote
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import SummaryCard from './summary-card';

export default function TrainerWalletView() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [wallet, setWallet] = useState<TrainerWallet | null>(null);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);

    const loadWalletData = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const { wallet, transactions } = await fetchTrainerWallet(user.id);
            setWallet(wallet);
            setTransactions(transactions);
        } catch (error) {
            console.error("Wallet error:", error);
            toast({ title: "Error", description: "Failed to load wallet information.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [user?.id, toast]);

    useEffect(() => {
        loadWalletData();
    }, [loadWalletData]);

    const form = useForm<WithdrawalRequestValues>({
        resolver: zodResolver(WithdrawalRequestSchema),
        defaultValues: {
            amount: 500,
            upiId: user?.upiId || '',
            bankDetails: '',
            reason: '',
        },
    });

    const onWithdrawSubmit = async (data: WithdrawalRequestValues) => {
        if (!user?.id) return;
        try {
            const result = await requestWithdrawal(user.id, data);
            if (result.success) {
                toast({ title: "Request Submitted", description: "Your withdrawal request is pending approval." });
                setIsWithdrawDialogOpen(false);
                loadWalletData();
            } else {
                toast({ title: "Request Failed", description: result.error || "Could not submit request.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
        }
    };

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
                </div>
                <Skeleton className="h-96 w-full rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
                        <WalletCards className="h-8 w-8 text-primary" />
                        Trainer Wallet
                    </h1>
                    <p className="text-muted-foreground">Manage your earnings and withdrawal requests.</p>
                </div>
                <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-lg">
                            <ArrowUpCircle className="mr-2 h-5 w-5" />
                            Withdraw Balance
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Request Withdrawal</DialogTitle>
                            <DialogDescription>
                                Minimum amount: ₹500. Balance: ₹{wallet?.balance.toLocaleString('en-IN')}
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onWithdrawSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Amount (₹)</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="upiId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>UPI ID</FormLabel>
                                            <FormControl><Input placeholder="yourname@upi" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="bankDetails"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bank Details (Optional)</FormLabel>
                                            <FormControl><Textarea placeholder="Acc No, IFSC, etc." {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                        {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : "Submit Request"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <SummaryCard 
                    title="Available Balance" 
                    value={`₹${(wallet?.balance || 0).toLocaleString('en-IN')}`} 
                    icon={IndianRupee} 
                    description="Ready to withdraw"
                    className="border-primary"
                />
                <SummaryCard 
                    title="Gross Earnings" 
                    value={`₹${(wallet?.totalEarnings || 0).toLocaleString('en-IN')}`} 
                    icon={TrendingUp} 
                    description="Lifetime total" 
                />
                <SummaryCard 
                    title="Total Withdrawn" 
                    value={`₹${(wallet?.totalWithdrawn || 0).toLocaleString('en-IN')}`} 
                    icon={CreditCard} 
                    description="Paid to your account"
                    className="border-green-500"
                />
            </div>

            <Card className="shadow-xl border-primary overflow-hidden">
                <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        Wallet Transaction History
                    </CardTitle>
                    <CardDescription>Detailed log of earnings and withdrawals.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.length > 0 ? transactions.map((tx) => (
                                    <TableRow key={tx.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {tx.type === 'Credit' ? (
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 flex items-center gap-1">
                                                        <ArrowDownRight className="h-3 w-3" /> Earning
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 flex items-center gap-1">
                                                        <ArrowUpRight className="h-3 w-3" /> Payout
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-sm">{tx.description}</p>
                                                {tx.studentName && <p className="text-xs text-muted-foreground">Student: {tx.studentName}</p>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "font-bold",
                                                tx.type === 'Credit' ? "text-green-600" : "text-blue-600"
                                            )}>
                                                {tx.type === 'Credit' ? '+' : '-'} ₹{tx.amount.toLocaleString('en-IN')}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={tx.status === 'Successful' ? 'default' : tx.status === 'Pending' ? 'secondary' : 'destructive'} className="text-[10px] uppercase font-bold tracking-wider">
                                                {tx.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-xs">
                                            {format(parseISO(tx.timestamp), 'PPp')}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                            <Banknote className="mx-auto h-12 w-12 opacity-20 mb-2" />
                                            No transactions yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/10 p-4 border-t text-xs text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Note: Credited earnings reflect the net amount after Drivergy's 20% platform commission.
                </CardFooter>
            </Card>
        </div>
    );
}
