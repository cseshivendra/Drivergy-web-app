
'use client';

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Referral, PayoutStatusType } from '@/types';
import { PayoutStatusOptions } from '@/types';
import { User, Gift, Star, DollarSign, Calendar, AlertCircle, Settings2, Check, Fingerprint, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { updateReferralPayoutStatus } from '@/lib/mock-data';
import { format, parseISO } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '../ui/badge';

interface ReferralTableProps {
  title: ReactNode;
  referrals: Referral[];
  isLoading: boolean;
  onActioned: () => void;
}

const ITEMS_PER_PAGE = 10;

export default function ReferralTable({ title, referrals, isLoading, onActioned }: ReferralTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentPage(1);
  }, [referrals]);

  const totalPages = Math.ceil(referrals.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedReferrals = referrals.slice(startIndex, endIndex);

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

  const getStatusColor = (status: PayoutStatusType) => {
    switch (status) {
      case 'Pending': 
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300';
      case 'Paid': 
        return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300';
      case 'Withdraw to UPI':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300';
      default: 
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300';
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


  const renderSkeletons = () => (
    Array(ITEMS_PER_PAGE).fill(0).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell><Skeleton className="h-9 w-24" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <Card className="shadow-lg border border-primary transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline text-2xl font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Gift className="inline-block mr-2 h-4 w-4" />Referrer</TableHead>
                <TableHead><User className="inline-block mr-2 h-4 w-4" />Referee</TableHead>
                <TableHead><Fingerprint className="inline-block mr-2 h-4 w-4" />Referee ID</TableHead>
                <TableHead><IndianRupee className="inline-block mr-2 h-4 w-4" />Sub. Amount</TableHead>
                <TableHead><Star className="inline-block mr-2 h-4 w-4" />Points Earned</TableHead>
                <TableHead><DollarSign className="inline-block mr-2 h-4 w-4" />Payout Status</TableHead>
                <TableHead><Calendar className="inline-block mr-2 h-4 w-4" />Date</TableHead>
                <TableHead className="text-center"><Settings2 className="inline-block mr-2 h-4 w-4" />Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? renderSkeletons() : paginatedReferrals.length > 0 ? (
                paginatedReferrals.map((ref) => (
                  <TableRow key={ref.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{ref.referrerName}</TableCell>
                    <TableCell>{ref.refereeName}</TableCell>
                    <TableCell>{ref.refereeUniqueId || 'N/A'}</TableCell>
                    <TableCell>₹{getPlanPrice(ref.refereeSubscriptionPlan).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="font-semibold text-primary">{ref.pointsEarned}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(ref.payoutStatus)}>
                        {ref.payoutStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(parseISO(ref.timestamp), 'dd MMM, yyyy')}</TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="outline" size="sm" disabled={ref.payoutStatus !== 'Pending'}>
                            {ref.payoutStatus === 'Pending' ? 'Update' : ref.payoutStatus}
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                           {PayoutStatusOptions.map(status => (
                            <DropdownMenuItem 
                                key={status} 
                                onClick={() => handleUpdateStatus(ref.id, status)}
                                disabled={ref.payoutStatus === status}
                            >
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
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
                      <p className="text-lg">No referrals found.</p>
                      <p className="text-sm">When customers refer others, the data will appear here.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {referrals.length > 0 && !isLoading && (
        <CardFooter className="flex items-center justify-between pt-4 border-t">
          <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages} ({referrals.length} item{referrals.length === 1 ? '' : 's'})</span>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>Next</Button>
          </div>
        </CardFooter>
      )}
       {(referrals.length === 0 && !isLoading) && (
         <CardFooter className="flex items-center justify-center pt-4 border-t min-h-[68px]">
          <span className="text-sm text-muted-foreground">No data to paginate</span>
        </CardFooter>
      )}
       {isLoading && (
         <CardFooter className="flex items-center justify-between pt-4 border-t min-h-[68px]">
          <Skeleton className="h-5 w-20" />
          <div className="flex space-x-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
