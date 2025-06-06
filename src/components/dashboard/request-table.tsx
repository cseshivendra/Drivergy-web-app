
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { LessonRequest, VehicleType } from '@/types';
import { User, Bike, Car, CalendarDays, HelpCircle, AlertCircle } from 'lucide-react';

interface RequestTableProps {
  title: string;
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
      case 'Pending': return 'bg-yellow-400/20 text-yellow-700';
      case 'Active': return 'bg-blue-400/20 text-blue-700';
      case 'Completed': return 'bg-green-400/20 text-green-700';
      default: return 'bg-gray-400/20 text-gray-700';
    }
  };


  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader>
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
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)} dark:text-foreground`}>
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
