'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { fetchReferralsByUserId } from '@/lib/mock-data';
import type { Referral } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Gift, AlertCircle, User, Star, Calendar, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const getStatusColor = (status: Referral['status']) => {
    return status === 'Successful'
        ? 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300'
        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300';
};

const getPayoutStatusColor = (status: Referral['payoutStatus']) => {
    switch (status) {
        case 'Pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300';
        case 'Paid': return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300';
        case 'Withdraw to UPI': return 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300';
        default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300';
    }
};

export default function TrackReferralsPage() {
    const { user } = useAuth();
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [loading, setLoading] = useState(true);

    const loadReferrals = useCallback(async () => {
        if (!user?.uid) { // Check for user.uid instead of just user
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const referralData = await fetchReferralsByUserId(user.uid);
            setReferrals(referralData);
        } catch (error) {
            console.error("Error loading referral data:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadReferrals();
    }, [loadReferrals]);

    const totalPoints = referrals.reduce((sum, ref) => sum + (ref.status === 'Successful' ? ref.pointsEarned : 0), 0);

    const renderSkeletons = () => (
        Array(3).fill(0).map((_, i) => (
            <TableRow key={`skeleton-${i}`}>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
            </TableRow>
        ))
    );

    return (
        <div className="container mx-auto max-w-4xl p-4 py-8 sm:p-6 lg:p-8">
            <Card className="shadow-xl overflow-hidden">
                <div className="relative h-56 w-full bg-primary/10">
                    <Image
                        src="https://placehold.co/800x300/10b981/ffffff.png"
                        alt="Track referrals banner"
                        layout="fill"
                        objectFit="cover"
                        data-ai-hint="dashboard chart growth"
                    />
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center p-4">
                        <div className="p-3 bg-background/80 rounded-full mb-3 backdrop-blur-sm">
                            <BarChart3 className="h-10 w-10 text-primary" />
                        </div>
                        <h1 className="font-headline text-4xl font-bold text-white drop-shadow-md">Track Your Referrals</h1>
                        <p className="mt-2 text-lg text-white/90 max-w-xl mx-auto drop-shadow-sm">
                            See the status of your invites and the points you've earned.
                        </p>
                    </div>
                </div>
                <CardHeader className="flex-row items-center justify-between border-b bg-muted/50 p-4">
                    <CardTitle className="text-xl">My Referral History</CardTitle>
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total Points Earned</p>
                        <p className="text-2xl font-bold text-primary">{totalPoints}</p>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead><User className="inline-block mr-2 h-4 w-4" />Referred Friend</TableHead>
                                    <TableHead><Calendar className="inline-block mr-2 h-4 w-4" />Date</TableHead>
                                    <TableHead><CheckCircle className="inline-block mr-2 h-4 w-4" />Referral Status</TableHead>
                                    <TableHead><Gift className="inline-block mr-2 h-4 w-4" />Payout Status</TableHead>
                                    <TableHead className="text-right"><Star className="inline-block mr-2 h-4 w-4" />Points Earned</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? renderSkeletons() : referrals.length > 0 ? (
                                    referrals.map((ref) => (
                                        <TableRow key={ref.id}>
                                            <TableCell className="font-medium">{ref.refereeName}</TableCell>
                                            <TableCell>{new Date(ref.timestamp).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Badge className={cn(getStatusColor(ref.status))}>
                                                    {ref.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn(getPayoutStatusColor(ref.payoutStatus))}>
                                                    {ref.payoutStatus}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-primary">
                                                {ref.status === 'Successful' ? ref.pointsEarned : 0}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center">
                                            <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                            You haven't referred anyone yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/50 p-4 border-t">
                    <p className="text-xs text-muted-foreground">
                        Points are awarded after your friend successfully subscribes and their account is approved.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
