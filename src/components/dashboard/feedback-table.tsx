
'use client';

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Feedback } from '@/types';
import { User, CalendarDays, Star, MessageSquare, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, parseISO, isValid } from 'date-fns';

interface FeedbackTableProps {
  title: ReactNode;
  feedback: Feedback[];
  isLoading: boolean;
}

const ITEMS_PER_PAGE = 5;

// Safe Date Formatting Helper
const safeFormatDate = (dateVal: any, formatStr: string = 'PP') => {
    if (!dateVal) return 'N/A';
    const date = typeof dateVal === 'string' ? parseISO(dateVal) : dateVal;
    return isValid(date) ? format(date, formatStr) : 'N/A';
};

const StarDisplay = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={cn(
          "h-4 w-4",
          rating >= star ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"
        )}
      />
    ))}
  </div>
);

export default function FeedbackTable({ title, feedback, isLoading }: FeedbackTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [feedback]);

  const totalPages = Math.ceil(feedback.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedFeedback = feedback.slice(startIndex, endIndex);

  const handlePreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <Card className="shadow-lg border border-primary flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline text-2xl font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><User className="inline-block mr-2 h-4 w-4" />Customer</TableHead>
                <TableHead><User className="inline-block mr-2 h-4 w-4" />Trainer</TableHead>
                <TableHead><Star className="inline-block mr-2 h-4 w-4" />Rating</TableHead>
                <TableHead><MessageSquare className="inline-block mr-2 h-4 w-4" />Comment</TableHead>
                <TableHead><CalendarDays className="inline-block mr-2 h-4 w-4" />Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                  Array(ITEMS_PER_PAGE).fill(0).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                  ))
              ) : paginatedFeedback.length > 0 ? (
                paginatedFeedback.map((fb) => (
                  <TableRow key={fb.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{fb.customerName}</TableCell>
                    <TableCell>{fb.trainerName}</TableCell>
                    <TableCell><StarDisplay rating={fb.rating} /></TableCell>
                    <TableCell>
                      <p className="max-w-xs truncate">{fb.comment}</p>
                    </TableCell>
                    <TableCell>{safeFormatDate(fb.submissionDate)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="h-24 text-center">No feedback yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {feedback.length > 0 && !isLoading && (
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
