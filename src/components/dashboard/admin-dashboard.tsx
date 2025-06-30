
'use client';

import { useEffect, useState, useCallback } from 'react';
import SummaryMetrics from '@/components/dashboard/summary-metrics';
import FilterControls from '@/components/dashboard/filter-controls';
import UserTable from '@/components/dashboard/user-table';
import RequestTable from '@/components/dashboard/request-table';
import { fetchCustomers, fetchInstructors, fetchAllLessonRequests, fetchSummaryData } from '@/lib/mock-data';
import type { UserProfile, LessonRequest, SummaryData } from '@/types';
import { Users, UserCheck, Search, ListChecks } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [instructors, setInstructors] = useState<UserProfile[]>([]);
  const [allLessonRequests, setAllLessonRequests] = useState<LessonRequest[]>([]);

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingInstructors, setLoadingInstructors] = useState(true);
  const [loadingAllLessonRequests, setLoadingAllLessonRequests] = useState(true);

  const [filters, setFilters] = useState<{ location?: string; subscriptionPlan?: string }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSearchTerm, setTempSearchTerm] = useState(''); 

  const loadInitialDataAndRequests = useCallback(async (currentSearchTerm: string) => {
    console.log('[DashboardPage] loadInitialDataAndRequests called with searchTerm:', currentSearchTerm);
    setLoadingSummary(true);
    fetchSummaryData().then(data => {
      setSummaryData(data);
      setLoadingSummary(false);
    });

    setLoadingAllLessonRequests(true);
    fetchAllLessonRequests(currentSearchTerm).then(data => {
      setAllLessonRequests(data);
      setLoadingAllLessonRequests(false);
    });
  }, []);

  const loadFilteredUserData = useCallback(async (
    currentFilters: { location?: string; subscriptionPlan?: string },
    currentSearchTerm: string
  ) => {
    console.log('[DashboardPage] loadFilteredUserData called with filters:', currentFilters, 'searchTerm:', currentSearchTerm);
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
    console.log('[DashboardPage] Main useEffect triggered. Filters:', filters, 'SearchTerm:', searchTerm);
    // Load summary and lesson requests (which might depend on search term if customerName is searched)
    loadInitialDataAndRequests(searchTerm);
    // Load user data based on both filters and search term
    loadFilteredUserData(filters, searchTerm);
  }, [loadInitialDataAndRequests, loadFilteredUserData, filters, searchTerm]);


  const handleFilterChange = (newFilters: { location?: string; subscriptionPlan?: string }) => {
    console.log('[DashboardPage] handleFilterChange called with newFilters:', newFilters);
    setFilters(newFilters);
  };

  const handleSearch = () => {
    console.log('[DashboardPage] handleSearch called. TempSearchTerm:', tempSearchTerm);
    setSearchTerm(tempSearchTerm.trim());
  };

  const handleUserActioned = () => {
    console.log('[DashboardPage] handleUserActioned called. Re-fetching data.');
    // Re-fetch summary data as counts might change (e.g., active subscriptions if that's tied to approval)
    fetchSummaryData().then(data => setSummaryData(data));
    // Re-fetch user data as pending lists will change
    loadFilteredUserData(filters, searchTerm);
     // Re-fetch lesson requests if needed (e.g. if summaryData.pendingRequests is directly shown from there)
    fetchAllLessonRequests(searchTerm).then(data => setAllLessonRequests(data));
  };


  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto max-w-7xl p-4 py-8 sm:p-6 lg:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="font-headline text-3xl font-semibold tracking-tight text-foreground">Admin Dashboard</h1>
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
          onUserActioned={handleUserActioned}
        />
        <UserTable 
          title={<><UserCheck className="inline-block mr-3 h-6 w-6 align-middle" />New Instructors</>} 
          users={instructors} 
          isLoading={loadingInstructors} 
          onUserActioned={handleUserActioned}
        />
        <RequestTable 
          title={<><ListChecks className="inline-block mr-3 h-6 w-6 align-middle" />Lesson Requests</>} 
          requests={allLessonRequests} 
          isLoading={loadingAllLessonRequests} 
        />
      </main>
    </div>
  );
}
