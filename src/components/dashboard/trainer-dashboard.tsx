
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { 
    CalendarDays, Users, Star, CheckCircle, XCircle, AlertCircle, Hourglass, Check, X, Phone, MapPin, Car, IndianRupee, BarChart, User as UserIcon, MessageSquare, ShieldCheck
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { fetchTrainerDashboardData } from '@/lib/server-data';
import { updateUserAttendance, updateUserApprovalStatus, unassignTrainerFromCustomer } from '@/lib/server-actions';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile, Feedback } from '@/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SummaryCard from './summary-card';

const TrainerDashboard = () => {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [trainerProfile, setTrainerProfile] = useState<UserProfile | null>(null);
    const [students, setStudents] = useState<UserProfile[]>([]);
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const refetchData = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const data = await fetchTrainerDashboardData(user.id);
            setTrainerProfile(data.trainerProfile);
            setStudents(data.students);
            setFeedback(data.feedback);
        } catch (e) {
            setError("Failed to refetch data.");
        } finally {
            setLoading(false);
        }
    }, [user?.id]);
    
    useEffect(() => {
        const fetchInitialData = async () => {
            if (authLoading) return;
            if (!user?.id) {
                setLoading(false);
                setError("You are not logged in or user ID is missing.");
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const data = await fetchTrainerDashboardData(user.id);
                if (data.trainerProfile) {
                    setTrainerProfile(data.trainerProfile);
                    setStudents(data.students);
                    setFeedback(data.feedback);
                } else {
                    setError("Trainer profile not found. Please complete your registration.");
                }
            } catch (e) {
                console.error("Failed to fetch initial trainer data:", e);
                setError("Could not fetch dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [user, authLoading]);
    
    const handleAttendance = async (studentId: string, status: 'Present' | 'Absent') => {
        setIsSubmitting(true);
        const success = await updateUserAttendance(studentId, status);
        if (success) {
            toast({ title: "Attendance Marked", description: `Student marked as ${status.toLowerCase()}.` });
            await refetchData();
        } else {
            toast({ title: "Error", description: "Failed to update attendance.", variant: "destructive" });
        }
        setIsSubmitting(false);
    };
    
    const handleAcceptRequest = async (studentId: string) => {
        setIsSubmitting(true);
        const result = await updateUserApprovalStatus({ userId: studentId, newStatus: 'Approved', role: 'customer' });
        if (result.success) {
            toast({ title: "Student Accepted", description: "The student has been added to your list." });
            await refetchData();
        } else {
            toast({ title: "Error", description: result.error || "Failed to accept student.", variant: "destructive" });
        }
        setIsSubmitting(false);
    };

    const handleRejectRequest = async (studentId: string) => {
        if (!user) return;
        setIsSubmitting(true);
        const success = await unassignTrainerFromCustomer(studentId, user.id);
        if (success) {
            toast({ title: "Student Rejected", description: "The student has been removed from your requests." });
            await refetchData();
        } else {
            toast({ title: "Error", description: "Failed to reject student.", variant: "destructive" });
        }
        setIsSubmitting(false);
    };

    // UI state helper functions
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Approved': return <CheckCircle className="h-10 w-10 text-green-500" />;
            case 'Rejected': return <XCircle className="h-10 w-10 text-red-500" />;
            case 'In Progress': return <Hourglass className="h-10 w-10 text-blue-500" />;
            default: return <Hourglass className="h-10 w-10 text-yellow-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700';
            case 'Rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-700';
            case 'In Progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700';
            default: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700';
        }
    };

    // Loading State
    if (loading || authLoading) {
        return (
            <div className="container mx-auto p-4 py-8 space-y-8">
              <Skeleton className="h-10 w-1/2 mb-8" />
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <Card className="w-full max-w-md p-6 text-center">
                    <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-destructive mb-2">Error</h3>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <Button onClick={() => window.location.reload()}>Try Again</Button>
                </Card>
            </div>
        );
    }
    
    // Unverified State
    if (!trainerProfile || trainerProfile.approvalStatus !== 'Approved') {
       return (
            <div className="flex flex-col items-center justify-center flex-grow p-4 min-h-[calc(100vh-200px)]">
                <Card className="w-full max-w-lg text-center shadow-2xl p-8">
                    <div className="mx-auto mb-6 flex items-center justify-center rounded-full bg-primary/10 p-4 w-fit">
                        {getStatusIcon(trainerProfile?.approvalStatus || 'Pending')}
                    </div>
                    <CardTitle className="font-headline text-3xl font-bold mb-2">Welcome, {trainerProfile?.name || 'Trainer'}!</CardTitle>
                    <CardDescription className="text-lg mt-4 mb-6">
                        <div className="flex items-center justify-center gap-2">
                            <span>Verification Status:</span>
                            <Badge variant="outline" className={cn("text-base px-4 py-1", getStatusColor(trainerProfile?.approvalStatus || 'Pending'))}>
                                {trainerProfile?.approvalStatus || 'Pending'}
                            </Badge>
                        </div>
                    </CardDescription>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        {trainerProfile?.approvalStatus === 'Pending' && "Your profile is being verified. You will be able to access your dashboard once approved."}
                        {trainerProfile?.approvalStatus === 'In Progress' && "Your application is under review. This usually takes 2-3 business days."}
                        {trainerProfile?.approvalStatus === 'Rejected' && "Unfortunately, your application was not approved. Please contact support for more information."}
                        {!trainerProfile && "We couldn't find your trainer profile. Please complete your registration."}
                    </p>
                    {!trainerProfile && <Button asChild className="mt-4"><Link href="/register?role=trainer">Complete Registration</Link></Button>}
                </Card>
            </div>
        );
    }

    // Data for dashboard
    const upcomingLessonsCount = students.filter(s => s.upcomingLesson).length;
    const avgRating = feedback.length > 0 ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1) : 'N/A';
    const totalEarnings = students.reduce((acc, student) => acc + (student.completedLessons || 0) * 300, 0);

    const newStudentRequests = students.filter(s => s.assignedTrainerId === user.id && s.approvalStatus === 'In Progress');
    const existingStudents = students.filter(s => s.assignedTrainerId === user.id && s.approvalStatus === 'Approved');
    
    return (
        <div className="container mx-auto max-w-7xl p-4 py-8 sm:p-6 lg:p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                        Welcome, {trainerProfile.name}!
                        {trainerProfile.approvalStatus === 'Approved' && (
                            <ShieldCheck className="h-7 w-7 text-green-500" />
                        )}
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage your students and track your progress.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryCard title="Total Students" value={existingStudents.length} icon={Users} description="All active students assigned to you" />
                <SummaryCard title="Total Earnings" value={`₹${totalEarnings.toLocaleString('en-IN')}`} icon={IndianRupee} description="Your gross earnings" />
                <SummaryCard title="Upcoming Lessons" value={upcomingLessonsCount} icon={CalendarDays} description="Confirmed upcoming sessions" />
                <SummaryCard title="Your Rating" value={avgRating} icon={Star} description="Average student rating" />
            </div>
            
            <Tabs defaultValue="new-requests" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="new-requests">New Requests ({newStudentRequests.length})</TabsTrigger>
                    <TabsTrigger value="my-students">My Students ({existingStudents.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="new-requests" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {newStudentRequests.length > 0 ? newStudentRequests.map(student => (
                            <Card key={student.id} className="flex flex-col shadow-md hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3"><UserIcon className="h-5 w-5 text-primary"/>{student.name}</CardTitle>
                                    <CardDescription>{student.uniqueId}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-3 text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4"/><span>{student.phone}</span></div>
                                    <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4"/><span>{student.location}</span></div>
                                    <div className="flex items-center gap-2 text-muted-foreground"><Car className="h-4 w-4"/><span>{student.vehiclePreference}</span></div>
                                </CardContent>
                                <CardFooter className="grid grid-cols-2 gap-2">
                                     <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAcceptRequest(student.id)} disabled={isSubmitting}><Check className="h-4 w-4 mr-1" /> Accept</Button>
                                     <Button size="sm" variant="destructive" onClick={() => handleRejectRequest(student.id)} disabled={isSubmitting}><X className="h-4 w-4 mr-1" /> Reject</Button>
                                </CardFooter>
                            </Card>
                        )) : (
                           <div className="col-span-full text-center py-12">
                                <CheckCircle className="mx-auto h-12 w-12 text-green-500 opacity-70" />
                                <p className="mt-4 text-lg font-medium text-muted-foreground">All caught up!</p>
                                <p className="text-sm text-muted-foreground">You have no new student requests.</p>
                           </div>
                        )}
                    </div>
                </TabsContent>
                <TabsContent value="my-students" className="mt-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {existingStudents.length > 0 ? existingStudents.map(student => (
                            <Card key={student.id} className="flex flex-col shadow-md hover:shadow-lg transition-shadow">
                                <CardHeader>
                                     <CardTitle className="flex items-center gap-3"><UserIcon className="h-5 w-5 text-primary"/>{student.name}</CardTitle>
                                    <Badge variant="outline" className="w-fit">{student.subscriptionPlan}</Badge>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-4">
                                     <div>
                                        <p className="text-sm font-medium text-muted-foreground">Progress</p>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 flex-grow bg-muted rounded-full">
                                                <div className="h-2 bg-primary rounded-full" style={{width: `${((student.completedLessons || 0) / (student.totalLessons || 1)) * 100}%`}}></div>
                                            </div>
                                            <span className="text-xs font-semibold">{student.completedLessons || 0} / {student.totalLessons || 0}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-4 w-4"/><span>{student.phone}</span></div>
                                    
                                     {student.upcomingLesson ? (
                                        <div className="p-2 bg-muted/50 rounded-md text-center">
                                            <p className="text-xs text-muted-foreground">Next Lesson</p>
                                            <p className="font-semibold text-foreground">{student.upcomingLesson}</p>
                                        </div>
                                      ) : (
                                        <div className="p-2 bg-yellow-100/50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-md text-center text-xs font-semibold">
                                            No upcoming lesson scheduled
                                        </div>
                                      )}

                                </CardContent>
                                <CardFooter className="grid grid-cols-1 gap-2">
                                    {student.upcomingLesson ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAttendance(student.id, 'Present')} disabled={isSubmitting}><Check className="h-4 w-4 mr-1" /> Present</Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleAttendance(student.id, 'Absent')} disabled={isSubmitting}><X className="h-4 w-4 mr-1" /> Absent</Button>
                                        </div>
                                    ) : null }
                                     <Button asChild variant="outline" size="sm">
                                        <Link href={`/dashboard/student-progress/${student.id}`}>
                                            <BarChart className="h-4 w-4 mr-1" />
                                            Manage Progress
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        )) : (
                           <div className="col-span-full text-center py-12">
                                <Users className="mx-auto h-12 w-12 text-primary opacity-70" />
                                <p className="mt-4 text-lg font-medium text-muted-foreground">No active students.</p>
                                <p className="text-sm text-muted-foreground">Accepted students will appear here.</p>
                           </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default TrainerDashboard;
