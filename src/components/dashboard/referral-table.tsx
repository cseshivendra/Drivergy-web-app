
'use client';

import type { ReactNode } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Referral, PayoutStatusType, ApprovalStatusType } from '@/types';
import { PayoutStatusOptions } from '@/types';
import { User, Gift, Star, DollarSign, Calendar, AlertCircle, Settings2, Check, Fingerprint, IndianRupee, Users, BarChart3, ChevronRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { updateReferralPayoutStatus } from '@/lib/server-actions';
import { format, parseISO } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';


interface ReferralTableProps {
  title: ReactNode;
  referrals: Referral[];
  isLoading: boolean;
  onActioned: () => void;
}

const getPayoutStatusColor = (status: PayoutStatusType) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300';
      case 'Paid': return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300';
      case 'Withdraw to UPI': return 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300';
    }
};

const getRefereeStatusColor = (status?: ApprovalStatusType) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300 border-yellow-200';
      case 'Approved': return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300 border-green-200';
      case 'In Progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300 border-blue-200';
      case 'Rejected': return 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300 border-red-200';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300 border-gray-200';
    }
};

const getPlanPrice = (plan?: string): number => {
    if (!plan) return 0;
    switch (plan) {
        case 'Premium': return 9999;
        case 'Gold': return 7499;
        case 'Basic': return 3999;
        default: return 0;
    }
};

// Sub-component for displaying the details of a selected referrer's referees
const RefereeDetailsTable = ({ 
    referrals, 
    isLoading, 
    onActioned,
    selectedReferrerName 
}: { 
    referrals: Referral[]; 
    isLoading: boolean;
    onActioned: () => void;
    selectedReferrerName: string | null;
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const { toast } = useToast();
    const ITEMS_PER_PAGE = 5;

    useEffect(() => {
        setCurrentPage(1);
    }, [referrals]);

    const totalPages = Math.ceil(referrals.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedReferees = referrals.slice(startIndex, endIndex);

    const handlePreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
    const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  
    const handleUpdateStatus = async (referralId: string, newStatus: PayoutStatusType) => {
        const success = await updateReferralPayoutStatus(referralId, newStatus);
        if (success) {
            toast({
                title: "Status Updated",
                description: `Referral payout status has been set to ${newStatus}.`,
            });
            onActioned();
        } else {
            toast({
                title: "Update Failed",
                description: "Could not update referral status.",
                variant: "destructive",
            });
        }
    };

    if (!selectedReferrerName) {
        return (
            <Card className="shadow-lg flex flex-col h-full border-dashed">
                <CardHeader>
                    <CardTitle>Referral Details</CardTitle>
                    <CardDescription>Select a referrer to see their details.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                        <Users className="mx-auto h-12 w-12 opacity-30" />
                        <p className="mt-4">Select a user from the left panel.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const renderSkeletons = () => (
        Array(ITEMS_PER_PAGE).fill(0).map((_, index) => (
          <TableRow key={`skeleton-referee-${index}`}>
            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
            <TableCell><Skeleton className="h-9 w-24" /></TableCell>
          </TableRow>
        ))
    );

    return (
        <Card className="shadow-lg flex flex-col h-full">
            <CardHeader>
                <CardTitle>Referrals by {selectedReferrerName}</CardTitle>
                <CardDescription>Details of customers referred by {selectedReferrerName}.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><User className="inline-block mr-2 h-4 w-4" />New Customer</TableHead>
                                <TableHead><ShieldCheck className="inline-block mr-2 h-4 w-4" />Referee Status</TableHead>
                                <TableHead><IndianRupee className="inline-block mr-2 h-4 w-4" />Sub. Amount</TableHead>
                                <TableHead><Star className="inline-block mr-2 h-4 w-4" />Points</TableHead>
                                <TableHead><DollarSign className="inline-block mr-2 h-4 w-4" />Payout Status</TableHead>
                                <TableHead className="text-center"><Settings2 className="inline-block mr-2 h-4 w-4" />Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? renderSkeletons() : paginatedReferees.length > 0 ? (
                                paginatedReferees.map((ref) => (
                                    <TableRow key={ref.id}>
                                        <TableCell>
                                            <div className="font-medium">{ref.refereeName}</div>
                                            <div className="text-xs text-muted-foreground">{ref.refereeUniqueId}</div>
                                        </TableCell>
                                        <TableCell>
                                          {ref.refereeApprovalStatus ? (
                                            <Badge variant="outline" className={cn(getRefereeStatusColor(ref.refereeApprovalStatus))}>
                                              {ref.refereeApprovalStatus}
                                            </Badge>
                                          ) : (
                                            <Badge variant="outline">Unknown</Badge>
                                          )}
                                        </TableCell>
                                        <TableCell>₹{getPlanPrice(ref.refereeSubscriptionPlan).toLocaleString('en-IN')}</TableCell>
                                        <TableCell className="font-semibold text-primary">{ref.pointsEarned}</TableCell>
                                        <TableCell><Badge className={getPayoutStatusColor(ref.payoutStatus)}>{ref.payoutStatus}</Badge></TableCell>
                                        <TableCell className="text-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" size="sm" disabled={ref.payoutStatus !== 'Pending'}>
                                                        {ref.payoutStatus === 'Pending' ? 'Update' : ref.payoutStatus}
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    {PayoutStatusOptions.map(status => (
                                                        <DropdownMenuItem key={status} onClick={() => handleUpdateStatus(ref.id, status)} disabled={ref.payoutStatus === status}>
                                                            <Check className={`mr-2 h-4 w-4 ${ref.payoutStatus === status ? 'opacity-100' : 'opacity-0'}`} />
                                                            Mark as {status}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={6} className="h-24 text-center">No referral details found for this user.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            {referrals.length > 0 && !isLoading && (
                 <CardFooter className="flex items-center justify-between pt-4 border-t">
                    <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
                    <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>Previous</Button>
                        <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>Next</Button>
                    </div>
                </CardFooter>
            )}
        </Card>
    );
};

// Main component that orchestrates the two tables
export default function ReferralTable({ title, referrals, isLoading, onActioned }: ReferralTableProps) {
    const [selectedReferrer, setSelectedReferrer] = useState<{ id: string; name: string } | null>(null);

    const referrersSummary = useMemo(() => {
        if (!referrals) return [];
        const summary = new Map<string, { name: string; count: number; totalPoints: number }>();
        referrals.forEach(ref => {
            const existing = summary.get(ref.referrerId) || { name: ref.referrerName, count: 0, totalPoints: 0 };
            existing.count += 1;
            existing.totalPoints += ref.pointsEarned;
            summary.set(ref.referrerId, existing);
        });
        return Array.from(summary.entries()).map(([referrerId, data]) => ({
            referrerId,
            ...data,
        })).sort((a, b) => b.totalPoints - a.totalPoints);
    }, [referrals]);

    const filteredReferees = useMemo(() => {
        if (!selectedReferrer) return [];
        return referrals.filter(r => r.referrerId === selectedReferrer.id);
    }, [referrals, selectedReferrer]);

    const renderReferrerSkeletons = () => (
        Array(5).fill(0).map((_, index) => (
            <TableRow key={`referrer-skeleton-${index}`}>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
            </TableRow>
        ))
    );

    return (
        <Card className="shadow-lg border border-primary transition-shadow duration-300 flex flex-col pb-10">
            <CardHeader>
                <CardTitle className="font-headline text-2xl font-semibold">{title}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Referrers Table */}
                <div className="md:col-span-1">
                    <h3 className="text-lg font-semibold mb-2 flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/>Referrer Summary</h3>
                    <Card className="h-full max-h-[520px] flex flex-col">
                        <div className="overflow-y-auto flex-grow">
                            <Table>
                                <TableHeader className="sticky top-0 bg-card z-10">
                                    <TableRow>
                                        <TableHead>Referred By</TableHead>
                                        <TableHead>Count</TableHead>
                                        <TableHead>Total Points</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? renderReferrerSkeletons() : referrersSummary.length > 0 ? (
                                        referrersSummary.map(summary => (
                                            <TableRow 
                                                key={summary.referrerId} 
                                                className={cn(
                                                    "cursor-pointer",
                                                    selectedReferrer?.id === summary.referrerId && "bg-muted hover:bg-muted"
                                                )}
                                                onClick={() => setSelectedReferrer({id: summary.referrerId, name: summary.name})}
                                            >
                                                <TableCell className="font-medium">{summary.name}</TableCell>
                                                <TableCell>{summary.count}</TableCell>
                                                <TableCell className="font-semibold text-primary">{summary.totalPoints}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                                No referrers found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </div>

                {/* Referees Table */}
                <div className="md:col-span-1">
                    <h3 className="text-lg font-semibold mb-2 flex items-center"><BarChart3 className="mr-2 h-5 w-5 text-primary"/>Referral Details</h3>
                    <RefereeDetailsTable 
                        referrals={filteredReferees} 
                        isLoading={isLoading && !!selectedReferrer} 
                        onActioned={onActioned}
                        selectedReferrerName={selectedReferrer?.name || null}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
