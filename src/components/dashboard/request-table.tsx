
'use client';

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { LessonRequest, VehicleType } from '@/types';
import { User, Bike, Car as FourWheelerIcon, CalendarDays, HelpCircle, AlertCircle } from 'lucide-react'; // Renamed Car to FourWheelerIcon
import { Button } from '@/components/ui/button';

interface RequestTableProps {
  title: ReactNode;
  requests: LessonRequest[];
  vehicleType: VehicleType;
  isLoading: boolean;
}

const ITEMS_PER_PAGE = 5;

export default function RequestTable({ title, requests, vehicleType, isLoading }: RequestTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when requests data changes
  }, [requests]);

  const totalPages = Math.ceil(requests.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedRequests = requests.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const renderSkeletons = () => (
    Array(ITEMS_PER_PAGE).fill(0).map((_, index) => ( // Use ITEMS_PER_PAGE for skeleton rows
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
      </TableRow>
    ))
  );

  const getStatusColor = (status: LessonRequest['status']) => {
    switch (status) {
      case 'Pending': 
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300';
      case 'Active': 
        return 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300';
      case 'Completed': 
        return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300';
      default: 
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300';
    }
  };

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
                <TableHead className="w-[200px]"><User className="inline-block mr-2 h-4 w-4" />Customer Name</TableHead>
                <TableHead>
                  {vehicleType === 'Two-Wheeler' 
                    ? <Bike className="inline-block mr-2 h-4 w-4" /> 
                    : <FourWheelerIcon className="inline-block mr-2 h-4 w-4" />
                  }
                  Vehicle Type
                </TableHead>
                <TableHead><HelpCircle className="inline-block mr-2 h-4 w-4" />Status</TableHead>
                <TableHead><CalendarDays className="inline-block mr-2 h-4 w-4" />Requested At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {isLoading ? renderSkeletons() : paginatedRequests.length > 0 ? (
                paginatedRequests.map((request) => (
                  <TableRow key={request.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{request.customerName}</TableCell>
                    <TableCell>{request.vehicleType}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </TableCell>
                    <TableCell>{request.requestTimestamp}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                     <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
                       <p className="text-lg">No {vehicleType.toLowerCase()} requests found.</p>
                       <p className="text-sm">Check back later for new lesson requests.</p>
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
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
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
