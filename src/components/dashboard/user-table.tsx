
'use client';

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile, ApprovalStatusType } from '@/types';
import { Locations, GenderOptions } from '@/types';
import { User, Phone, MapPin, FileText, CalendarDays, AlertCircle, Fingerprint, Car, Settings2, Check, X, Eye, UserCheck, Loader2, ChevronDown, Hourglass, Trash2, UserCog, Play, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { fetchApprovedInstructors } from '@/lib/mock-data';
import { updateUserApprovalStatus, assignTrainerToCustomer, deleteUserAction, reassignTrainerToCustomer } from '@/lib/server-actions';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { format, parseISO, isValid } from 'date-fns';

type ActionType = 'new-customer' | 'new-trainer' | 'existing-trainer' | 'interested-customer' | 'existing-customer' | 'cancellation-request';

interface UserTableProps {
  title: ReactNode;
  users: UserProfile[];
  isLoading: boolean;
  onUserActioned: () => void;
  actionType: ActionType;
}

const ITEMS_PER_PAGE = 5;

// Safe Date Formatting Helper
const safeFormatDate = (dateVal: any, formatStr: string = 'PP') => {
    if (!dateVal) return 'N/A';
    const date = typeof dateVal === 'string' ? parseISO(dateVal) : dateVal;
    return isValid(date) ? format(date, formatStr) : 'N/A';
};

export default function UserTable({ title, users, isLoading, onUserActioned, actionType }: UserTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

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

  const handlePreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  
  const openAssignDialog = (user: UserProfile) => {
    setSelectedUserForAssignment(user);
    setIsAssigning(false);
    setIsAssignDialogOpen(true);
    setSelectedTrainerId(null);
    setAssignFilters({});
  };
  
  const handleConfirmAssignment = async () => {
    if (!selectedUserForAssignment || !selectedTrainerId) return;
    setIsAssigning(true);
    const action = actionType === 'existing-customer' 
        ? reassignTrainerToCustomer(selectedUserForAssignment.id, selectedTrainerId)
        : assignTrainerToCustomer(selectedUserForAssignment.id, selectedTrainerId);

    try {
        const updated = await action;
        if (updated) {
            toast({ title: "Assignment Successful", description: `${selectedUserForAssignment.name} has a trainer.` });
            onUserActioned();
            setIsAssignDialogOpen(false);
        } else {
            throw new Error("Assignment failed.");
        }
    } catch (error) {
        toast({ title: "Failed", description: "Could not complete assignment.", variant: "destructive" });
    } finally {
        setIsAssigning(false);
    }
  };

  const handleUpdateStatus = async (user: UserProfile, newStatus: ApprovalStatusType) => {
    try {
      const result = await updateUserApprovalStatus({ userId: user.id, newStatus, role: user.userRole || 'customer' });
      if (result.success) {
        toast({ title: "Success", description: `${user.name} status updated.` });
        onUserActioned();
      } else throw new Error(result.error);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    }
  };

  const handleViewDetails = (user: UserProfile) => {
    window.open(`/dashboard/users/${user.id}`, '_blank');
  };

  const openDeleteDialog = (user: UserProfile) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
        const result = await deleteUserAction({ userId: userToDelete.id, userRole: userToDelete.userRole || 'customer' });
        if (result.success) {
            toast({ title: "Deleted", description: `${userToDelete.name} has been removed.` });
            onUserActioned();
        } else throw new Error(result.error);
    } catch (error) {
        toast({ title: "Error", description: "Deletion failed.", variant: "destructive" });
    } finally {
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
    }
  };
  
  const getStatusColor = (status: ApprovalStatusType) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300';
      case 'Approved': return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300';
      case 'In Progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300';
      case 'On Hold': return 'bg-orange-100 text-orange-700 dark:bg-orange-700/30 dark:text-orange-300';
      case 'Rejected': return 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300';
    }
  };

  const renderActions = (user: UserProfile) => {
    switch (actionType) {
      case 'new-customer':
        return (
          <div className="flex items-center justify-center space-x-1.5">
            <Button variant="outline" size="sm" onClick={() => handleViewDetails(user)} className="px-2 py-1"><Eye className="h-3.5 w-3.5" /></Button>
            <Button variant="default" size="sm" onClick={() => openAssignDialog(user)} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1"><UserCheck className="h-3.5 w-3.5" /><span className="ml-1.5 hidden sm:inline">Approve</span></Button>
            <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus(user, 'Rejected')} className="px-2 py-1"><X className="h-3.5 w-3.5" /></Button>
          </div>
        );
      case 'existing-customer':
        return (
          <div className="flex items-center justify-center space-x-1.5">
             <Button variant="outline" size="sm" onClick={() => handleViewDetails(user)} className="px-2 py-1"><Eye className="h-3.5 w-3.5" /></Button>
            <Button variant="outline" size="sm" onClick={() => openAssignDialog(user)} className="px-2 py-1"><UserCog className="h-3.5 w-3.5" /><span className="ml-1.5 hidden sm:inline">Re-assign</span></Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="secondary" size="sm" className="w-[100px] justify-between px-2 py-1"><span>Status</span><ChevronDown className="h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleUpdateStatus(user, 'On Hold')}><Hourglass className="mr-2 h-4 w-4 text-yellow-500" />On Hold</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleUpdateStatus(user, 'Rejected')} className="text-destructive"><X className="mr-2 h-4 w-4" />Cancel</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      case 'new-trainer':
      case 'existing-trainer':
         return (
            <div className="flex items-center justify-center space-x-1.5">
              <Button variant="outline" size="sm" onClick={() => handleViewDetails(user)} className="px-2 py-1"><Eye className="h-3.5 w-3.5" /></Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="w-[130px] justify-between"><span>Status</span><ChevronDown className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleUpdateStatus(user, 'Approved')}><Check className="mr-2 h-4 w-4 text-green-500" />Approved</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleUpdateStatus(user, 'In Progress')}><Hourglass className="mr-2 h-4 w-4 text-blue-500" />In Progress</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleUpdateStatus(user, 'Rejected')}><X className="mr-2 h-4 w-4 text-red-500" />Rejected</DropdownMenuItem>
                   <Separator className="my-1" />
                   <DropdownMenuItem onClick={() => openDeleteDialog(user)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
         );
      case 'interested-customer':
        return (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleViewDetails(user)}><Eye className="mr-1 h-3 w-3"/>Details</Button>
            <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(user)}><Trash2 className="mr-1 h-3 w-3"/>Delete</Button>
          </div>
        );
      default: return null;
    }
  };

  return (
    <>
      <Card className="shadow-lg border border-primary flex flex-col">
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
                  <TableHead><AtSign className="inline-block mr-2 h-4 w-4" />Email</TableHead>
                  <TableHead><Phone className="inline-block mr-2 h-4 w-4" />Phone</TableHead>
                  {actionType !== 'interested-customer' && (
                    <>
                    <TableHead><MapPin className="inline-block mr-2 h-4 w-4" />Location</TableHead>
                    <TableHead><FileText className="inline-block mr-2 h-4 w-4" />Plan</TableHead>
                    </>
                  )}
                  <TableHead><CalendarDays className="inline-block mr-2 h-4 w-4" />Registered</TableHead>
                  {actionType !== 'interested-customer' && <TableHead><Hourglass className="inline-block mr-2 h-4 w-4" />Status</TableHead>}
                  <TableHead className="text-center"><Settings2 className="inline-block mr-2 h-4 w-4" />Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    Array(ITEMS_PER_PAGE).fill(0).map((_, i) => (
                        <TableRow key={i}><TableCell colSpan={10}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                    ))
                ) : paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{user.uniqueId}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{user.contact}</TableCell>
                        <TableCell>{user.phone || 'N/A'}</TableCell>
                        {actionType !== 'interested-customer' && (
                            <>
                                <TableCell>{user.location || 'N/A'}</TableCell>
                                <TableCell>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    user.subscriptionPlan === 'Premium' ? 'bg-primary/20 text-primary' :
                                    user.subscriptionPlan === 'Gold' ? 'bg-accent/20 text-accent' :
                                    'bg-muted text-muted-foreground'
                                }`}>
                                    {user.subscriptionPlan}
                                </span>
                                </TableCell>
                            </>
                        )}
                        <TableCell>{safeFormatDate(user.registrationTimestamp)}</TableCell>
                        {actionType !== 'interested-customer' && (
                            <TableCell>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.approvalStatus as ApprovalStatusType)}`}>
                                {user.approvalStatus}
                            </span>
                            </TableCell>
                        )}
                        <TableCell>{renderActions(user)}</TableCell>
                      </TableRow>
                    )
                  )
                ) : (
                  <TableRow><TableCell colSpan={10} className="h-24 text-center">No records found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {users.length > 0 && !isLoading && (
          <CardFooter className="flex items-center justify-between pt-4 border-t">
            <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>Next</Button>
            </div>
          </CardFooter>
        )}
      </Card>
      
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Trainer to {selectedUserForAssignment?.name}</DialogTitle>
            <DialogDescription>Select an approved trainer from the list below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label>Location</Label>
                      <Select onValueChange={(v) => setAssignFilters(p => ({...p, location: v === 'all' ? undefined : v}))}>
                          <SelectTrigger><SelectValue placeholder="All Locations" /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">All Locations</SelectItem>
                              {Locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select onValueChange={(v) => setAssignFilters(p => ({...p, gender: v === 'all' ? undefined : v}))}>
                          <SelectTrigger><SelectValue placeholder="Any Gender" /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">Any Gender</SelectItem>
                              {GenderOptions.filter(o => o === 'Male' || o === 'Female').map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  </div>
              </div>
              <div className="space-y-2">
                  <Label>Available Trainers</Label>
                  <Select onValueChange={setSelectedTrainerId} disabled={loadingTrainers}>
                      <SelectTrigger><SelectValue placeholder={loadingTrainers ? "Loading..." : "Select trainer"} /></SelectTrigger>
                      <SelectContent>
                          {availableTrainers.map(t => <SelectItem key={t.id} value={t.id}>{t.name} ({t.location})</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmAssignment} disabled={!selectedTrainerId || isAssigning}>
              {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanent Deletion</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete {userToDelete?.name}?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
