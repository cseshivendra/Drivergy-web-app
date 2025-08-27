

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { listenToTrainerStudents, listenToUser } from '@/lib/mock-data';
import { updateUserAttendance, updateAssignmentStatusByTrainer } from '@/lib/server-actions';
import type { UserProfile, TrainerSummaryData, ApprovalStatusType, Feedback, RescheduleRequest } from '@/types';
import SummaryCard from '@/components/dashboard/summary-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Users, CalendarClock, Star, Check, X, MapPin, AlertCircle, Eye, User, Phone, ShieldCheck, Hourglass, BellRing, Car, Repeat } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '../ui/badge';
import type React from 'react';
import RescheduleRequestTable from './reschedule-request-table';


const RupeeIconSvg = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
    {...props}
  >
    <text
      x="50%"
      y="50%"
      dominantBaseline="middle"
      textAnchor="middle"
      fontSize="18"
      fontFamily="system-ui, sans-serif"
      fill="currentColor"
    >
      ₹
    </text>
  </svg>
);

const getStatusBadgeClass = (status: ApprovalStatusType): string => {
     switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700';
      case 'Approved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700';
      case 'Rejected': return 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300 border-red-200 dark:border-red-700';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
}

export default function TrainerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [summary, setSummary] = useState<TrainerSummaryData | null>(null);
  const [allStudents, setAllStudents] = useState<UserProfile[]>([]);
  const [rescheduleRequests, setRescheduleRequests] = useState<RescheduleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const handleDataUpdate = (data: {
    students: UserProfile[];
    feedback: Feedback[];
    rescheduleRequests: RescheduleRequest[];
  }) => {
    setAllStudents(data.students);
    setRescheduleRequests(data.rescheduleRequests);

    const approvedStudents = data.students.filter(s => s.approvalStatus === 'Approved');
    let avgRating = 0;
    if (data.feedback.length > 0) {
      const totalRating = data.feedback.reduce((acc, doc) => acc + doc.rating, 0);
      avgRating = parseFloat((totalRating / data.feedback.length).toFixed(1));
    }
    const summaryData: TrainerSummaryData = {
      totalStudents: approvedStudents.length,
      totalEarnings: approvedStudents.length * 2000, 
      upcomingLessons: data.students.filter(doc => doc.upcomingLesson).length,
      rating: avgRating,
      pendingRescheduleRequests: data.rescheduleRequests.filter(r => r.status === 'Pending').length,
    };
    setSummary(summaryData);
    setLoading(false);
  };
  
  const refetchData = () => {
      if (user?.id) {
          listenToTrainerStudents(user.id, handleDataUpdate);
      }
  }

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    // Use a real-time listener for the user's own profile
    const unsubProfile = listenToUser(user.id, (userProfile) => {
        if(userProfile) {
            setProfile(userProfile);
            // Decide what to do based on the approval status from the live data
            if (userProfile.approvalStatus === 'Approved') {
                setLoading(true); // Start loading dashboard data
                const unsubDashboard = listenToTrainerStudents(user.id, handleDataUpdate);
                return () => unsubDashboard(); // This cleanup is for the dashboard listener
            } else {
                setLoading(false); // Not approved, no need to load other data
            }
        } else {
             setProfile(null);
             setLoading(false);
        }
    });

    return () => unsubProfile(); // This is the primary cleanup for the profile listener
  }, [user?.id]);


  const handleAssignmentResponse = async (studentId: string, studentName: string, status: 'Approved' | 'Rejected') => {
    updateAssignmentStatusByTrainer(studentId, status);
    toast({ title: `Request ${status}`, description: `You have ${status.toLowerCase()} the request for ${studentName}.` });
  };

  const handleAttendance = async (studentId: string, studentName: string, status: 'Present' | 'Absent') => {
    updateUserAttendance(studentId, status);
    toast({ title: 'Attendance Marked', description: `${studentName} marked as ${status}.` });
  };
  
  const handleViewDetails = (student: UserProfile) => {
    window.open(`/dashboard/users/${student.id}`, '_blank');
    toast({ 
      title: "Opening Details",
      description: `Opening details for ${student.name} in a new tab.`,
    });
  };

  const approvedStudents = allStudents.filter(s => s.approvalStatus === 'Approved');
  const pendingAssignments = allStudents.filter(s => s.approvalStatus === 'In Progress');

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl p-4 py-8 sm:p-6 lg:p-8 space-y-8">
        <h1 className="font-headline text-3xl font-semibold tracking-tight text-foreground">
          Welcome, {user?.name}!
        </h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-[126px] w-full rounded-lg" />
            <Skeleton className="h-[126px] w-full rounded-lg" />
            <Skeleton className="h-[126px] w-full rounded-lg" />
            <Skeleton className="h-[126px] w-full rounded-lg" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (profile && profile.approvalStatus !== 'Approved') {
    return (
        <div className="container mx-auto max-w-4xl p-4 py-8 sm:p-6 lg:p-8 flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Card className="shadow-xl text-center p-8">
                <CardHeader>
                    <div className="mx-auto mb-4 flex items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 p-4 w-fit">
                        <Hourglass className="h-12 w-12 text-yellow-500" />
                    </div>
                    <CardTitle className="font-headline text-2xl font-bold">Welcome, {profile.name}!</CardTitle>
                    <CardDescription className="text-lg mt-4">
                        <div className="flex items-center justify-center gap-2">
                            <span>Verification Status:</span>
                            <Badge className={`text-base ${getStatusBadgeClass(profile.approvalStatus)}`}>
                                {profile.approvalStatus}
                            </Badge>
                        </div>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Your profile is currently being verified by our team. You will be able to access your full dashboard and see assigned students once your account is approved.
                        <br /><br />
                        Thank you for your patience.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-4 py-8 sm:p-6 lg:p-8 space-y-8">
      <header className="mb-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h1 className="font-headline text-3xl font-semibold tracking-tight text-foreground">
              Welcome, {user?.name}!
            </h1>
            <Badge className={`text-base ${getStatusBadgeClass(profile?.approvalStatus || 'Pending')}`}>
                <ShieldCheck className="mr-2 h-5 w-5"/>
                Verified
            </Badge>
        </div>
        <p className="text-muted-foreground mt-1">Manage your students and track your progress.</p>
      </header>

       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard title="Total Students" value={summary?.totalStudents ?? 0} icon={Users} description="All students assigned to you" />
          <SummaryCard title="Pending Reschedules" value={summary?.pendingRescheduleRequests ?? 0} icon={Repeat} description="Awaiting your approval" />
          <SummaryCard title="Upcoming Lessons" value={summary?.upcomingLessons ?? 0} icon={CalendarClock} description="Confirmed upcoming sessions" />
          <SummaryCard title="Your Rating" value={summary?.rating ?? 0} icon={Star} description="Average student rating" />
       </div>

      <Card className="shadow-lg border-primary">
          <CardHeader>
              <CardTitle className="font-headline text-2xl font-semibold flex items-center">
                <BellRing className="inline-block mr-3 h-6 w-6 align-middle" />
                New Student Requests
              </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Student Name</TableHead>
                          <TableHead><Phone className="inline-block mr-2 h-4 w-4" />Contact No.</TableHead>
                          <TableHead><MapPin className="inline-block mr-2 h-4 w-4" />Pickup Location</TableHead>
                          <TableHead><Car className="inline-block mr-2 h-4 w-4" />Vehicle</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {pendingAssignments.length > 0 ? pendingAssignments.map(student => (
                          <TableRow key={student.id}>
                              <TableCell className="font-medium">{student.name}</TableCell>
                              <TableCell>{student.phone || 'N/A'}</TableCell>
                              <TableCell className="min-w-[200px]">{`${student.flatHouseNumber}, ${student.street}, ${student.district}`}</TableCell>
                              <TableCell>{student.vehicleInfo || 'N/A'}</TableCell>
                              <TableCell className="text-center">
                                  <div className="flex items-center justify-center space-x-1.5">
                                      <Button 
                                        variant="default" size="sm" 
                                        onClick={() => handleAssignmentResponse(student.id, student.name, 'Approved')}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        <Check className="h-4 w-4" />
                                        <span className="ml-1.5 hidden sm:inline">Accept</span>
                                      </Button>
                                      <Button 
                                        variant="destructive" size="sm" 
                                        onClick={() => handleAssignmentResponse(student.id, student.name, 'Rejected')}
                                      >
                                        <X className="h-4 w-4" />
                                        <span className="ml-1.5 hidden sm:inline">Reject</span>
                                      </Button>
                                  </div>
                              </TableCell>
                          </TableRow>
                      )) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                    <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
                                    <p className="text-lg">No new student requests.</p>
                                    <p className="text-sm">Check back later for new assignments from the admin.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
      
      <RescheduleRequestTable
        title={<><Repeat className="inline-block mr-3 h-6 w-6 align-middle" />Lesson Reschedule Requests</>}
        requests={rescheduleRequests}
        isLoading={loading}
        onActioned={refetchData}
      />


      <Card className="shadow-lg border-primary">
          <CardHeader>
              <CardTitle className="font-headline text-2xl font-semibold flex items-center">
                <User className="inline-block mr-3 h-6 w-6 align-middle" />
                My Students
              </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Student Name</TableHead>
                          <TableHead><Phone className="inline-block mr-2 h-4 w-4" />Contact No.</TableHead>
                          <TableHead><CalendarClock className="inline-block mr-2 h-4 w-4" />Upcoming Lesson</TableHead>
                          <TableHead><MapPin className="inline-block mr-2 h-4 w-4" />Pickup Location</TableHead>
                          <TableHead>Attendance</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {approvedStudents.length > 0 ? approvedStudents.map(student => (
                          <TableRow key={student.id}>
                              <TableCell className="font-medium">{student.name}</TableCell>
                              <TableCell>{student.phone || 'N/A'}</TableCell>
                              <TableCell>{student.upcomingLesson || 'N/A'}</TableCell>
                              <TableCell className="min-w-[200px]">{`${student.flatHouseNumber}, ${student.street}, ${student.district}`}</TableCell>
                              <TableCell>
                                <Badge variant={
                                    student.attendance === 'Present' ? 'default' :
                                    student.attendance === 'Absent' ? 'destructive' : 'outline'
                                } className="capitalize">
                                  {student.attendance || 'Pending'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                  <div className="flex items-center justify-center space-x-1.5">
                                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(student)}><Eye className="mr-1 h-3 w-3"/>View</Button>
                                      <Button 
                                        variant="default" size="sm" 
                                        onClick={() => handleAttendance(student.id, student.name, 'Present')}
                                        disabled={student.attendance === 'Present'}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="destructive" size="sm" 
                                        onClick={() => handleAttendance(student.id, student.name, 'Absent')}
                                        disabled={student.attendance === 'Absent'}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                  </div>
                              </TableCell>
                          </TableRow>
                      )) : (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                    <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
                                    <p className="text-lg">No students assigned yet.</p>
                                    <p className="text-sm">Check back later for new student assignments.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
              </Table>
          </CardContent>
          {approvedStudents.length > 0 && (
             <CardFooter>
                  <p className="text-xs text-muted-foreground">Mark attendance for each completed lesson.</p>
            </CardFooter>
          )}
      </Card>
    </div>
  );
}
