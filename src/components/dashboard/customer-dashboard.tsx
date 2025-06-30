
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { fetchUserById } from '@/lib/mock-data';
import type { UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpen, ClipboardCheck, User, BarChart2, ShieldCheck } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      fetchUserById(user.uid).then(userProfile => {
        if (userProfile) {
          setProfile(userProfile);
        }
        setLoading(false);
      });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 py-8 space-y-8">
        <Skeleton className="h-10 w-1/2 mb-8" />
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
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

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* RTO Quiz Card */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
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
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Take our mock tests to build your confidence and knowledge for the RTO exam.
            </p>
            <Button asChild className="w-full">
              <Link href="/rto-quiz">Start Quiz</Link>
            </Button>
          </CardContent>
        </Card>

        {/* My Courses Card */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <BookOpen className="h-7 w-7 text-primary" />
              </div>
              <div>
                <CardTitle className="font-headline text-xl">My Courses</CardTitle>
                <CardDescription>Your subscribed plan details.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Current Plan:</span>
                <span className="font-bold text-primary">{profile?.subscriptionPlan}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status:</span>
                <span className={`font-semibold ${profile?.approvalStatus === 'Approved' ? 'text-green-500' : 'text-yellow-500'}`}>
                  {profile?.approvalStatus}
                </span>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/courses">Explore All Courses</Link>
            </Button>
          </CardContent>
        </Card>

        {/* My Progress Card */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
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
          <CardContent>
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
                 <p className="text-xs text-center text-muted-foreground pt-2">Progress tracking is coming soon!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
