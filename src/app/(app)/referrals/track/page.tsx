
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Star, BarChart3, Gift, AlertCircle, CalendarDays, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { fetchReferralsByUserId, fetchUserById } from '@/lib/mock-data';
import type { Referral, UserProfile } from '@/types';
import Loading from '@/app/loading';
import { format, parseISO } from 'date-fns';

interface ReferralStatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
}

function ReferralStatCard({ title, value, icon: Icon, description }: ReferralStatCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 border-l-4 border-primary">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-semibold text-muted-foreground tracking-wider uppercase">{title}</CardTitle>
          <div className="text-3xl font-extrabold text-foreground mt-1">{value}</div>
        </div>
        <div className="p-2.5 bg-primary/10 rounded-lg">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function TrackReferralsPage() {
  const { user, loading: authLoading } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      setLoading(true);
      Promise.all([
        fetchReferralsByUserId(user.uid),
        fetchUserById(user.uid)
      ]).then(([referralData, userProfile]) => {
        setReferrals(referralData);
        setProfile(userProfile);
        setLoading(false);
      }).catch(error => {
        console.error("Error fetching referral data:", error);
        setLoading(false);
      });
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const totalReferrals = referrals.length;
  const successfulReferrals = referrals.filter(r => r.status === 'Successful').length;
  const pendingReferrals = 0; // Logic for this can be added if referral status can be 'Pending'
  const totalPointsEarned = profile?.totalReferralPoints || 0;
  
  if (loading || authLoading) {
    return <Loading />;
  }
  
  const getStatusColor = (status: 'Pending' | 'Paid') => {
    switch (status) {
      case 'Pending': 
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300';
      case 'Paid': 
        return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300';
      default: 
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300';
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 py-8 sm:p-6 lg:p-8">
      <Card className="shadow-xl">
        <CardHeader>
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                    <BarChart3 className="h-7 w-7 text-primary" />
                </div>
                <div>
                    <CardTitle className="font-headline text-2xl">Track Your Referrals</CardTitle>
                    <CardDescription>See how your referral efforts are paying off.</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ReferralStatCard
              title="Total Sign-ups"
              value={totalReferrals}
              icon={Users}
              description="Number of friends who signed up using your link."
            />
            <ReferralStatCard
              title="Total Points Earned"
              value={`${totalPointsEarned} pts`}
              icon={Star}
              description="Rewards accumulated from successful referrals."
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Referral History</CardTitle>
              <CardDescription>A detailed list of your referred friends.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><Users className="inline-block mr-2 h-4 w-4" />Referred Friend</TableHead>
                    <TableHead><CalendarDays className="inline-block mr-2 h-4 w-4" />Date</TableHead>
                    <TableHead><Star className="inline-block mr-2 h-4 w-4" />Points Earned</TableHead>
                    <TableHead><CheckCircle className="inline-block mr-2 h-4 w-4" />Payout Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.length > 0 ? (
                    referrals.map(referral => (
                      <TableRow key={referral.id}>
                        <TableCell className="font-medium">{referral.refereeName}</TableCell>
                        <TableCell>{format(parseISO(referral.timestamp), 'dd MMM, yyyy')}</TableCell>
                        <TableCell className="font-bold text-green-600">+{referral.pointsEarned}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(referral.payoutStatus)}>
                            {referral.payoutStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
                          <p className="text-lg">No referrals yet.</p>
                          <p className="text-sm">Share your code to start earning points!</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <div className="text-center pt-4">
            <p className="text-muted-foreground">
              Keep sharing to earn more rewards! Check back often for updates.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
