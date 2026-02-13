
'use client';

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Complaint, ComplaintStatus } from '@/types';
import { User, Mail, MessageSquare, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { updateComplaintStatus } from '@/lib/server-actions';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/utils';

interface ComplaintTableProps {
  title: ReactNode;
  complaints: Complaint[];
  isLoading: boolean;
  onActioned: () => void;
}

const ITEMS_PER_PAGE = 5;

const safeFormatDate = (dateVal: any, formatStr: string = 'PPp') => {
    if (!dateVal) return 'N/A';
    const date = typeof dateVal === 'string' ? parseISO(dateVal) : dateVal;
    return isValid(date) ? format(date, formatStr) : 'N/A';
};

export default function ComplaintTable({ title, complaints, isLoading, onActioned }: ComplaintTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentPage(1);
  }, [complaints]);

  const totalPages = Math.ceil(complaints.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedComplaints = complaints.slice(startIndex, endIndex);

  const handlePreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleStatusChange = async (complaintId: string, status: ComplaintStatus) => {
    const success = await updateComplaintStatus(complaintId, status);
    if (success) {
      toast({ title: `Complaint ${status}`, description: `The complaint status has been updated.` });
      onActioned();
    } else {
      toast({ title: "Error", description: "Failed to update complaint status.", variant: "destructive" });
    }
  };

  const getStatusColor = (status: ComplaintStatus) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Resolved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'Rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
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
                <TableHead><User className="inline-block mr-2 h-4 w-4" />User</TableHead>
                <TableHead><MessageSquare className="inline-block mr-2 h-4 w-4" />Issue</TableHead>
                <TableHead><Clock className="inline-block mr-2 h-4 w-4" />Status</TableHead>
                <TableHead><Clock className="inline-block mr-2 h-4 w-4" />Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                  Array(ITEMS_PER_PAGE).fill(0).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                  ))
              ) : paginatedComplaints.length > 0 ? (
                paginatedComplaints.map((comp) => (
                  <TableRow key={comp.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="font-medium">{comp.userName}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {comp.userEmail}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-sm">{comp.subject}</div>
                      <p className="text-xs text-muted-foreground line-clamp-2 max-w-xs">{comp.message}</p>
                    </TableCell>
                    <TableCell>
                      <span className={cn("px-2 py-1 text-xs font-medium rounded-full", getStatusColor(comp.status))}>
                        {comp.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {safeFormatDate(comp.timestamp)}
                    </TableCell>
                    <TableCell className="text-right">
                      {comp.status === 'Pending' ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="h-8 border-green-500 text-green-600 hover:bg-green-500" onClick={() => handleStatusChange(comp.id, 'Resolved')}>
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Resolved
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 border-red-500 text-red-600 hover:bg-red-500" onClick={() => handleStatusChange(comp.id, 'Rejected')}>
                            <XCircle className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs italic text-muted-foreground">Processed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="h-24 text-center">No complaints found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {complaints.length > 0 && !isLoading && (
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
