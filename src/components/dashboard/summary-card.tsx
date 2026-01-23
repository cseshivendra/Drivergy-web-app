'use client';

import type { LucideIcon } from 'lucide-react'; // Keep for type documentation if needed, or remove if React.ElementType is sufficient
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type React from 'react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType; // Changed from LucideIcon to React.ElementType
  description?: string;
  className?: string;
}

export default function SummaryCard({ title, value, icon: Icon, description, className }: SummaryCardProps) {
  return (
    <Card className={cn(
      "shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1",
      "border-l-4 border-primary", 
      className
    )}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-semibold text-muted-foreground tracking-wider uppercase">{title}</CardTitle>
          <div className="text-4xl font-semibold text-foreground mt-1">{value}</div>
        </div>
        <div className="p-3 bg-primary/10 rounded-lg">
          <Icon className="h-7 w-7 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

