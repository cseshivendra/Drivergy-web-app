
'use client';

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile, ApprovalStatusType } from '@/types';
import { User, Phone, MapPin, FileText, CalendarDays, AlertCircle, Fingerprint, Car, Settings2, Check, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { updateUserApprovalStatus } from '@/lib/mock-data';


interface UserTableProps {
  title: ReactNode;
  users: UserProfile[];
  isLoading: boolean;
  onUserActioned: () => void; // Callback to refresh data on parent
}

const ITEMS_PER_PAGE = 5;

export default function UserTable({ title, users, isLoading, onUserActioned }: UserTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentPage(1); 
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

  const handleUpdateStatus = async (userId: string, userName: string, newStatus: ApprovalStatusType) => {
    try {
      const success = await updateUserApprovalStatus(userId, newStatus);
      if (success) {
        toast({
          title: `User ${newStatus}`,
          description: `${userName} has been successfully ${newStatus.toLowerCase()}.`,
        });
        onUserActioned(); // Trigger data refresh in DashboardPage
      } else {
        toast({
          title: "Update Failed",
          description: `Could not update status for ${userName}. User not found.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`Error updating user ${userId} status:`, error);
      toast({
        title: "Error",
        description: `An error occurred while updating ${userName}'s status.`,
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (user: UserProfile) => {
    window.open(`/users/${user.id}`, '_blank'); // Opens in a new tab
    toast({ 
      title: "Opening Details",
      description: `Opening details for ${user.name} in a new tab.`,
    });
  };


  const renderSkeletons = () => (
    Array(ITEMS_PER_PAGE).fill(0).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        <TableCell><Skeleton className="h-5 w-28" /></TableCell>
        <TableCell><Skeleton className="h-5 w-36" /></TableCell>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell> 
        <TableCell><Skeleton className="h-5 w-28" /></TableCell>
        <TableCell><Skeleton className="h-9 w-[160px]" /></TableCell> 
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
                <TableHead className="w-[100px]"><Fingerprint className="inline-block mr-2 h-4 w-4" />ID</TableHead>
                <TableHead className="w-[180px]"><User className="inline-block mr-2 h-4 w-4" />Name</TableHead>
                <TableHead><Phone className="inline-block mr-2 h-4 w-4" />Contact</TableHead>
                <TableHead><MapPin className="inline-block mr-2 h-4 w-4" />Location</TableHead>
                <TableHead><FileText className="inline-block mr-2 h-4 w-4" />Subscription</TableHead>
                <TableHead><Car className="inline-block mr-2 h-4 w-4" />Vehicle</TableHead> 
                <TableHead><CalendarDays className="inline-block mr-2 h-4 w-4" />Registered</TableHead>
                <TableHead className="min-w-[200px] text-center"><Settings2 className="inline-block mr-2 h-4 w-4" />Actions</TableHead>
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
                        user.subscriptionPlan === 'Premium' ? 'bg-primary/20 text-primary' : // Use text-primary for dark theme readability
                        user.subscriptionPlan === 'Gold' ? 'bg-gray-500/20 text-gray-300 dark:text-gray-400' :
                        user.subscriptionPlan === 'Trainer' ? 'bg-gray-600/20 text-gray-200 dark:text-gray-300' :
                        'bg-muted/50 text-muted-foreground' // Generic muted for basic/other
                      }`}>
                        {user.subscriptionPlan}
                      </span>
                    </TableCell>
                    <TableCell>{user.vehicleInfo || 'N/A'}</TableCell> 
                    <TableCell>{user.registrationTimestamp}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center space-x-1.5">
                        <Button 
                          variant="outline"
                          size="sm" 
                          onClick={() => handleViewDetails(user)}
                          className="px-2 py-1 hover:bg-accent/10 hover:border-accent hover:text-accent"
                          aria-label={`View details for ${user.name}`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                           <span className="ml-1.5 hidden sm:inline">View</span>
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => handleUpdateStatus(user.id, user.name, 'Approved')}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground px-2 py-1"
                           aria-label={`Approve ${user.name}`}
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span className="ml-1.5 hidden sm:inline">Approve</span>
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleUpdateStatus(user.id, user.name, 'Rejected')}
                          className="px-2 py-1"
                           aria-label={`Reject ${user.name}`}
                        >
                          <X className="h-3.5 w-3.5" />
                           <span className="ml-1.5 hidden sm:inline">Reject</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center"> 
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
                      <p className="text-lg">No pending enrollments found.</p>
                      <p className="text-sm">Check back later or adjust filters if applicable.</p>
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
            Page {currentPage} of {totalPages} ({users.length} item{users.length === 1 ? '' : 's'})
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
