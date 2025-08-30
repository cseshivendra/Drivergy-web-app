"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, Users, BookOpen, Star, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { doc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface TrainerProfile {
    id: string;
    name: string;
    email: string;
    phone?: string;
    specializations: string[];
    experience: number;
    rating: number;
    totalStudents: number;
    approvalStatus: 'Pending' | 'Under Review' | 'Approved' | 'Rejected';
    profileImage?: string;
    bio?: string;
    certifications: string[];
    availability: {
        monday: boolean;
        tuesday: boolean;
        wednesday: boolean;
        thursday: boolean;
        friday: boolean;
        saturday: boolean;
        sunday: boolean;
    };
}

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
    const { user } = useAuth();
    const [trainerProfile, setTrainerProfile] = useState<TrainerProfile | null>(null);
    const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
    const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        // Set up real-time listener for trainer profile
        const trainerDocRef = doc(db, 'trainers', user.uid);

        const unsubscribeTrainer = onSnapshot(
            trainerDocRef,
            (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const profileData = {
                        id: docSnapshot.id,
                        ...docSnapshot.data()
                    } as TrainerProfile;
                    setTrainerProfile(profileData);
                    setLoading(false);

                    // Only load additional data if trainer is approved
                    if (profileData.approvalStatus === 'Approved') {
                        loadBookingsData();
                    }
                } else {
                    // Trainer profile doesn't exist - redirect to profile creation
                    setError("Trainer profile not found. Please complete your trainer registration.");
                    setLoading(false);
                }
            },
            (error) => {
                console.error('Error loading trainer profile:', error);
                setError("Failed to load trainer profile. Please try again.");
                setLoading(false);
            }
        );

        return () => unsubscribeTrainer();
    }, [user]);

    const loadBookingsData = () => {
        if (!user?.uid) return;

        // Load upcoming bookings
        const upcomingQuery = query(
            collection(db, 'bookings'),
            where('trainerId', '==', user.uid),
            where('status', '==', 'scheduled'),
            where('scheduledDate', '>=', new Date()),
            orderBy('scheduledDate', 'asc')
        );

        const unsubscribeUpcoming = onSnapshot(upcomingQuery, (snapshot) => {
            const bookings: Booking[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                bookings.push({
                    id: doc.id,
                    ...data,
                    scheduledDate: data.scheduledDate.toDate(),
                } as Booking);
            });
            setUpcomingBookings(bookings);
        });

        // Load recent bookings
        const recentQuery = query(
            collection(db, 'bookings'),
            where('trainerId', '==', user.uid),
            orderBy('scheduledDate', 'desc')
        );

        const unsubscribeRecent = onSnapshot(recentQuery, (snapshot) => {
            const bookings: Booking[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                bookings.push({
                    id: doc.id,
                    ...data,
                    scheduledDate: data.scheduledDate.toDate(),
                } as Booking);
            });
            setRecentBookings(bookings.slice(0, 5)); // Get last 5 bookings
        });

        return () => {
            unsubscribeUpcoming();
            unsubscribeRecent();
        };
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Approved':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'Rejected':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'Under Review':
                return <Clock className="h-4 w-4 text-blue-500" />;
            case 'Pending':
            default:
                return <AlertCircle className="h-4 w-4 text-yellow-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'Rejected':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'Under Review':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Pending':
            default:
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
                            <p className="text-gray-600 mb-4">{error}</p>
                            <Button onClick={() => window.location.reload()}>
                                Try Again
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!trainerProfile) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Not Found</h3>
                            <p className="text-gray-600 mb-4">
                                We couldn't find your trainer profile. Please complete your registration.
                            </p>
                            <Button onClick={() => window.location.href = '/app/profile'}>
                                Complete Profile
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // If trainer is not approved, only show status card
    if (trainerProfile.approvalStatus !== 'Approved') {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Trainer Dashboard</h1>
                    <p className="text-gray-600">Welcome, {trainerProfile.name}</p>
                </div>

                <Card className="w-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {getStatusIcon(trainerProfile.approvalStatus)}
                            Account Status: {trainerProfile.approvalStatus}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Badge
                                variant="secondary"
                                className={getStatusColor(trainerProfile.approvalStatus)}
                            >
                                {trainerProfile.approvalStatus}
                            </Badge>

                            <div className="text-gray-600">
                                {trainerProfile.approvalStatus === 'Pending' && (
                                    <p>Your trainer application is pending review. We'll notify you once it's processed.</p>
                                )}
                                {trainerProfile.approvalStatus === 'Under Review' && (
                                    <p>Your application is currently under review. This usually takes 2-3 business days.</p>
                                )}
                                {trainerProfile.approvalStatus === 'Rejected' && (
                                    <p>Your application was not approved. Please contact support for more information.</p>
                                )}
                            </div>

                            <div className="pt-4">
                                <Button variant="outline" onClick={() => window.location.href = '/app/profile'}>
                                    Edit Profile
                                </Button>
                            </div>
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
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                        ✓ Approved Trainer
                    </Badge>
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={trainerProfile.profileImage} />
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
                        <div className="text-2xl font-bold">{trainerProfile.totalStudents}</div>
                        <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{upcomingBookings.length}</div>
                        <p className="text-xs text-muted-foreground">Next 7 days</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{trainerProfile.rating.toFixed(1)}</div>
                        <p className="text-xs text-muted-foreground">Out of 5.0</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Experience</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{trainerProfile.experience}</div>
                        <p className="text-xs text-muted-foreground">Years</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="bookings">Bookings</TabsTrigger>
                    <TabsTrigger value="students">Students</TabsTrigger>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Upcoming Sessions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Upcoming Sessions</CardTitle>
                                <CardDescription>Your next scheduled lessons</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {upcomingBookings.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">No upcoming sessions</p>
                                ) : (
                                    <div className="space-y-4">
                                        {upcomingBookings.slice(0, 3).map((booking) => (
                                            <div key={booking.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <h4 className="font-medium">{booking.studentName}</h4>
                                                    <p className="text-sm text-gray-600">{booking.courseType}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {booking.scheduledDate.toLocaleDateString()} at {booking.scheduledDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </p>
                                                </div>
                                                <Badge variant="outline">{booking.duration}h</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Activity */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                                <CardDescription>Latest completed sessions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {recentBookings.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">No recent activity</p>
                                ) : (
                                    <div className="space-y-4">
                                        {recentBookings.slice(0, 3).map((booking) => (
                                            <div key={booking.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <h4 className="font-medium">{booking.studentName}</h4>
                                                    <p className="text-sm text-gray-600">{booking.courseType}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {booking.scheduledDate.toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant={booking.status === 'completed' ? 'default' : booking.status === 'cancelled' ? 'destructive' : 'secondary'}
                                                >
                                                    {booking.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="bookings">
                    <Card>
                        <CardHeader>
                            <CardTitle>All Bookings</CardTitle>
                            <CardDescription>Manage your scheduled and completed sessions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[...upcomingBookings, ...recentBookings].map((booking) => (
                                    <div key={booking.id} className="flex justify-between items-center p-4 border rounded-lg">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4">
                                                <div>
                                                    <h4 className="font-medium">{booking.studentName}</h4>
                                                    <p className="text-sm text-gray-600">{booking.studentEmail}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{booking.courseType}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {booking.scheduledDate.toLocaleDateString()} at {booking.scheduledDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </p>
                                                </div>
                                            </div>
                                            {booking.notes && (
                                                <p className="text-sm text-gray-600 mt-2">{booking.notes}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{booking.duration}h</Badge>
                                            <Badge
                                                variant={booking.status === 'completed' ? 'default' : booking.status === 'cancelled' ? 'destructive' : 'secondary'}
                                            >
                                                {booking.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="students">
                    <Card>
                        <CardHeader>
                            <CardTitle>My Students</CardTitle>
                            <CardDescription>Students you've taught</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-center text-gray-500 py-8">
                                Student management features coming soon
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Trainer Profile</CardTitle>
                            <CardDescription>Your professional information</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src={trainerProfile.profileImage} />
                                        <AvatarFallback>{trainerProfile.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="text-lg font-semibold">{trainerProfile.name}</h3>
                                        <p className="text-gray-600">{trainerProfile.email}</p>
                                        {trainerProfile.phone && (
                                            <p className="text-gray-600">{trainerProfile.phone}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-2">Specializations</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {trainerProfile.specializations.map((spec, index) => (
                                            <Badge key={index} variant="secondary">{spec}</Badge>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-2">Certifications</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {trainerProfile.certifications.map((cert, index) => (
                                            <Badge key={index} variant="outline">{cert}</Badge>
                                        ))}
                                    </div>
                                </div>

                                {trainerProfile.bio && (
                                    <div>
                                        <h4 className="font-medium mb-2">Bio</h4>
                                        <p className="text-gray-600">{trainerProfile.bio}</p>
                                    </div>
                                )}

                                <div className="pt-4">
                                    <Button onClick={() => window.location.href = '/app/profile'}>
                                        Edit Profile
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default TrainerDashboard;