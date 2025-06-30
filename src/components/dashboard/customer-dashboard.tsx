
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { fetchUserById, addRescheduleRequest } from '@/lib/mock-data';
import type { UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpen, ClipboardCheck, User, BarChart2, ShieldCheck, CalendarClock, Repeat, ArrowUpCircle, XCircle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { add, differenceInHours, format, parse } from 'date-fns';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<(UserProfile & { upcomingLesson?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingLessonDate, setUpcomingLessonDate] = useState<Date | null>(null);
  const [isReschedulable, setIsReschedulable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      fetchUserById(user.uid).then(userProfile => {
        if (userProfile) {
          setProfile(userProfile);
          
          const lessonDateString = userProfile.upcomingLesson;
          const now = new Date();
          let lessonDate: Date;

          if (lessonDateString) {
            // Use date-fns to parse the specific format from mock data
            lessonDate = parse(lessonDateString, 'MMM dd, yyyy, h:mm a', new Date());
          } else {
            // Simulate fetching an upcoming lesson if none is set
            const hoursToAdd = Math.random() > 0.5 ? 12 : 36;
            lessonDate = add(now, { hours: hoursToAdd });
          }
          
          setUpcomingLessonDate(lessonDate);
          
          // Check if the lesson can be rescheduled (more than 24 hours away)
          setIsReschedulable(differenceInHours(lessonDate, now) > 24);

        }
        setLoading(false);
      });
    }
  }, [user]);
  
  const handleUpgradePlan = () => {
    toast({ title: 'Redirecting to Plans', description: 'You can choose a new plan on our main site.' });
     // In a real app, you'd likely use router.push('/site#subscriptions')
  };
  
  const handleCancelPlan = () => {
     toast({
        title: 'Cancellation Request Submitted',
        description: 'We have received your request. Our team will contact you shortly.',
        variant: 'destructive'
    });
  }

  const handleRescheduleRequest = async () => {
    if (!profile || !upcomingLessonDate || !user) return;
    setIsSubmitting(true);
    try {
        await addRescheduleRequest(user.uid, profile.name, upcomingLessonDate);
        toast({
            title: 'Reschedule Request Sent',
            description: 'Your request has been sent for approval. You will be notified of the outcome.',
        });
        setIsReschedulable(false); // Prevent multiple requests for the same slot
    } catch (error) {
        toast({
            title: 'Error',
            description: 'Could not send reschedule request. Please try again.',
            variant: 'destructive',
        });
    } finally {
        setIsSubmitting(false);
    }
  };


  if (loading) {
    return (
      <div className="container mx-auto p-4 py-8 space-y-8">
        <Skeleton className="h-10 w-1/2 mb-8" />
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-4 py-8 sm:p-6 lg:p-8 space-y-8">
      <header className="mb-8">
        <h1 className="font-headline text-3xl font-semibold tracking-tight text-foreground">
          Welcome, {profile?.name || 'Customer'}!
        </h1>
        <p className="text-muted-foreground">Here's an overview of your learning journey with Drivergy.</p>
      </header>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        {/* Upcoming Lessons Card */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <CalendarClock className="h-7 w-7 text-primary" />
              </div>
              <div>
                <CardTitle className="font-headline text-xl">Upcoming Lesson</CardTitle>
                <CardDescription>Your next scheduled session.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            {upcomingLessonDate ? (
              <div className="text-center bg-muted/50 p-4 rounded-lg">
                  <p className="text-lg font-semibold">{format(upcomingLessonDate, 'eeee, MMM do')}</p>
                  <p className="text-2xl font-bold text-primary">{format(upcomingLessonDate, 'h:mm a')}</p>
              </div>
            ) : (
                 <p className="text-sm text-center text-muted-foreground">No upcoming lessons scheduled.</p>
            )}
          </CardContent>
          <CardFooter>
            <Button 
                className="w-full"
                disabled={!isReschedulable || isSubmitting}
                onClick={handleRescheduleRequest}
            >
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : <><Repeat className="mr-2 h-4 w-4" />Reschedule</>}
            </Button>
          </CardFooter>
           {!isReschedulable && upcomingLessonDate && (
                <p className="text-xs text-muted-foreground text-center px-6 pb-4">
                    Lessons can only be rescheduled more than 24 hours in advance.
                </p>
            )}
        </Card>

        {/* My Courses Card */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <BookOpen className="h-7 w-7 text-primary" />
              </div>
              <div>
                <CardTitle className="font-headline text-xl">My Subscription</CardTitle>
                <CardDescription>Your subscribed plan details.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow space-y-4">
              <div className="flex justify-between items-center text-lg">
                <span className="text-muted-foreground">Current Plan:</span>
                <span className="font-bold text-primary">{profile?.subscriptionPlan}</span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="text-muted-foreground">Status:</span>
                <span className={`font-semibold ${profile?.approvalStatus === 'Approved' ? 'text-green-500' : 'text-yellow-500'}`}>
                  {profile?.approvalStatus}
                </span>
              </div>
               <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/courses">Explore All Courses</Link>
            </Button>
          </CardContent>
          <CardFooter className="grid grid-cols-2 gap-4">
            <Button 
                variant="default"
                onClick={handleUpgradePlan}
                className="w-full bg-green-600 hover:bg-green-700"
            >
              <ArrowUpCircle className="mr-2 h-4 w-4" /> Upgrade
            </Button>
             <Button 
                variant="destructive"
                onClick={handleCancelPlan}
                className="w-full"
            >
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
          </CardFooter>
        </Card>

        {/* RTO Quiz Card */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <ClipboardCheck className="h-7 w-7 text-primary" />
              </div>
              <div>
                <CardTitle className="font-headline text-xl">RTO Test Quiz</CardTitle>
                <CardDescription>Practice for your official test.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground mb-4">
              Take our mock tests to build your confidence and knowledge for the RTO exam.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/rto-quiz">Start Quiz</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* My Progress Card */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <BarChart2 className="h-7 w-7 text-primary" />
              </div>
              <div>
                <CardTitle className="font-headline text-xl">My Progress</CardTitle>
                <CardDescription>Track your learning milestones.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Theory Lessons</span>
                  <span>75%</span>
                </div>
                <Progress value={75} />
              </div>
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Practical Sessions</span>
                  <span>40%</span>
                </div>
                <Progress value={40} />
              </div>
            </div>
          </CardContent>
           <CardFooter>
                <p className="text-xs text-center text-muted-foreground pt-2 w-full">Progress tracking is coming soon!</p>
           </CardFooter>
        </Card>
      </div>
    </div>
  );
}
