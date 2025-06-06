
'use client';

import type { ReactNode } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import type { LessonRequest, VehicleType } from '@/types';
import { LessonRequestStatusOptions } from '@/types'; // Import status options
import { User, Bike, Car as FourWheelerIcon, CalendarDays, HelpCircle, AlertCircle, Filter } from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState<LessonRequest['status'] | 'all'>('all');

  const filteredRequests = useMemo(() => {
    if (statusFilter === 'all') {
      return requests;
    }
    return requests.filter(request => request.status === statusFilter);
  }, [requests, statusFilter]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when requests data or filter changes
  }, [requests, statusFilter]);

  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const renderSkeletons = () => (
    Array(ITEMS_PER_PAGE).fill(0).map((_, index) => (
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
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <CardTitle className="font-headline text-2xl font-semibold mb-4 sm:mb-0">{title}</CardTitle>
        <div className="w-full sm:w-auto sm:max-w-xs">
          <Label htmlFor={`status-filter-${vehicleType.replace(/\s+/g, '-')}`} className="sr-only">Filter by Status</Label>
          <Select 
            value={statusFilter} 
            onValueChange={(value) => setStatusFilter(value as LessonRequest['status'] | 'all')}
            disabled={isLoading}
          >
            <SelectTrigger id={`status-filter-${vehicleType.replace(/\s+/g, '-')}`} className="w-full">
              <Filter className="inline-block mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {LessonRequestStatusOptions.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
                       <p className="text-lg">
                         {requests.length === 0 ? `No ${vehicleType.toLowerCase()} requests found.` : `No ${vehicleType.toLowerCase()} requests match the current filter.`}
                       </p>
                       <p className="text-sm">
                         {requests.length === 0 ? "Check back later for new lesson requests." : "Try adjusting your filter criteria."}
                       </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {filteredRequests.length > 0 && !isLoading && (
         <CardFooter className="flex items-center justify-between pt-4 border-t">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} ({filteredRequests.length} item{filteredRequests.length === 1 ? '' : 's'})
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
      {(filteredRequests.length === 0 && !isLoading) && (
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
