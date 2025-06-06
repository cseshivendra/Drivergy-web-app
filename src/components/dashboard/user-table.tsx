
'use client';

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile } from '@/types';
import { User, Phone, MapPin, FileText, CalendarDays, AlertCircle, Fingerprint, Car } from 'lucide-react'; // Added Car icon
import { Button } from '@/components/ui/button';

interface UserTableProps {
  title: ReactNode;
  users: UserProfile[];
  isLoading: boolean;
}

const ITEMS_PER_PAGE = 5;

export default function UserTable({ title, users, isLoading }: UserTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when users data changes due to filters or search
  }, [users]);

  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedUsers = users.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const renderSkeletons = () => (
    Array(ITEMS_PER_PAGE).fill(0).map((_, index) => ( // Use ITEMS_PER_PAGE for skeleton rows
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-28" /></TableCell> 
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
      </TableRow>
    ))
  );

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
                <TableHead className="w-[120px]"><Fingerprint className="inline-block mr-2 h-4 w-4" />ID</TableHead>
                <TableHead className="w-[200px]"><User className="inline-block mr-2 h-4 w-4" />Name</TableHead>
                <TableHead><Phone className="inline-block mr-2 h-4 w-4" />Contact</TableHead>
                <TableHead><MapPin className="inline-block mr-2 h-4 w-4" />Location</TableHead>
                <TableHead><FileText className="inline-block mr-2 h-4 w-4" />Subscription</TableHead>
                <TableHead><Car className="inline-block mr-2 h-4 w-4" />Vehicle</TableHead> 
                <TableHead><CalendarDays className="inline-block mr-2 h-4 w-4" />Registered At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? renderSkeletons() : paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{user.uniqueId}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.contact}</TableCell>
                    <TableCell>{user.location}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.subscriptionPlan === 'Premium' ? 'bg-primary/20 text-primary-foreground' :
                        user.subscriptionPlan === 'Gold' ? 'bg-yellow-400/20 text-yellow-700' :
                        user.subscriptionPlan === 'Trainer' ? 'bg-green-400/20 text-green-700' : // Specific style for Trainer
                        'bg-gray-400/20 text-gray-700'
                      } dark:text-foreground`}>
                        {user.subscriptionPlan}
                      </span>
                    </TableCell>
                    <TableCell>{user.vehicleInfo || 'N/A'}</TableCell> 
                    <TableCell>{user.registrationTimestamp}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center"> 
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
                      <p className="text-lg">No users found.</p>
                      <p className="text-sm">Try adjusting your filters or check back later.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {users.length > 0 && !isLoading && (
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
      {(users.length === 0 && !isLoading) && (
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
