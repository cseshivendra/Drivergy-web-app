
'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchAllWithdrawals, updateWithdrawalStatus } from '@/lib/server-actions';
import type { WithdrawalRequest } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    Banknote, Check, X, Clock, ExternalLink, 
    AlertCircle, RefreshCw, User, IndianRupee, CreditCard
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function WithdrawalManagement() {
    const { toast } = useToast();
    const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchAllWithdrawals();
            setRequests(data);
        } catch (error) {
            toast({ title: "Load Error", description: "Failed to fetch withdrawal requests.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleAction = async (requestId: string, status: WithdrawalRequest['status']) => {
        setIsProcessing(requestId);
        const success = await updateWithdrawalStatus(requestId, status);
        if (success) {
            toast({ title: `Request ${status}`, description: `Withdrawal has been ${status.toLowerCase()}.` });
            loadData();
        } else {
            toast({ title: "Action Failed", description: "Could not update request status.", variant: "destructive" });
        }
        setIsProcessing(null);
    };

    const getStatusBadge = (status: WithdrawalRequest['status']) => {
        switch (status) {
            case 'Pending': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Pending</Badge>;
            case 'Approved': return <Badge className="bg-blue-100 text-blue-700">Approved</Badge>;
            case 'Completed': return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
            case 'Rejected': return <Badge variant="destructive">Rejected</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <Card className="shadow-lg border-primary">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        <Banknote className="h-6 w-6 text-primary" />
                        Withdrawal Requests
                    </CardTitle>
                    <CardDescription>Review and process trainer payout requests.</CardDescription>
                </div>
                <Button variant="outline" size="icon" onClick={loadData} disabled={loading}>
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><User className="mr-2 h-4 w-4 inline" />Trainer</TableHead>
                                <TableHead><IndianRupee className="mr-2 h-4 w-4 inline" />Amount</TableHead>
                                <TableHead><CreditCard className="mr-2 h-4 w-4 inline" />UPI ID</TableHead>
                                <TableHead><Clock className="mr-2 h-4 w-4 inline" />Requested At</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                                ))
                            ) : requests.length > 0 ? requests.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">{req.trainerName}</TableCell>
                                    <TableCell className="font-bold">₹{req.amount.toLocaleString('en-IN')}</TableCell>
                                    <TableCell className="font-mono text-xs">{req.upiId}</TableCell>
                                    <TableCell className="text-muted-foreground text-xs">{format(parseISO(req.requestDate), 'PPp')}</TableCell>
                                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                                    <TableCell className="text-right">
                                        {req.status === 'Pending' ? (
                                            <div className="flex justify-end gap-2">
                                                <Button 
                                                    size="sm" 
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => handleAction(req.id, 'Approved')}
                                                    disabled={isProcessing === req.id}
                                                >
                                                    <Check className="h-4 w-4 mr-1" /> Approve
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="destructive"
                                                    onClick={() => handleAction(req.id, 'Rejected')}
                                                    disabled={isProcessing === req.id}
                                                >
                                                    <X className="h-4 w-4 mr-1" /> Reject
                                                </Button>
                                            </div>
                                        ) : req.status === 'Approved' ? (
                                            <Button 
                                                size="sm" 
                                                className="bg-blue-600"
                                                onClick={() => handleAction(req.id, 'Completed')}
                                                disabled={isProcessing === req.id}
                                            >
                                                Mark Paid
                                            </Button>
                                        ) : (
                                            <span className="text-xs italic text-muted-foreground">Processed</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground opacity-30 mb-2" />
                                        No pending withdrawal requests.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
