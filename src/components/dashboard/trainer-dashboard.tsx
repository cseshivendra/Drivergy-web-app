
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Users, Star, CheckCircle, XCircle, AlertCircle, Hourglass, Check, X, Phone, MapPin, Car } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { fetchTrainerDashboardData } from '@/lib/server-data';
import { updateUserAttendance } from '@/lib/server-actions';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile, Feedback } from '@/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const RupeeIconSvg = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M6 3h12" />
    <path d="M6 8h12" />
    <path d="M6 13h12" />
    <path d="M6 18h12" />
    <path d="M8.67 21L7 3" />
  </svg>
);


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
        setIsSubmitting(true);
        try {
            const data = await fetchTrainerDashboardData(user.id);
            if (data.trainerProfile) {
                setTrainerProfile(data.trainerProfile);
                setStudents(data.students);
                setFeedback(data.feedback);
            } else {
                setError("Trainer profile not found after refetch.");
            }
        } catch (e) {
            setError("Failed to refetch data.");
        } finally {
            setIsSubmitting(false);
        }
    }, [user?.id]);
    
    useEffect(() => {
        const fetchInitialData = async () => {
            if (authLoading) return; // Wait for authentication to settle
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
            await refetchData(); // Refetch data to update the UI
        } else {
            toast({ title: "Error", description: "Failed to update attendance.", variant: "destructive" });
        }
        setIsSubmitting(false);
    };

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

    if (loading || authLoading) {
        return (
            <div className="container mx-auto p-4 py-8 space-y-8">
              <Skeleton className="h-10 w-1/2 mb-8" />
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
        );
    }

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
    
    if (!trainerProfile) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <Card className="w-full max-w-md p-6 text-center">
                    <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Profile Not Found</h3>
                    <p className="text-muted-foreground mb-4">We couldn't find your trainer profile. Please complete your registration.</p>
                    <Button asChild><Link href="/register?role=trainer">Complete Registration</Link></Button>
                </Card>
            </div>
        );
    }

    if (trainerProfile.approvalStatus !== 'Approved') {
       return (
            <div className="flex flex-col items-center justify-center flex-grow p-4 min-h-[calc(100vh-200px)]">
                <Card className="w-full max-w-lg text-center shadow-2xl p-8">
                    <div className="mx-auto mb-6 flex items-center justify-center rounded-full bg-primary/10 p-4 w-fit">
                        {getStatusIcon(trainerProfile.approvalStatus)}
                    </div>
                    <CardTitle className="font-headline text-3xl font-bold mb-2">Welcome, {trainerProfile.name}!</CardTitle>
                    <CardDescription className="text-lg mt-4 mb-6">
                        <div className="flex items-center justify-center gap-2">
                            <span>Verification Status:</span>
                            <Badge variant="outline" className={cn("text-base px-4 py-1", getStatusColor(trainerProfile.approvalStatus))}>
                                {trainerProfile.approvalStatus}
                            </Badge>
                        </div>
                    </CardDescription>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        {trainerProfile.approvalStatus === 'Pending' && "Your profile is being verified. You will be able to access your dashboard once approved."}
                        {trainerProfile.approvalStatus === 'In Progress' && "Your application is under review. This usually takes 2-3 business days."}
                        {trainerProfile.approvalStatus === 'Rejected' && "Unfortunately, your application was not approved. Please contact support for more information."}
                    </p>
                </Card>
            </div>
        );
    }

    const upcomingLessonsCount = students.filter(s => s.upcomingLesson).length;
    const avgRating = feedback.length > 0 ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1) : 'N/A';
    const totalEarnings = students.reduce((acc, student) => acc + (student.completedLessons || 0) * 300, 0);

    const newStudentRequests = students.filter(s => !s.completedLessons || s.completedLessons === 0);
    const existingStudents = students.filter(s => (s.completedLessons || 0) > 0);
    
    return (
        <div className="container mx-auto max-w-7xl p-4 py-8 sm:p-6 lg:p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center">
                        Welcome, {trainerProfile.name}!
                        <Badge variant="outline" className={cn("ml-3", getStatusColor(trainerProfile.approvalStatus))}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Verified
                        </Badge>
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage your students and track your progress.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-l-4 border-primary"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">TOTAL STUDENTS</CardTitle><Users className="h-5 w-5 text-muted-foreground" /></CardHeader><CardContent><div className="text-3xl font-bold">{students.length}</div><p className="text-xs text-muted-foreground">All students assigned to you</p></CardContent></Card>
                <Card className="border-l-4 border-primary"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">TOTAL EARNINGS</CardTitle><RupeeIconSvg className="h-5 w-5 text-muted-foreground" /></CardHeader><CardContent><div className="text-3xl font-bold">₹{totalEarnings.toLocaleString('en-IN')}</div><p className="text-xs text-muted-foreground">Your gross earnings</p></CardContent></Card>
                <Card className="border-l-4 border-primary"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">UPCOMING LESSONS</CardTitle><CalendarDays className="h-5 w-5 text-muted-foreground" /></CardHeader><CardContent><div className="text-3xl font-bold">{upcomingLessonsCount}</div><p className="text-xs text-muted-foreground">Confirmed upcoming sessions</p></CardContent></Card>
                <Card className="border-l-4 border-primary"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">YOUR RATING</CardTitle><Star className="h-5 w-5 text-muted-foreground" /></CardHeader><CardContent><div className="text-3xl font-bold">{avgRating}</div><p className="text-xs text-muted-foreground">Average student rating</p></CardContent></Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/> New Student Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Contact No.</TableHead>
                      <TableHead>Pickup Location</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {newStudentRequests.length > 0 ? newStudentRequests.map(student => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.phone}</TableCell>
                        <TableCell>{student.location}</TableCell>
                        <TableCell>{student.vehiclePreference}</TableCell>
                        <TableCell className="text-center">
                            <div className="flex gap-2 justify-center">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAttendance(student.id, 'Present')} disabled={isSubmitting}><Check className="h-4 w-4 mr-1" /> Accept</Button>
                              <Button size="sm" variant="destructive" onClick={() => handleAttendance(student.id, 'Absent')} disabled={isSubmitting}><X className="h-4 w-4 mr-1" /> Reject</Button>
                            </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No new student requests.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5" /> My Students</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Completed/Total</TableHead>
                      <TableHead className="text-center">Mark Attendance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {existingStudents.length > 0 ? existingStudents.map(student => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell><Badge variant="outline">{student.subscriptionPlan}</Badge></TableCell>
                        <TableCell>{student.completedLessons || 0} / {student.totalLessons || 0}</TableCell>
                        <TableCell className="text-center">
                          {student.upcomingLesson ? (
                            <div className="flex gap-2 justify-center">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAttendance(student.id, 'Present')} disabled={isSubmitting}><Check className="h-4 w-4 mr-1" /> Present</Button>
                              <Button size="sm" variant="destructive" onClick={() => handleAttendance(student.id, 'Absent')} disabled={isSubmitting}><X className="h-4 w-4 mr-1" /> Absent</Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No upcoming lesson</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No existing students found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

        </div>
    );
};

export default TrainerDashboard;

    