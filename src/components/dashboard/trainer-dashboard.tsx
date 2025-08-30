"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Users, BookOpen, Star, Clock, CheckCircle, XCircle, AlertCircle, Hourglass } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { listenToUser, listenToTrainerStudents } from '@/lib/mock-data';
import type { UserProfile, Feedback, RescheduleRequest } from '@/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Booking {
    id: string;
    studentName: string;
    studentEmail: string;
    courseType: string;
    scheduledDate: Date;
    status: 'scheduled' | 'completed' | 'cancelled';
    duration: number;
    notes?: string;
}

const TrainerDashboard = () => {
    const { user, loading: authLoading } = useAuth();
    const [trainerProfile, setTrainerProfile] = useState<UserProfile | null>(null);
    const [students, setStudents] = useState<UserProfile[]>([]);
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [rescheduleRequests, setRescheduleRequests] = useState<RescheduleRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.id) {
            if (!authLoading) setLoading(false);
            return;
        }

        // Only listen to the trainer's own profile initially
        const unsubscribeTrainer = listenToUser(user.id, (profile) => {
            if (profile) {
                setTrainerProfile(profile);
                // If the trainer is approved, then we can fetch the rest of the data.
                if (profile.approvalStatus === 'Approved') {
                    // Pass the profile to prevent race conditions
                    listenToTrainerStudents(profile.id, ({ students, feedback, rescheduleRequests }) => {
                        setStudents(students);
                        setFeedback(feedback);
                        setRescheduleRequests(rescheduleRequests);
                        setLoading(false); // Stop loading only after all data is fetched
                    });
                } else {
                    // If not approved, we don't need other data, so stop loading.
                    setLoading(false);
                }
            } else {
                setError("Trainer profile not found. Please complete your trainer registration.");
                setLoading(false);
            }
        }, 'trainers'); // Specify the collection

        return () => unsubscribeTrainer();
    }, [user, authLoading]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Approved':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'Rejected':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'In Progress':
                return <Hourglass className="h-4 w-4 text-blue-500" />;
            case 'Pending':
            default:
                return <Clock className="h-4 w-4 text-yellow-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700';
            case 'Rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-700';
            case 'In Progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700';
            case 'Pending':
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
                    <Button onClick={() => window.location.reload()}>
                        Try Again
                    </Button>
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
                    <p className="text-muted-foreground mb-4">
                        We couldn't find your trainer profile. Please complete your registration.
                    </p>
                    <Button asChild>
                        <Link href="/register">Complete Registration</Link>
                    </Button>
                </Card>
            </div>
        );
    }

    // If trainer is not approved, only show status card
    if (trainerProfile.approvalStatus !== 'Approved') {
        return (
            <div className="container mx-auto max-w-2xl p-4 py-8 sm:p-6 lg:p-8 flex items-center justify-center min-h-[calc(100vh-200px)]">
                <Card className="w-full shadow-xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex items-center justify-center rounded-full bg-primary/10 p-4 w-fit">
                            {getStatusIcon(trainerProfile.approvalStatus)}
                        </div>
                        <CardTitle className="font-headline text-2xl font-bold">
                            Welcome, {trainerProfile.name}!
                        </CardTitle>
                        <CardDescription className="text-lg mt-4">
                           <div className="flex items-center justify-center gap-2">
                                <span>Verification Status:</span>
                                <Badge variant="outline" className={cn("text-base", getStatusColor(trainerProfile.approvalStatus))}>
                                    {trainerProfile.approvalStatus}
                                </Badge>
                            </div>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                       <p className="text-muted-foreground max-w-md mx-auto">
                            {trainerProfile.approvalStatus === 'Pending' && "Your application is pending review. We'll notify you once it's processed."}
                            {trainerProfile.approvalStatus === 'In Progress' && "Your application is currently under review. This usually takes 2-3 business days."}
                            {trainerProfile.approvalStatus === 'Rejected' && "Unfortunately, your application was not approved. Please contact support for more information."}
                       </p>
                         <div className="pt-6">
                            <Button variant="outline" asChild>
                                <Link href="/dashboard/profile">View/Edit My Profile</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Full dashboard for approved trainers
    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Trainer Dashboard</h1>
                    <p className="text-gray-600">Welcome back, {trainerProfile.name}</p>
                </div>
                <div className="flex items-center gap-4 mt-4 md:mt-0">
                    <Badge className={getStatusColor(trainerProfile.approvalStatus)}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approved Trainer
                    </Badge>
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={trainerProfile.photoURL} />
                        <AvatarFallback>{trainerProfile.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{students.length}</div>
                        <p className="text-xs text-muted-foreground">All assigned students</p>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming Lessons</CardTitle>
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{students.filter(s => s.upcomingLesson).length}</div>
                        <p className="text-xs text-muted-foreground">Active scheduled lessons</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {feedback.length > 0 ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1) : 'N/A'}
                        </div>
                        <p className="text-xs text-muted-foreground">From {feedback.length} reviews</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Experience</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{trainerProfile.expertise || 'N/A'}</div>
                        <p className="text-xs text-muted-foreground">Years</p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>My Students</CardTitle>
                <CardDescription>An overview of your assigned students and their progress.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Upcoming Lesson</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.length > 0 ? students.map(student => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.phone}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{student.subscriptionPlan}</Badge>
                        </TableCell>
                        <TableCell>{student.upcomingLesson || 'Not Scheduled'}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          No students assigned yet.
                        </TableCell>
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
