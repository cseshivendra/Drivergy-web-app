
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
  // Placeholder data - in a real app, you'd fetch this
  const totalReferrals = 12;
  const successfulReferrals = 8;
  const pendingReferrals = 4;
  const totalPointsEarned = 800; // e.g., 100 points per successful referral

  return (
    <div className="container mx-auto max-w-4xl p-4 py-8 sm:p-6 lg:p-8">
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="text-center bg-card pattern-dots pattern-primary/10 pattern-bg-transparent pattern-opacity-20 pattern-size-6">
          <div className="mx-auto mb-4 flex items-center justify-center rounded-full bg-primary/10 p-4 w-fit border-2 border-primary/20 shadow-md">
            <BarChart3 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl font-bold text-primary">Track Your Referrals</CardTitle>
          <CardDescription className="text-lg text-foreground/90">
            See how your referral efforts are paying off and the rewards you've earned!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-8 p-6">
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
            <p className="text-muted-foreground">
              Keep sharing to earn more rewards! Check back often for updates.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
