
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Star, BarChart3, Gift } from 'lucide-react';

interface ReferralStatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
}

function ReferralStatCard({ title, value, icon: Icon, description }: ReferralStatCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground pt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function TrackReferralsPage() {
  // Placeholder data - in a real app, you'd fetch this
  const totalReferrals = 12;
  const successfulReferrals = 8;
  const pendingReferrals = 4;
  const totalPointsEarned = 800; // e.g., 100 points per successful referral

  return (
    <div className="container mx-auto max-w-4xl p-4 py-8 sm:p-6 lg:p-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center rounded-full bg-primary/10 p-4 w-fit">
            <BarChart3 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl font-bold text-primary">Track Your Referrals</CardTitle>
          <CardDescription className="text-lg">
            See how your referral efforts are paying off and the rewards you've earned!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ReferralStatCard
              title="Total Referrals Sent"
              value={totalReferrals}
              icon={Users}
              description="Number of unique friends you've invited."
            />
            <ReferralStatCard
              title="Successful Referrals"
              value={successfulReferrals}
              icon={Gift}
              description="Friends who signed up using your link."
            />
            <ReferralStatCard
              title="Pending Referrals"
              value={pendingReferrals}
              icon={Users}
              description="Invites sent but not yet signed up."
            />
            <ReferralStatCard
              title="Total Points Earned"
              value={`${totalPointsEarned} pts`}
              icon={Star}
              description="Rewards accumulated from successful referrals."
            />
          </div>
          
          <div className="text-center pt-4">
            {/* This could later link to a detailed referral history table or more info */}
            <p className="text-muted-foreground">
              Keep sharing to earn more rewards! Check back often for updates.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
