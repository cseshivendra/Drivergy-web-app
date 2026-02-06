
'use client';

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { RescheduleRequest, RescheduleRequestStatusType } from '@/types';
import { User, CalendarDays, Check, X, Settings2, HelpCircle, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { updateRescheduleRequestStatus } from '@/lib/server-actions';
import { format, parseISO, isValid } from 'date-fns';

interface RescheduleRequestTableProps {
  title: ReactNode;
  requests: RescheduleRequest[];
  isLoading: boolean;
  onActioned: () => void;
}

const ITEMS_PER_PAGE = 5;

// Safe Date Formatting Helper
const safeFormatDate = (dateVal: any, formatStr: string = 'PPp') => {
    if (!dateVal) return 'N/A';
    const date = typeof dateVal === 'string' ? parseISO(dateVal) : dateVal;
    return isValid(date) ? format(date, formatStr) : 'N/A';
};

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
        toast({ title: `Request ${newStatus}`, description: `Updated for ${userName}.` });
        onActioned();
      } else throw new Error();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update request.", variant: "destructive" });
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

  return (
    <Card className="shadow-lg border border-primary flex flex-col">
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
              {isLoading ? (
                  Array(ITEMS_PER_PAGE).fill(0).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                  ))
              ) : paginatedRequests.length > 0 ? (
                paginatedRequests.map((req) => (
                  <TableRow key={req.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{req.customerName}</TableCell>
                    <TableCell>{safeFormatDate(req.originalLessonDate)}</TableCell>
                    <TableCell>{safeFormatDate(req.requestedRescheduleDate)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(req.status)}`}>
                        {req.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {req.status === 'Pending' ? (
                        <div className="flex items-center justify-center space-x-1.5">
                          <Button variant="default" size="sm" onClick={() => handleUpdateStatus(req.id, req.customerName, 'Approved')} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1"><Check className="h-3.5 w-3.5" /></Button>
                          <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(req.id, req.customerName, 'Rejected')} className="px-2 py-1"><X className="h-3.5 w-3.5" /></Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm italic text-center block w-full">Actioned</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="h-24 text-center">No requests found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {requests.length > 0 && !isLoading && (
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
}
