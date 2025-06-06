
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { SummaryData } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

interface OverviewStatsChartProps {
  data: SummaryData | null;
  isLoading: boolean;
}

const chartConfig = {
  value: {
    label: 'Value',
  },
  customers: { color: 'hsl(var(--chart-1))' },
  instructors: { color: 'hsl(var(--chart-2))' },
  subscriptions: { color: 'hsl(var(--chart-3))' },
  requests: { color: 'hsl(var(--chart-4))' },
  earnings: { color: 'hsl(var(--chart-5))' },
  certified: { color: 'hsl(var(--chart-6))' },
} satisfies ChartConfig;

export default function OverviewStatsChart({ data, isLoading }: OverviewStatsChartProps) {
  if (isLoading || !data) {
    return (
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="font-headline text-2xl font-semibold">Key Metrics Overview</CardTitle>
          <CardDescription>A snapshot of important statistics.</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    { name: 'Cust.', value: data.totalCustomers, fill: chartConfig.customers.color },
    { name: 'Instr.', value: data.totalInstructors, fill: chartConfig.instructors.color },
    { name: 'Subs.', value: data.activeSubscriptions, fill: chartConfig.subscriptions.color },
    { name: 'Reqs.', value: data.pendingRequests, fill: chartConfig.requests.color },
    { name: 'Earnings', value: data.totalEarnings, fill: chartConfig.earnings.color },
    { name: 'Certified', value: data.totalCertifiedTrainers, fill: chartConfig.certified.color },
  ];

  const formatYAxisTick = (tick: number) => {
    if (tick >= 1000000) {
      return `${(tick / 1000000).toFixed(1)}M`;
    }
    if (tick >= 1000) {
      return `${(tick / 1000).toFixed(0)}k`; // Use toFixed(0) for thousands to avoid "12.0k"
    }
    return tick.toString();
  };


  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="font-headline text-2xl font-semibold">Key Metrics Overview</CardTitle>
        <CardDescription>A snapshot of important statistics.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full sm:min-h-[350px]">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
              right: 20,
              left: 10, // Added some left margin for Y-axis labels
              bottom: 5,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              // angle={0} // Default is 0, so explicitly setting or removing is fine
              textAnchor="middle" // Better for horizontal labels
              // height={30} // Adjust height if needed, or let Recharts decide
              interval={0} 
              style={{ fontSize: '0.75rem' }}
            />
            <YAxis 
              tickFormatter={formatYAxisTick} 
              tickLine={false} 
              axisLine={false} 
              tickMargin={5}
              width={data.totalEarnings > 99999 ? 40 : 30} // Dynamically adjust Y-axis width for larger numbers
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar dataKey="value" radius={5}>
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
