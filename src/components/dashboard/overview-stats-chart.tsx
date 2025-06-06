
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
  // Define colors for each metric directly in chartData's fill property
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
    { name: 'Customers', value: data.totalCustomers, fill: chartConfig.customers.color },
    { name: 'Instructors', value: data.totalInstructors, fill: chartConfig.instructors.color },
    { name: 'Subscriptions', value: data.activeSubscriptions, fill: chartConfig.subscriptions.color },
    { name: 'Requests', value: data.pendingRequests, fill: chartConfig.requests.color },
    { name: 'Earnings ($)', value: data.totalEarnings, fill: chartConfig.earnings.color }, // Added ($) for clarity
    { name: 'Certified Cust.', value: data.totalCertifiedTrainers, fill: chartConfig.certified.color }, // Shortened label
  ];

  // Custom tick formatter for Y-axis to handle large numbers
  const formatYAxisTick = (tick: number) => {
    if (tick >= 1000) {
      return `${(tick / 1000).toFixed(1)}k`;
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
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              angle={-15}
              textAnchor="end"
              height={50}
              interval={0} 
              style={{ fontSize: '0.75rem' }}
            />
            <YAxis tickFormatter={formatYAxisTick} tickLine={false} axisLine={false} tickMargin={5} />
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
