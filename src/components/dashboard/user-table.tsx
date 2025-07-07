
'use client';

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile, ApprovalStatusType } from '@/types';
import { Locations, GenderOptions } from '@/types';
import { User, Phone, MapPin, FileText, CalendarDays, AlertCircle, Fingerprint, Car, Settings2, Check, X, Eye, UserCheck, Loader2, ChevronDown, Hourglass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { updateUserApprovalStatus, fetchApprovedInstructors, assignTrainerToCustomer } from '@/lib/mock-data';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';


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
  
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedUserForAssignment, setSelectedUserForAssignment] = useState<UserProfile | null>(null);
  const [availableTrainers, setAvailableTrainers] = useState<UserProfile[]>([]);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignFilters, setAssignFilters] = useState<{ location?: string; gender?: string }>({});
  const [loadingTrainers, setLoadingTrainers] = useState(false);

  useEffect(() => {
    setCurrentPage(1); 
  }, [users]);
  
  useEffect(() => {
    if (isAssignDialogOpen) {
      setLoadingTrainers(true);
      fetchApprovedInstructors(assignFilters).then(trainers => {
        setAvailableTrainers(trainers);
        setLoadingTrainers(false);
      });
    }
  }, [isAssignDialogOpen, assignFilters]);


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
  
  const openAssignDialog = (user: UserProfile) => {
    setSelectedUserForAssignment(user);
    setIsAssignDialogOpen(true);
    setSelectedTrainerId(null);
    setAssignFilters({});
  };
  
  const handleConfirmAssignment = async () => {
    if (!selectedUserForAssignment || !selectedTrainerId) {
      toast({
        title: "Assignment Error",
        description: "Please select a trainer before confirming.",
        variant: "destructive",
      });
      return;
    }
    
    setIsAssigning(true);
    const success = await assignTrainerToCustomer(selectedUserForAssignment.id, selectedTrainerId);
    
    if (success) {
      toast({
        title: "Assignment Successful",
        description: `${selectedUserForAssignment.name} has been assigned a trainer.`,
      });
      onUserActioned();
      setIsAssignDialogOpen(false);
    } else {
      toast({
        title: "Assignment Failed",
        description: "Could not complete the assignment. Please try again.",
        variant: "destructive",
      });
    }
    setIsAssigning(false);
  };

  const handleUpdateStatus = async (user: UserProfile, newStatus: ApprovalStatusType) => {
    const isTrainer = user.uniqueId.startsWith('TR');

    try {
      // The "Assign" button flow is only for customers. Trainers can be approved directly.
      if (!isTrainer && newStatus === 'Approved') {
        toast({
          title: "Action Required",
          description: "Please use the 'Approve & Assign' button to approve and assign a trainer to this customer.",
          variant: 'destructive',
        });
        return;
      }
      
      const success = await updateUserApprovalStatus(user, newStatus);
      if (success) {
        toast({
          title: `User ${newStatus}`,
          description: `${user.name} has been successfully ${newStatus.toLowerCase()}.`,
        });
        onUserActioned(); // Trigger data refresh in DashboardPage
      } else {
        toast({
          title: "Update Failed",
          description: `Could not update status for ${user.name}.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`Error updating user ${user.id} status:`, error);
      toast({
        title: "Error",
        description: `An error occurred while updating ${user.name}'s status.`,
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
  
  const getStatusColor = (status: ApprovalStatusType) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300';
      case 'Approved': return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300';
      case 'In Progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300';
      case 'Rejected': return 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300';
    }
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
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-9 w-[160px]" /></TableCell> 
      </TableRow>
    ))
  );

  return (
    <>
      <Card className="shadow-lg border border-primary transition-shadow duration-300 flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline text-2xl font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Fingerprint className="inline-block mr-2 h-4 w-4" />ID</TableHead>
                  <TableHead><User className="inline-block mr-2 h-4 w-4" />Name</TableHead>
                  <TableHead><Phone className="inline-block mr-2 h-4 w-4" />Contact</TableHead>
                  <TableHead><MapPin className="inline-block mr-2 h-4 w-4" />Location</TableHead>
                  <TableHead><FileText className="inline-block mr-2 h-4 w-4" />Subscription</TableHead>
                  <TableHead><Car className="inline-block mr-2 h-4 w-4" />Vehicle</TableHead> 
                  <TableHead><CalendarDays className="inline-block mr-2 h-4 w-4" />Registered</TableHead>
                  <TableHead><Hourglass className="inline-block mr-2 h-4 w-4" />Status</TableHead>
                  <TableHead className="text-center"><Settings2 className="inline-block mr-2 h-4 w-4" />Verification</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? renderSkeletons() : paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => {
                    const isTrainer = user.uniqueId.startsWith('TR');
                    return (
                      <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{user.uniqueId}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.phone || 'N/A'}</TableCell>
                        <TableCell>{user.location}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.subscriptionPlan === 'Premium' ? 'bg-primary/20 text-primary' :
                            user.subscriptionPlan === 'Gold' ? 'bg-accent/20 text-accent' :
                            user.subscriptionPlan === 'Trainer' ? 'bg-secondary text-secondary-foreground' :
                            'bg-muted text-muted-foreground' // Basic plan
                          }`}>
                            {user.subscriptionPlan}
                          </span>
                        </TableCell>
                        <TableCell>{user.vehicleInfo || 'N/A'}</TableCell> 
                        <TableCell>{user.registrationTimestamp}</TableCell>
                        <TableCell>
                           <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.approvalStatus)}`}>
                            {user.approvalStatus}
                          </span>
                        </TableCell>
                        <TableCell>
                           {isTrainer ? (
                            <div className="flex items-center justify-center space-x-1.5">
                              <Button 
                                variant="outline" size="sm" 
                                onClick={() => handleViewDetails(user)}
                                className="px-2 py-1 hover:bg-accent/10 hover:border-accent hover:text-accent"
                                aria-label={`View details for ${user.name}`}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span className="ml-1.5 hidden sm:inline">View</span>
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="w-[130px] justify-between">
                                    <span>Update Status</span>
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(user, 'Approved')}>
                                    <Check className="mr-2 h-4 w-4 text-green-500" />
                                    <span>Approved</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(user, 'In Progress')}>
                                    <Hourglass className="mr-2 h-4 w-4 text-blue-500" />
                                    <span>In Progress</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(user, 'Rejected')}>
                                    <X className="mr-2 h-4 w-4 text-red-500" />
                                    <span>Rejected</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ) : (
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
                                onClick={() => openAssignDialog(user)}
                                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1"
                                aria-label={`Assign trainer for ${user.name}`}
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                                <span className="ml-1.5 hidden sm:inline">Approve &amp; Assign</span>
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => handleUpdateStatus(user, 'Rejected')}
                                className="px-2 py-1"
                                aria-label={`Reject ${user.name}`}
                              >
                                <X className="h-3.5 w-3.5" />
                                <span className="ml-1.5 hidden sm:inline">Reject</span>
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center"> 
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
      
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Trainer to {selectedUserForAssignment?.name}</DialogTitle>
            <DialogDescription>
              Filter and select an approved trainer. This will also approve the customer's registration.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="assign-location-filter">Location</Label>
                      <Select
                          value={assignFilters.location || 'all'}
                          onValueChange={(value) => setAssignFilters(prev => ({...prev, location: value === 'all' ? undefined : value}))}
                      >
                          <SelectTrigger id="assign-location-filter">
                              <SelectValue placeholder="Filter by Location" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">All Locations</SelectItem>
                              {Locations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="assign-gender-filter">Gender</Label>
                      <Select
                           value={assignFilters.gender || 'all'}
                           onValueChange={(value) => setAssignFilters(prev => ({...prev, gender: value === 'all' ? undefined : value}))}
                      >
                          <SelectTrigger id="assign-gender-filter">
                              <SelectValue placeholder="Filter by Gender" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">Any Gender</SelectItem>
                              {GenderOptions.filter(o => o !== 'Prefer not to say' && o !== 'Other').map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
              </div>
              
              <Separator className="my-2" />

              <div className="space-y-2">
                  <Label htmlFor="trainer-select">Available Trainers</Label>
                  <Select
                      value={selectedTrainerId || ''}
                      onValueChange={setSelectedTrainerId}
                      disabled={loadingTrainers}
                  >
                      <SelectTrigger id="trainer-select">
                          <SelectValue placeholder={loadingTrainers ? "Loading trainers..." : "Select a trainer"} />
                      </SelectTrigger>
                      <SelectContent>
                          {loadingTrainers ? (
                              <SelectItem value="loading" disabled>Loading...</SelectItem>
                          ) : availableTrainers.length > 0 ? (
                              availableTrainers.map(trainer => (
                                  <SelectItem key={trainer.id} value={trainer.id}>
                                      {trainer.name} ({[trainer.gender, trainer.location].filter(Boolean).join(', ')})
                                  </SelectItem>
                              ))
                          ) : (
                              <SelectItem value="none" disabled>No trainers match filters</SelectItem>
                          )}
                      </SelectContent>
                  </Select>
              </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmAssignment} disabled={!selectedTrainerId || isAssigning}>
              {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
