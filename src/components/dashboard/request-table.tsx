
import type { ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { LessonRequest, VehicleType } from '@/types';
import { User, Bike, Car, CalendarDays, HelpCircle, AlertCircle } from 'lucide-react';

interface RequestTableProps {
  title: ReactNode; // Changed from string to ReactNode
  requests: LessonRequest[];
  vehicleType: VehicleType;
  isLoading: boolean;
}

export default function RequestTable({ title, requests, vehicleType, isLoading }: RequestTableProps) {
  const renderSkeletons = () => (
    Array(2).fill(0).map((_, index) => (
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
    <Card className="shadow-lg border border-primary transition-shadow duration-300">
      <CardHeader>
        {/* CardTitle now renders ReactNode directly */}
        <CardTitle className="font-headline text-2xl font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]"><User className="inline-block mr-2 h-4 w-4" />Customer Name</TableHead>
                <TableHead>
                  {vehicleType === 'Two-Wheeler' 
                    ? <Bike className="inline-block mr-2 h-4 w-4" /> 
                    : <Car className="inline-block mr-2 h-4 w-4" />
                  }
                  Vehicle Type
                </TableHead>
                <TableHead><HelpCircle className="inline-block mr-2 h-4 w-4" />Status</TableHead>
                <TableHead><CalendarDays className="inline-block mr-2 h-4 w-4" />Requested At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {isLoading ? renderSkeletons() : requests.length > 0 ? (
                requests.map((request) => (
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
    </Card>
  );
}

