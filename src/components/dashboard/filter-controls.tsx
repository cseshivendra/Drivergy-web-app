'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { SubscriptionPlans, Locations } from '@/types'; // Added Locations import
import { Card } from '@/components/ui/card';

interface FilterControlsProps {
  onFilterChange: (filters: { location?: string; subscriptionPlan?: string }) => void;
  currentFilters: { location?: string; subscriptionPlan?: string };
}

export default function FilterControls({ onFilterChange, currentFilters }: FilterControlsProps) {

  const handleLocationChange = (value: string) => {
    onFilterChange({ 
      ...currentFilters, 
      location: value === 'all' ? undefined : value 
    });
  };

  const handleSubscriptionChange = (value: string) => {
    onFilterChange({ ...currentFilters, subscriptionPlan: value === 'all' ? undefined : value });
  };

  return (
    <Card className="p-6 shadow-lg border border-primary">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
        <div>
          <Label htmlFor="location-filter" className="text-sm font-medium mb-2 block">Filter by Location</Label>
          <Select onValueChange={handleLocationChange} value={currentFilters.location || 'all'}>
            <SelectTrigger id="location-filter" className="w-full">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {Locations.map(location => (
                <SelectItem key={location} value={location}>{location}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="subscription-filter" className="text-sm font-medium mb-2 block">Filter by Subscription</Label>
          <Select onValueChange={handleSubscriptionChange} value={currentFilters.subscriptionPlan || 'all'}>
            <SelectTrigger id="subscription-filter" className="w-full">
              <SelectValue placeholder="Select subscription plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              {SubscriptionPlans.map(plan => (
                <SelectItem key={plan} value={plan}>{plan}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}
