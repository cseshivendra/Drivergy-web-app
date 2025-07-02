
'use client';

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import type { LessonProgressData } from '@/types';
import { User, UserCheck, CheckCircle, BarChart2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LessonProgressTableProps {
  title: ReactNode;
  data: LessonProgressData[];
  isLoading: boolean;
}

const ITEMS_PER_PAGE = 5;

export default function LessonProgressTable({ title, data, isLoading }: LessonProgressTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = data.slice(startIndex, endIndex);

  const handlePreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const renderSkeletons = () =>
    Array(ITEMS_PER_PAGE)
      .fill(0)
      .map((_, index) => (
        <TableRow key={`skeleton-progress-${index}`}>
          <TableCell>
            <Skeleton className="h-5 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-48" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16" />
          </TableCell>
        </TableRow>
      ));

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
                <TableHead><User className="inline-block mr-2 h-4 w-4" />Student</TableHead>
                <TableHead><UserCheck className="inline-block mr-2 h-4 w-4" />Trainer</TableHead>
                <TableHead><CheckCircle className="inline-block mr-2 h-4 w-4" />Plan</TableHead>
                <TableHead className="w-[250px]"><BarChart2 className="inline-block mr-2 h-4 w-4" />Progress</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? renderSkeletons() : paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <TableRow key={item.studentId} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{item.studentName}</TableCell>
                    <TableCell>{item.trainerName}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.subscriptionPlan === 'Premium' ? 'bg-primary/20 text-primary' :
                          item.subscriptionPlan === 'Gold' ? 'bg-accent/20 text-accent' :
                          'bg-muted text-muted-foreground'
                        }`}>
                        {item.subscriptionPlan}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={(item.completedLessons / item.totalLessons) * 100} className="w-[60%]" />
                        <span className="text-xs text-muted-foreground">
                          {item.completedLessons}/{item.totalLessons}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">{item.remainingLessons}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
                        <p className="text-lg">No active student progress to show.</p>
                        <p className="text-sm">Approve customers and assign trainers to see data here.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {data.length > 0 && !isLoading && (
        <CardFooter className="flex items-center justify-between pt-4 border-t">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} ({data.length} item{data.length === 1 ? '' : 's'})
          </span>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>
              Next
            </Button>
          </div>
        </CardFooter>
      )}
      {(data.length === 0 && !isLoading) && (
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
