
'use client';

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { RescheduleRequest, RescheduleRequestStatusType } from '@/types';
import { User, CalendarDays, AlertCircle, Check, X, Settings2, HelpCircle, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { updateRescheduleRequestStatus } from '@/lib/mock-data';

interface RescheduleRequestTableProps {
  title: ReactNode;
  requests: RescheduleRequest[];
  isLoading: boolean;
  onActioned: () => void;
}

const ITEMS_PER_PAGE = 5;

export default function RescheduleRequestTable({ title, requests, isLoading, onActioned }: RescheduleRequestTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentPage(1);
  }, [requests]);

  const totalPages = Math.ceil(requests.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedRequests = requests.slice(startIndex, endIndex);

  const handlePreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleUpdateStatus = async (requestId: string, userName: string, newStatus: RescheduleRequestStatusType) => {
    try {
      const success = await updateRescheduleRequestStatus(requestId, newStatus);
      if (success) {
        toast({
          title: `Request ${newStatus}`,
          description: `Reschedule request for ${userName} has been ${newStatus.toLowerCase()}.`,
        });
        onActioned();
      } else {
        toast({
          title: "Update Failed",
          description: "Could not update the request.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`Error updating request ${requestId} status:`, error);
      toast({
        title: "Error",
        description: "An error occurred while updating the request.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: RescheduleRequestStatusType) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300';
      case 'Approved': return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300';
      case 'Rejected': return 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300';
    }
  };

  const renderSkeletons = () => (
    Array(ITEMS_PER_PAGE).fill(0).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-9 w-36" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <Card className="shadow-lg border border-primary transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline text-2xl font-semibold flex items-center">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><User className="inline-block mr-2 h-4 w-4" />Customer</TableHead>
                <TableHead><CalendarDays className="inline-block mr-2 h-4 w-4" />Original Date</TableHead>
                <TableHead><Repeat className="inline-block mr-2 h-4 w-4" />Requested Date</TableHead>
                <TableHead><HelpCircle className="inline-block mr-2 h-4 w-4" />Status</TableHead>
                <TableHead className="text-center"><Settings2 className="inline-block mr-2 h-4 w-4" />Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? renderSkeletons() : paginatedRequests.length > 0 ? (
                paginatedRequests.map((req) => (
                  <TableRow key={req.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{req.customerName}</TableCell>
                    <TableCell>{req.originalLessonDate}</TableCell>
                    <TableCell>{req.requestedRescheduleDate}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(req.status)}`}>
                        {req.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {req.status === 'Pending' ? (
                        <div className="flex items-center justify-center space-x-1.5">
                          <Button
                            variant="default" size="sm"
                            onClick={() => handleUpdateStatus(req.id, req.customerName, 'Approved')}
                            className="bg-green-600 hover:bg-green-700 text-white px-2 py-1"
                            aria-label={`Approve ${req.customerName}`}
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span className="ml-1.5 hidden sm:inline">Approve</span>
                          </Button>
                          <Button
                            variant="destructive" size="sm"
                            onClick={() => handleUpdateStatus(req.id, req.customerName, 'Rejected')}
                            className="px-2 py-1"
                            aria-label={`Reject ${req.customerName}`}
                          >
                            <X className="h-3.5 w-3.5" />
                            <span className="ml-1.5 hidden sm:inline">Reject</span>
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm italic">Actioned</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
                      <p className="text-lg">No reschedule requests found.</p>
                      <p className="text-sm">Check back later for new requests.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {requests.length > 0 && !isLoading && (
        <CardFooter className="flex items-center justify-between pt-4 border-t">
          <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages} ({requests.length} item{requests.length === 1 ? '' : 's'})</span>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>Next</Button>
          </div>
        </CardFooter>
      )}
       {(requests.length === 0 && !isLoading) && (
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
