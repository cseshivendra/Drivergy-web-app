
'use client';

import { Users, UserCheck, ListChecks, CreditCard, Repeat, IndianRupee } from 'lucide-react'; 
import SummaryCard from './summary-card';
import type { SummaryData } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import type React from 'react';

interface SummaryMetricsProps {
  data: SummaryData | null;
  isLoading: boolean;
}

export default function SummaryMetrics({ data, isLoading }: SummaryMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-[126px] w-full rounded-lg" />
        <Skeleton className="h-[126px] w-full rounded-lg" />
        <Skeleton className="h-[126px] w-full rounded-lg" />
        <Skeleton className="h-[126px] w-full rounded-lg" />
        <Skeleton className="h-[126px] w-full rounded-lg" />
        <Skeleton className="h-[126px] w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <SummaryCard title="Total Customers" value={data?.totalCustomers ?? 0} icon={Users} description="All registered customers" />
      <SummaryCard title="Total Instructors" value={data?.totalInstructors ?? 0} icon={UserCheck} description="All registered instructors" />
      <SummaryCard title="Active Subscriptions" value={data?.activeSubscriptions ?? 0} icon={CreditCard} description="Currently active plans" />
      <SummaryCard title="New Lesson Requests" value={data?.pendingRequests ?? 0} icon={ListChecks} description="Awaiting instructor assignment" />
      <SummaryCard title="Pending Reschedules" value={data?.pendingRescheduleRequests ?? 0} icon={Repeat} description="Awaiting admin approval" />
      <SummaryCard 
        title="Total Earning" 
        value={`₹${(data?.totalEarnings ?? 0).toLocaleString('en-IN')}`} 
        icon={IndianRupee}
        description="Gross revenue generated" 
      />
    </div>
  );
}

    