
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input'; // Added Input
import { SubscriptionPlans } from '@/types'; // Locations import removed as it's not directly used for dropdown
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react'; // Added useState and useEffect

interface FilterControlsProps {
  onFilterChange: (filters: { location?: string; subscriptionPlan?: string }) => void;
  currentFilters: { location?: string; subscriptionPlan?: string };
}

export default function FilterControls({ onFilterChange, currentFilters }: FilterControlsProps) {
  const [locationSearch, setLocationSearch] = useState(currentFilters.location || '');

  // Effect to update local search state if the parent filter changes
  useEffect(() => {
    setLocationSearch(currentFilters.location || '');
  }, [currentFilters.location]);

  const handleLocationInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLocation = event.target.value;
    setLocationSearch(newLocation);
    onFilterChange({ 
      ...currentFilters, 
      location: newLocation.trim() === '' ? undefined : newLocation.trim() 
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
          <Input
            id="location-filter"
            type="text"
            placeholder="Enter location to filter"
            value={locationSearch}
            onChange={handleLocationInputChange}
            className="w-full"
          />
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
