
'use client';

import { useEffect, useState, useCallback } from 'react';
// Header is now in (app)/layout.tsx
// AuthGuard is now in (app)/layout.tsx
import SummaryMetrics from '@/components/dashboard/summary-metrics';
import FilterControls from '@/components/dashboard/filter-controls';
import UserTable from '@/components/dashboard/user-table';
import RequestTable from '@/components/dashboard/request-table';
// OverviewStatsChart import removed
import { fetchCustomers, fetchInstructors, fetchRequests, fetchSummaryData } from '@/lib/mock-data';
import type { UserProfile, LessonRequest, SummaryData } from '@/types';
import { Users, UserCheck, Bike, Car as FourWheelerIcon } from 'lucide-react'; // Renamed Car to FourWheelerIcon to avoid conflict

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

  const loadFilteredData = useCallback(async (currentFilters: { location?: string; subscriptionPlan?: string }) => {
    setLoadingCustomers(true);
    fetchCustomers(currentFilters.location, currentFilters.subscriptionPlan).then(data => {
      setCustomers(data);
      setLoadingCustomers(false);
    });

    setLoadingInstructors(true);
    fetchInstructors(currentFilters.location, currentFilters.subscriptionPlan).then(data => {
      setInstructors(data);
      setLoadingInstructors(false);
    });
  }, []);


  useEffect(() => {
    loadInitialData();
    loadFilteredData(filters);
  }, [loadInitialData, loadFilteredData, filters]);


  const handleFilterChange = (newFilters: { location?: string; subscriptionPlan?: string }) => {
    setFilters(newFilters);
  };

  return (
    // AuthGuard and outer div/Header are removed as they are in (app)/layout.tsx
    <div className="min-h-screen bg-background text-foreground">
      {/* Header removed from here */}
      <main className="container mx-auto max-w-7xl p-4 py-8 sm:p-6 lg:p-8 space-y-8">
        <h1 className="font-headline text-4xl font-bold">Admin Dashboard</h1>
        
        <SummaryMetrics data={summaryData} isLoading={loadingSummary} />

        {/* OverviewStatsChart component removed from here */}
        
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
