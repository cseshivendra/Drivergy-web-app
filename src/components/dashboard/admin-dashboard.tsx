
'use client';

import { useEffect, useState, useCallback } from 'react';
import SummaryMetrics from '@/components/dashboard/summary-metrics';
import FilterControls from '@/components/dashboard/filter-controls';
import UserTable from '@/components/dashboard/user-table';
import RequestTable from '@/components/dashboard/request-table';
import RescheduleRequestTable from '@/components/dashboard/reschedule-request-table';
import FeedbackTable from '@/components/dashboard/feedback-table';
import { fetchCustomers, fetchInstructors, fetchAllLessonRequests, fetchSummaryData, fetchRescheduleRequests, fetchAllFeedback, fetchExistingInstructors } from '@/lib/mock-data';
import type { UserProfile, LessonRequest, SummaryData, RescheduleRequest, Feedback } from '@/types';
import { Users, UserCheck, Search, ListChecks, Repeat, MessageSquare, History, ShieldCheck, BellRing, ClipboardList } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminDashboard() {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [instructors, setInstructors] = useState<UserProfile[]>([]);
  const [existingInstructors, setExistingInstructors] = useState<UserProfile[]>([]);
  const [allLessonRequests, setAllLessonRequests] = useState<LessonRequest[]>([]);
  const [rescheduleRequests, setRescheduleRequests] = useState<RescheduleRequest[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingInstructors, setLoadingInstructors] = useState(true);
  const [loadingExistingInstructors, setLoadingExistingInstructors] = useState(true);
  const [loadingAllLessonRequests, setLoadingAllLessonRequests] = useState(true);
  const [loadingRescheduleRequests, setLoadingRescheduleRequests] = useState(true);
  const [loadingFeedback, setLoadingFeedback] = useState(true);

  const [filters, setFilters] = useState<{ location?: string; subscriptionPlan?: string }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSearchTerm, setTempSearchTerm] = useState(''); 

  const loadInitialDataAndRequests = useCallback(async (currentSearchTerm: string) => {
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

    setLoadingRescheduleRequests(true);
    fetchRescheduleRequests(currentSearchTerm).then(data => {
      setRescheduleRequests(data);
      setLoadingRescheduleRequests(false);
    });

    setLoadingFeedback(true);
    fetchAllFeedback().then(data => {
      setFeedback(data);
      setLoadingFeedback(false);
    });
  }, []);

  const loadFilteredUserData = useCallback(async (
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

    setLoadingExistingInstructors(true);
    fetchExistingInstructors(currentFilters.location, currentFilters.subscriptionPlan, currentSearchTerm).then(data => {
      setExistingInstructors(data);
      setLoadingExistingInstructors(false);
    });
  }, []);


  useEffect(() => {
    loadInitialDataAndRequests(searchTerm);
    loadFilteredUserData(filters, searchTerm);
  }, [loadInitialDataAndRequests, loadFilteredUserData, filters, searchTerm]);


  const handleFilterChange = (newFilters: { location?: string; subscriptionPlan?: string }) => {
    setFilters(newFilters);
  };

  const handleSearch = () => {
    setSearchTerm(tempSearchTerm.trim());
  };

  const handleActioned = () => {
    loadInitialDataAndRequests(searchTerm);
    loadFilteredUserData(filters, searchTerm);
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
        
        <Tabs defaultValue="verifications" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
            <TabsTrigger value="verifications">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Verifications
            </TabsTrigger>
            <TabsTrigger value="requests">
              <BellRing className="mr-2 h-4 w-4" />
              Requests
            </TabsTrigger>
            <TabsTrigger value="management">
              <ClipboardList className="mr-2 h-4 w-4" />
              Management
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="verifications" className="mt-6 space-y-8">
            <UserTable 
              title={<><Users className="inline-block mr-3 h-6 w-6 align-middle" />New Customers</>} 
              users={customers} 
              isLoading={loadingCustomers} 
              onUserActioned={handleActioned}
            />
            <UserTable 
              title={<><UserCheck className="inline-block mr-3 h-6 w-6 align-middle" />New Instructors</>} 
              users={instructors} 
              isLoading={loadingInstructors} 
              onUserActioned={handleActioned}
            />
          </TabsContent>
          
          <TabsContent value="requests" className="mt-6 space-y-8">
             <RequestTable 
              title={<><ListChecks className="inline-block mr-3 h-6 w-6 align-middle" />New Lesson Requests</>} 
              requests={allLessonRequests} 
              isLoading={loadingAllLessonRequests} 
            />
            <RescheduleRequestTable
              title={<><Repeat className="inline-block mr-3 h-6 w-6 align-middle" />Reschedule Requests</>}
              requests={rescheduleRequests}
              isLoading={loadingRescheduleRequests}
              onActioned={handleActioned}
            />
          </TabsContent>

          <TabsContent value="management" className="mt-6 space-y-8">
            <UserTable 
              title={<><History className="inline-block mr-3 h-6 w-6 align-middle" />Existing Instructors</>} 
              users={existingInstructors} 
              isLoading={loadingExistingInstructors} 
              onUserActioned={handleActioned}
            />
            <FeedbackTable
              title={<><MessageSquare className="inline-block mr-3 h-6 w-6 align-middle" />Trainer Feedback</>}
              feedback={feedback}
              isLoading={loadingFeedback}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
