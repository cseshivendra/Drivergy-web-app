

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { listenToUser } from '@/lib/mock-data';
import { addRescheduleRequest, addFeedback, updateSubscriptionStartDate } from '@/lib/server-actions';
import type { UserProfile, FeedbackFormValues } from '@/types';
import { FeedbackFormSchema } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpen, ClipboardCheck, User, BarChart2, ShieldCheck, CalendarClock, Repeat, ArrowUpCircle, XCircle, Loader2, Star, MessageSquare, Phone, Car, UserCheck, Gift } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { differenceInHours, format, isFuture, parse, addDays, isPast } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';


// Helper component for Star Rating input
const StarRating = ({ rating, setRating, disabled = false }: { rating: number; setRating: (r: number) => void; disabled?: boolean }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-8 w-8 cursor-pointer transition-colors",
            rating >= star ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30",
            !disabled && "hover:text-yellow-300"
          )}
          onClick={() => !disabled && setRating(star)}
        />
      ))}
    </div>
  );
};

// Form component for the feedback dialog
function FeedbackForm({ profile, onSubmitted }: { profile: UserProfile; onSubmitted: () => void }) {
  const { toast } = useToast();
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(FeedbackFormSchema),
    defaultValues: { rating: 0, comment: '' },
  });

  async function onSubmit(data: FeedbackFormValues) {
    if (!profile.assignedTrainerId || !profile.assignedTrainerName) {
      toast({ title: "Error", description: "No trainer assigned to rate.", variant: "destructive" });
      return;
    }

    const success = await addFeedback(profile.id, profile.name, profile.assignedTrainerId, profile.assignedTrainerName, data.rating, data.comment);

    if (success) {
      toast({ title: "Feedback Submitted!", description: "Thank you for your valuable feedback." });
      onSubmitted();
    } else {
      toast({ title: "Submission Failed", description: "Could not submit your feedback.", variant: "destructive" });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Rating</FormLabel>
              <FormControl>
                <StarRating rating={field.value} setRating={field.onChange} disabled={form.formState.isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Feedback</FormLabel>
              <FormControl>
                <Textarea placeholder={`Share your experience with ${profile.assignedTrainerName}...`} {...field} disabled={form.formState.isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

const timeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
];

export default function CustomerDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [upcomingLessonDate, setUpcomingLessonDate] = useState<Date | null>(null);
  const [isReschedulable, setIsReschedulable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [isStartDateDialogOpen, setIsStartDateDialogOpen] = useState(false);
  const [newStartDate, setNewStartDate] = useState<Date | undefined>(new Date());
  const [isStartDateEditable, setIsStartDateEditable] = useState(false);

  // State for reschedule dialog
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [newRescheduleDate, setNewRescheduleDate] = useState<Date | undefined>(undefined);
  const [newRescheduleTime, setNewRescheduleTime] = useState<string>('');

  useEffect(() => {
    if (!user?.id) {
        setLoading(false);
        return;
    }
    
    // For real users, listen to Firestore
    setLoading(true);
    const unsubscribe = listenToUser(user.id, (userProfile) => {
        setProfile(userProfile);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (profile) {
      // Determine if start date can be edited
      if (profile.subscriptionStartDate) {
        const startDate = parse(profile.subscriptionStartDate, 'MMM dd, yyyy', new Date());
        setIsStartDateEditable(!isPast(startDate));
      } else {
        // If no start date is set, it can be edited
        setIsStartDateEditable(true);
      }

      // Determine upcoming lesson and if it can be rescheduled
      const lessonDateString = profile.upcomingLesson;
      const now = new Date();
      let lessonDate: Date | null = null;

      if (lessonDateString) {
        try {
          lessonDate = parse(lessonDateString, 'MMM dd, yyyy, h:mm a', new Date());
        } catch(e) { console.error("Error parsing date:", e)}
      } 
      
      setUpcomingLessonDate(lessonDate);

      if (lessonDate) {
        setIsReschedulable(differenceInHours(lessonDate, now) > 24);
      } else {
        setIsReschedulable(false);
      }
    }
  }, [profile]);

  const handleStartDateChange = async () => {
    if (!profile || !newStartDate || !user) return;
    setIsSubmitting(true);
    try {
      const updatedProfile = await updateSubscriptionStartDate(user.id, newStartDate);
      if (updatedProfile) {
        toast({
          title: 'Start Date Updated',
          description: `Your subscription will now start on ${format(newStartDate, 'PPP')}. Your first lesson has been scheduled accordingly.`,
        });
        setProfile(updatedProfile);
        setIsStartDateDialogOpen(false);
      } else {
        toast({
          title: "Update Failed",
          description: "Could not update your start date. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUpgradePlan = () => {
    toast({ title: 'Redirecting to Plans', description: 'You can choose a new plan on our main site.' });
    router.push('/#subscriptions');
  };
  
  const handleCancelPlan = () => {
     toast({
        title: 'Cancellation Request Submitted',
        description: 'We have received your request. Our team will contact you shortly.',
        variant: 'destructive'
    });
  }

  const handleRescheduleRequest = async () => {
    if (!profile || !upcomingLessonDate || !user || !newRescheduleDate || !newRescheduleTime) return;

    const [hours, period] = newRescheduleTime.split(/:| /);
    let hour24 = parseInt(hours, 10);
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;
    
    const finalNewDate = new Date(newRescheduleDate);
    finalNewDate.setHours(hour24, 0, 0, 0);

    setIsSubmitting(true);
    try {
        await addRescheduleRequest(user.id, profile.name, upcomingLessonDate, finalNewDate);
        toast({
            title: 'Reschedule Request Sent',
            description: 'Your request has been sent for approval. You will be notified of the outcome.',
        });
        setIsRescheduleDialogOpen(false);
        setIsReschedulable(false);
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


  if (authLoading || loading) {
    return (
      <div className="container mx-auto p-4 py-8 space-y-8">
        <Skeleton className="h-10 w-1/2 mb-8" />
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          Welcome, {user?.name || 'Customer'}!
        </h1>
        <p className="text-muted-foreground">Here's an overview of your learning journey with Drivergy.</p>
      </header>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                onClick={() => setIsRescheduleDialogOpen(true)}
            >
              <Repeat className="mr-2 h-4 w-4" />Reschedule
            </Button>
          </CardFooter>
           {!isReschedulable && upcomingLessonDate && (
                <p className="text-xs text-muted-foreground text-center px-6 pb-4">
                    Lessons can only be rescheduled more than 24 hours in advance.
                </p>
            )}
        </Card>

        {/* My Subscription Card */}
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
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Current Plan:</span>
                <span className="font-bold text-primary">{profile?.subscriptionPlan}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className={`font-semibold ${profile?.approvalStatus === 'Approved' ? 'text-green-500' : 'text-yellow-500'}`}>
                  {profile?.approvalStatus}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Start Date:</span>
                <span className="font-semibold">{profile?.subscriptionStartDate ? format(parse(profile.subscriptionStartDate, 'MMM dd, yyyy', new Date()), 'dd-MMM-yyyy') : 'N/A'}</span>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsStartDateDialogOpen(true)}
                disabled={!isStartDateEditable}
              >
                <CalendarClock className="mr-2 h-4 w-4" /> Change Start Date
              </Button>
              {!isStartDateEditable && profile?.subscriptionStartDate && <p className="text-xs text-muted-foreground text-center">Start date can only be changed if it's in the future.</p>}
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

        {/* My Trainer Card */}
        {profile?.assignedTrainerName && (
        <Card className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <UserCheck className="h-7 w-7 text-primary" />
              </div>
              <div>
                <CardTitle className="font-headline text-xl">My Trainer</CardTitle>
                <CardDescription>Your assigned instructor.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center"><User className="mr-2 h-4 w-4"/> Name:</span>
                <span className="font-bold text-foreground">{profile.assignedTrainerName}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center"><Phone className="mr-2 h-4 w-4"/> Contact:</span>
                <span className="font-bold text-foreground">{profile.assignedTrainerPhone || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center"><Star className="mr-2 h-4 w-4"/> Experience:</span>
                <span className="font-bold text-foreground">{profile.assignedTrainerExperience ? `${profile.assignedTrainerExperience} years` : 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center"><Car className="mr-2 h-4 w-4"/> Vehicle:</span>
                <span className="font-bold text-foreground">{profile.assignedTrainerVehicleDetails || 'N/A'}</span>
              </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground text-center w-full">
              Contact your trainer for any lesson-specific questions.
            </p>
          </CardFooter>
        </Card>
        )}

        <Card className="shadow-lg hover:shadow-xl transition-shadow flex flex-col xl:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <BarChart2 className="h-7 w-7 text-primary" />
              </div>
              <div>
                <CardTitle className="font-headline text-xl">Lesson Progress</CardTitle>
                <CardDescription>Your completed driving sessions.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col justify-center space-y-4">
            <div className="flex justify-between items-baseline">
              <p className="text-muted-foreground">Progress</p>
              <p className="text-2xl font-bold text-primary">
                {profile?.completedLessons ?? 0} / {profile?.totalLessons ?? 0}
              </p>
            </div>
            <Progress value={((profile?.completedLessons ?? 0) / (profile?.totalLessons || 1)) * 100} />
          </CardContent>
          <CardFooter>
              <p className="text-xs text-muted-foreground text-center w-full">
                Your trainer marks attendance after each lesson.
              </p>
          </CardFooter>
        </Card>

        {/* Feedback Card */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <MessageSquare className="h-7 w-7 text-primary" />
              </div>
              <div>
                <CardTitle className="font-headline text-xl">Rate Your Trainer</CardTitle>
                <CardDescription>Your feedback helps us improve.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground mb-4">
              Share your experience with your trainer, {profile?.assignedTrainerName || 'N/A'}.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => setIsFeedbackDialogOpen(true)}
              disabled={!profile?.assignedTrainerId || profile?.feedbackSubmitted}
            >
              {profile?.feedbackSubmitted ? "Feedback Submitted" : "Give Feedback"}
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
              <Link href="/dashboard/rto-quiz">Start Quiz</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Referral Program Card */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Gift className="h-7 w-7 text-primary" />
              </div>
              <div>
                <CardTitle className="font-headline text-xl">Referral Program</CardTitle>
                <CardDescription>Invite friends and earn rewards.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground mb-4">
              Share your unique referral code with friends. You'll earn points when they sign up and subscribe!
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard/referrals/invite">Go to Referrals</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Feedback Dialog */}
      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Feedback for {profile?.assignedTrainerName}</DialogTitle>
            <DialogDescription>
              Let us know how your training experience was. Your feedback is valuable.
            </DialogDescription>
          </DialogHeader>
          {profile && (
            <FeedbackForm
              profile={profile}
              onSubmitted={() => {
                setIsFeedbackDialogOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Start Date Change Dialog */}
      <Dialog open={isStartDateDialogOpen} onOpenChange={setIsStartDateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Subscription Start Date</DialogTitle>
            <DialogDescription>Select a new start date for your plan. This can only be done for future dates.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <Calendar
              mode="single"
              selected={newStartDate}
              onSelect={setNewStartDate}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStartDateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleStartDateChange} disabled={isSubmitting || !newStartDate}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm New Date
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Lesson</DialogTitle>
            <DialogDescription>
              Select a new date and time for your lesson. Your trainer will need to approve this change.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={newRescheduleDate}
                onSelect={setNewRescheduleDate}
                disabled={(date) => date <= addDays(new Date(), 1)} // Can only schedule for tomorrow onwards
              />
            </div>
            <Select value={newRescheduleTime} onValueChange={setNewRescheduleTime}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a time slot" />
                </SelectTrigger>
                <SelectContent>
                    {timeSlots.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRescheduleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRescheduleRequest} disabled={isSubmitting || !newRescheduleDate || !newRescheduleTime}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Request Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
