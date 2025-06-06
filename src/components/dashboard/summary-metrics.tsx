
import { Users, UserCheck, ListChecks, CreditCard, DollarSign, Award } from 'lucide-react'; // Added DollarSign, Award
import SummaryCard from './summary-card';
import type { SummaryData } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';


interface SummaryMetricsProps {
  data: SummaryData | null;
  isLoading: boolean;
}

export default function SummaryMetrics({ data, isLoading }: SummaryMetricsProps) {
  if (isLoading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"> {/* Adjusted grid for 6 items */}
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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"> {/* Adjusted grid for 6 items */}
      <SummaryCard title="Total Customers" value={data.totalCustomers} icon={Users} description="All registered customers" />
      <SummaryCard title="Total Instructors" value={data.totalInstructors} icon={UserCheck} description="All registered instructors" />
      <SummaryCard title="Active Subscriptions" value={data.activeSubscriptions} icon={CreditCard} description="Currently active plans" />
      <SummaryCard title="Pending Requests" value={data.pendingRequests} icon={ListChecks} description="New lesson requests" />
      <SummaryCard 
        title="Total Earning" 
        value={`$${data.totalEarnings.toLocaleString()}`} 
        icon={DollarSign} 
        description="Gross revenue generated" 
      />
      <SummaryCard 
        title="Certified Customer" 
        value={data.totalCertifiedTrainers} 
        icon={Award} 
        description="Verified & certified customers" 
      />
    </div>
  );
}

