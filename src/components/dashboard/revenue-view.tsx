'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    IndianRupee, TrendingUp, History, WalletCards, FileText, UserCheck, 
    Search, RefreshCw, Download, BarChart3, AlertCircle, Printer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchRevenueDashboardData, updatePayoutStatus } from '@/lib/server-actions';
import type { RevenueDashboardData, RevenueTransaction, TrainerPayout } from '@/types';
import SummaryCard from '@/components/dashboard/summary-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
    Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend,
    Line, LineChart as RechartsLineChart
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import WithdrawalManagement from './withdrawal-management';

interface RevenueViewProps {
    activeTab: string;
}

export default function RevenueView({ activeTab }: RevenueViewProps) {
    const { toast } = useToast();
    const [data, setData] = useState<RevenueDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    const loadData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setIsRefreshing(true);

        try {
            const result = await fetchRevenueDashboardData();
            if (result) {
                setData(result);
            } else {
                toast({ title: "Load Failed", description: "Could not retrieve revenue data.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredTransactions = useMemo(() => {
        if (!data?.transactions) return [];
        const term = searchTerm.toLowerCase();
        return data.transactions.filter(tx => 
            tx.studentName.toLowerCase().includes(term) || 
            tx.trainerName?.toLowerCase().includes(term) ||
            tx.planName.toLowerCase().includes(term) ||
            tx.orderId.toLowerCase().includes(term)
        );
    }, [data?.transactions, searchTerm]);

    const handlePayout = async (payout: TrainerPayout) => {
        if (payout.pendingAmount <= 0) return;
        const success = await updatePayoutStatus(payout.trainerId, payout.pendingAmount);
        if (success) {
            toast({ title: "Payout Successful", description: `Earnings for ${payout.trainerName} marked as paid.` });
            loadData(true);
        } else {
            toast({ title: "Payout Failed", description: "Could not update payout status.", variant: "destructive" });
        }
    };

    const exportToPDF = () => {
        if (!data) return;
        setIsExporting(true);
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.setTextColor(239, 68, 68);
        doc.text('DRIVERGY REVENUE REPORT', 105, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${format(new Date(), 'PPp')}`, 105, 28, { align: 'center' });

        autoTable(doc, {
            startY: 40,
            head: [['Date', 'Student', 'Trainer', 'Plan', 'Amount', 'Comm. (20%)', 'Trainer (80%)']],
            body: data.transactions.map(tx => [
                format(parseISO(tx.timestamp), 'dd MMM yy'),
                tx.studentName,
                tx.trainerName || 'N/A',
                tx.planName,
                `INR ${tx.amount}`,
                `INR ${tx.commission.toFixed(2)}`,
                `INR ${tx.trainerShare.toFixed(2)}`
            ]),
            theme: 'striped',
            headStyles: { fillColor: [239, 68, 68] }
        });

        doc.save(`Drivergy_Revenue_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        setIsExporting(false);
        toast({ title: "Export Complete", description: "PDF report downloaded successfully." });
    };

    const renderSummary = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <SummaryCard title="Total Revenue" value={`₹${data?.summary.totalRevenue.toLocaleString('en-IN')}`} icon={IndianRupee} description="All-time gross" />
            <SummaryCard title="Drivergy Comm." value={`₹${data?.summary.totalCommission.toLocaleString('en-IN')}`} icon={TrendingUp} description="Total 20% share" />
            <SummaryCard title="Trainer Shares" value={`₹${data?.summary.totalTrainerEarnings.toLocaleString('en-IN')}`} icon={WalletCards} description="Total 80% share" />
            <SummaryCard title="Pending Payouts" value={`₹${data?.summary.pendingPayouts.toLocaleString('en-IN')}`} icon={History} description="Unpaid to trainers" />
            <SummaryCard title="Monthly Rev." value={`₹${data?.summary.monthlyRevenue.toLocaleString('en-IN')}`} icon={BarChart3} description="Current month total" />
        </div>
    );

    const renderTransactions = () => (
        <Card className="shadow-lg border-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        Subscription Transactions
                    </CardTitle>
                    <CardDescription>Real-time log of all successful payments.</CardDescription>
                </div>
                <div className="flex gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search student or trainer..." 
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={() => loadData(true)} disabled={isRefreshing}>
                        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>Trainer</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? Array(5).fill(0).map((_, i) => (
                            <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                        )) : filteredTransactions.length > 0 ? filteredTransactions.map((tx) => (
                            <TableRow key={tx.id}>
                                <TableCell className="font-mono text-xs">{tx.orderId.slice(0, 12)}...</TableCell>
                                <TableCell className="font-medium">{tx.studentName}</TableCell>
                                <TableCell>{tx.trainerName}</TableCell>
                                <TableCell><Badge variant="outline">{tx.planName}</Badge></TableCell>
                                <TableCell className="font-bold">₹{tx.amount.toLocaleString('en-IN')}</TableCell>
                                <TableCell><Badge className="bg-green-100 text-green-700 hover:bg-green-100">Success</Badge></TableCell>
                                <TableCell className="text-muted-foreground">{format(parseISO(tx.timestamp), 'PP')}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">No transactions found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );

    const renderCommission = () => (
        <Card className="shadow-lg border-primary">
            <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Commission Breakdown (20/80 Rule)
                </CardTitle>
                <CardDescription>Fixed 20% Drivergy share and 80% Trainer share per subscription.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Plan Price</TableHead>
                            <TableHead>Drivergy Share (20%)</TableHead>
                            <TableHead>Trainer Share (80%)</TableHead>
                            <TableHead>Total Share</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[3999, 7499, 9999].map(price => (
                            <TableRow key={price}>
                                <TableCell className="text-lg font-bold">₹{price.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-primary font-semibold">₹{(price * 0.2).toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-green-600 font-semibold">₹{(price * 0.8).toLocaleString('en-IN')}</TableCell>
                                <TableCell className="font-mono">100%</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                
                <div className="mt-8 h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data?.monthlyGrowth || []}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" />
                            <YAxis tickFormatter={(val) => `₹${val/1000}k`} />
                            <Tooltip formatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`} />
                            <Legend />
                            <Bar dataKey="revenue" name="Total Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="commission" name="Drivergy Commission" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );

    const renderPayouts = () => (
        <Card className="shadow-lg border-primary">
            <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary" />
                    Trainer Payout Management
                </CardTitle>
                <CardDescription>Track and process earnings for all verified instructors.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Trainer</TableHead>
                            <TableHead>Total Earnings</TableHead>
                            <TableHead>Paid</TableHead>
                            <TableHead>Pending</TableHead>
                            <TableHead>UPI ID</TableHead>
                            <TableHead>Last Payout</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data?.payouts.map((p) => (
                            <TableRow key={p.trainerId}>
                                <TableCell className="font-medium">{p.trainerName}</TableCell>
                                <TableCell>₹{p.totalEarnings.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-green-600">₹{p.paidAmount.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-primary font-bold">₹{p.pendingAmount.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="font-mono text-xs">{p.upiId}</TableCell>
                                <TableCell className="text-muted-foreground">{p.lastPayoutDate ? format(parseISO(p.lastPayoutDate), 'PP') : 'Never'}</TableCell>
                                <TableCell className="text-right">
                                    <Button 
                                        size="sm" 
                                        disabled={p.pendingAmount <= 0} 
                                        onClick={() => handlePayout(p)}
                                        className={p.pendingAmount > 0 ? "bg-green-600 hover:bg-green-700" : ""}
                                    >
                                        {p.pendingAmount > 0 ? "Mark as Paid" : "Paid Up"}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );

    const renderReports = () => (
        <div className="space-y-6">
            <Card className="shadow-lg border-primary">
                <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Revenue & Growth Reports
                    </CardTitle>
                    <CardDescription>Analyze platform growth and monthly revenue trends.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Download Center</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Button className="flex items-center gap-2" onClick={exportToPDF} disabled={isExporting}>
                                <Printer className="h-4 w-4" />
                                Export Monthly (PDF)
                            </Button>
                            <Button variant="outline" className="flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                Export Yearly (Excel)
                            </Button>
                        </div>
                        <Alert className="bg-blue-50 border-blue-200">
                            <AlertCircle className="h-4 w-4 text-blue-600" />
                            <AlertTitle className="text-blue-800">Growth Insight</AlertTitle>
                            <AlertDescription className="text-blue-700">
                                This month's revenue is up compared to last month.
                            </AlertDescription>
                        </Alert>
                    </div>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsLineChart data={data?.monthlyGrowth || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" />
                                <YAxis hide />
                                <Tooltip formatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`} />
                                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                            </RechartsLineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <div className="space-y-8">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="font-headline text-2xl font-semibold tracking-tight text-foreground">
                        Financial Oversight
                    </h1>
                    <p className="text-muted-foreground text-sm">Comprehensive platform revenue tracking.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="bg-background" onClick={() => loadData(true)}>
                        <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90" onClick={exportToPDF}>
                        <Download className="mr-2 h-4 w-4" />
                        Report
                    </Button>
                </div>
            </header>

            {activeTab !== 'withdrawals' && renderSummary()}

            <div className="space-y-8">
                {activeTab === 'transactions' && renderTransactions()}
                {activeTab === 'commission' && renderCommission()}
                {activeTab === 'payouts' && renderPayouts()}
                {activeTab === 'reports' && renderReports()}
                {activeTab === 'withdrawals' && <WithdrawalManagement />}
                {activeTab === 'earnings' && (
                    <Card className="shadow-lg border-primary">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold">Trainer Student-wise Earnings</CardTitle>
                            <CardDescription>Detailed breakdown of which student generated what earnings for each trainer.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Trainer</TableHead>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Paid Amount</TableHead>
                                        <TableHead>Trainer (80%)</TableHead>
                                        <TableHead>Comm. (20%)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.transactions.filter(tx => tx.trainerId).map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell className="font-medium">{tx.trainerName}</TableCell>
                                            <TableCell>{tx.studentName}</TableCell>
                                            <TableCell><Badge variant="outline">{tx.planName}</Badge></TableCell>
                                            <TableCell>₹{tx.amount.toLocaleString('en-IN')}</TableCell>
                                            <TableCell className="text-green-600">₹{tx.trainerShare.toLocaleString('en-IN')}</TableCell>
                                            <TableCell className="text-primary">₹{tx.commission.toLocaleString('en-IN')}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
