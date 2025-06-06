
'use client';

import { useEffect, useState, useCallback } from 'react';
import SummaryMetrics from '@/components/dashboard/summary-metrics';
import FilterControls from '@/components/dashboard/filter-controls';
import UserTable from '@/components/dashboard/user-table';
import RequestTable from '@/components/dashboard/request-table';
import { fetchCustomers, fetchInstructors, fetchRequests, fetchSummaryData } from '@/lib/mock-data';
import type { UserProfile, LessonRequest, SummaryData } from '@/types';
import { Users, UserCheck, Bike, Car as FourWheelerIcon, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [instructors, setInstructors] = useState<UserProfile[]>([]);
  const [twoWheelerRequests, setTwoWheelerRequests] = useState<LessonRequest[]>([]);
  const [fourWheelerRequests, setFourWheelerRequests] = useState<LessonRequest[]>([]);

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingInstructors, setLoadingInstructors] = useState(true);
  const [loadingTwoWheeler, setLoadingTwoWheeler] = useState(true);
  const [loadingFourWheeler, setLoadingFourWheeler] = useState(true);

  const [filters, setFilters] = useState<{ location?: string; subscriptionPlan?: string }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSearchTerm, setTempSearchTerm] = useState(''); // For the input field

  const loadInitialData = useCallback(async () => {
    setLoadingSummary(true);
    fetchSummaryData().then(data => {
      setSummaryData(data);
      setLoadingSummary(false);
    });

    setLoadingTwoWheeler(true);
    fetchRequests('Two-Wheeler').then(data => {
      setTwoWheelerRequests(data);
      setLoadingTwoWheeler(false);
    });

    setLoadingFourWheeler(true);
    fetchRequests('Four-Wheeler').then(data => {
      setFourWheelerRequests(data);
      setLoadingFourWheeler(false);
    });
  }, []);

  const loadFilteredData = useCallback(async (
    currentFilters: { location?: string; subscriptionPlan?: string },
    currentSearchTerm: string
  ) => {
    setLoadingCustomers(true);
    fetchCustomers(currentFilters.location, currentFilters.subscriptionPlan, currentSearchTerm).then(data => {
      setCustomers(data);
      setLoadingCustomers(false);
    });

    setLoadingInstructors(true);
    fetchInstructors(currentFilters.location, currentFilters.subscriptionPlan, currentSearchTerm).then(data => {
      setInstructors(data);
      setLoadingInstructors(false);
    });
  }, []);


  useEffect(() => {
    loadInitialData();
    loadFilteredData(filters, searchTerm);
  }, [loadInitialData, loadFilteredData, filters, searchTerm]);


  const handleFilterChange = (newFilters: { location?: string; subscriptionPlan?: string }) => {
    setFilters(newFilters);
    // useEffect will handle re-fetching with the new filters and existing searchTerm
  };

  const handleSearch = () => {
    setSearchTerm(tempSearchTerm.trim());
    // useEffect will handle re-fetching with the new searchTerm and existing filters
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto max-w-7xl p-4 py-8 sm:p-6 lg:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="font-headline text-4xl font-bold text-center sm:text-left">Admin Dashboard</h1>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Input
              type="text"
              placeholder="Search ID, Name, Email..."
              value={tempSearchTerm}
              onChange={(e) => setTempSearchTerm(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              className="h-10 flex-grow sm:w-64"
            />
            <Button onClick={handleSearch} className="h-10">
              <Search className="mr-0 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
            </Button>
          </div>
        </div>
        
        <SummaryMetrics data={summaryData} isLoading={loadingSummary} />
        
        <FilterControls 
          onFilterChange={handleFilterChange} 
          currentFilters={filters}
        />
        
        <UserTable 
          title={<><Users className="inline-block mr-3 h-6 w-6 align-middle" />New Customers</>} 
          users={customers} 
          isLoading={loadingCustomers} 
        />
        <UserTable 
          title={<><UserCheck className="inline-block mr-3 h-6 w-6 align-middle" />New Instructors</>} 
          users={instructors} 
          isLoading={loadingInstructors} 
        />
        <RequestTable 
          title={<><Bike className="inline-block mr-3 h-6 w-6 align-middle" />Bike Requests</>} 
          requests={twoWheelerRequests} 
          vehicleType="Two-Wheeler" 
          isLoading={loadingTwoWheeler} 
        />
        <RequestTable 
          title={<><FourWheelerIcon className="inline-block mr-3 h-6 w-6 align-middle" />Car Requests</>} 
          requests={fourWheelerRequests} 
          vehicleType="Four-Wheeler" 
          isLoading={loadingFourWheeler} 
        />
      </main>
    </div>
  );
}
