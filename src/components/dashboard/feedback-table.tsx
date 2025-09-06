
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FeedbackTableProps {
  title: ReactNode;
  feedback: Feedback[];
  isLoading: boolean;
}

const ITEMS_PER_PAGE = 5;

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

  const renderSkeletons = () => (
    Array(ITEMS_PER_PAGE).fill(0).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <TooltipProvider>
      <Card className="shadow-lg border border-primary transition-shadow duration-300 flex flex-col">
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
                {isLoading ? renderSkeletons() : paginatedFeedback.length > 0 ? (
                  paginatedFeedback.map((fb) => (
                    <TableRow key={fb.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{fb.customerName}</TableCell>
                      <TableCell>{fb.trainerName}</TableCell>
                      <TableCell><StarDisplay rating={fb.rating} /></TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="max-w-xs truncate">{fb.comment}</p>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{fb.comment}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{fb.submissionDate}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
                        <p className="text-lg">No feedback submitted yet.</p>
                        <p className="text-sm">Check back later to see customer ratings.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {feedback.length > 0 && !isLoading && (
          <CardFooter className="flex items-center justify-between pt-4 border-t">
            <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages} ({feedback.length} item{feedback.length === 1 ? '' : 's'})</span>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>Next</Button>
            </div>
          </CardFooter>
        )}
        {(feedback.length === 0 && !isLoading) && (
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
    </TooltipProvider>
  );
}
