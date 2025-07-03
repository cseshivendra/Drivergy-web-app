
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import SummaryMetrics from '@/components/dashboard/summary-metrics';
import FilterControls from '@/components/dashboard/filter-controls';
import UserTable from '@/components/dashboard/user-table';
import RequestTable from '@/components/dashboard/request-table';
import RescheduleRequestTable from '@/components/dashboard/reschedule-request-table';
import FeedbackTable from '@/components/dashboard/feedback-table';
import { fetchAllUsers, fetchAllLessonRequests, fetchSummaryData, fetchRescheduleRequests, fetchAllFeedback, fetchCustomerLessonProgress } from '@/lib/mock-data';
import type { UserProfile, LessonRequest, SummaryData, RescheduleRequest, Feedback, LessonProgressData } from '@/types';
import { Users, UserCheck, Search, ListChecks, Repeat, MessageSquare, History, ShieldCheck, BellRing, ClipboardList, BarChart2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LessonProgressTable from './lesson-progress-table';

export default function AdminDashboard() {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allLessonRequests, setAllLessonRequests] = useState<LessonRequest[]>([]);
  const [rescheduleRequests, setRescheduleRequests] = useState<RescheduleRequest[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [lessonProgress, setLessonProgress] = useState<LessonProgressData[]>([]);

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingAllLessonRequests, setLoadingAllLessonRequests] = useState(true);
  const [loadingRescheduleRequests, setLoadingRescheduleRequests] = useState(true);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [loadingLessonProgress, setLoadingLessonProgress] = useState(true);

  const [filters, setFilters] = useState<{ location?: string; subscriptionPlan?: string }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSearchTerm, setTempSearchTerm] = useState('');

  const loadAllData = useCallback(async () => {
    setLoadingSummary(true);
    setLoadingUsers(true);
    setLoadingAllLessonRequests(true);
    setLoadingRescheduleRequests(true);
    setLoadingFeedback(true);
    setLoadingLessonProgress(true);

    try {
      const [
        summary,
        users,
        lessonRequests,
        reschedules,
        feedbackData,
        progressData,
      ] = await Promise.all([
        fetchSummaryData(),
        fetchAllUsers(),
        fetchAllLessonRequests(),
        fetchRescheduleRequests(),
        fetchAllFeedback(),
        fetchCustomerLessonProgress(),
      ]);
      
      setSummaryData(summary);
      setAllUsers(users);
      setAllLessonRequests(lessonRequests);
      setRescheduleRequests(reschedules);
      setFeedback(feedbackData);
      setLessonProgress(progressData);

    } catch (error) {
        console.error("Error loading dashboard data:", error);
    } finally {
        setLoadingSummary(false);
        setLoadingUsers(false);
        setLoadingAllLessonRequests(false);
        setLoadingRescheduleRequests(false);
        setLoadingFeedback(false);
        setLoadingLessonProgress(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);
  
  const filteredUsers = useMemo(() => {
    return allUsers.filter(user => {
        const locationMatch = !filters.location || user.location === filters.location;
        const subscriptionMatch = !filters.subscriptionPlan || user.subscriptionPlan === filters.subscriptionPlan;
        
        const searchTermMatch = !searchTerm || (
            user.uniqueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.contact.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return locationMatch && subscriptionMatch && searchTermMatch;
    });
  }, [allUsers, filters, searchTerm]);

  const customers = useMemo(() => filteredUsers.filter(u => u.uniqueId.startsWith('CU') && u.approvalStatus === 'Pending'), [filteredUsers]);
  const instructors = useMemo(() => filteredUsers.filter(u => u.uniqueId.startsWith('TR') && ['Pending', 'In Progress'].includes(u.approvalStatus)), [filteredUsers]);
  const existingInstructors = useMemo(() => filteredUsers.filter(u => u.uniqueId.startsWith('TR') && ['Approved', 'Rejected'].includes(u.approvalStatus)), [filteredUsers]);


  const handleFilterChange = (newFilters: { location?: string; subscriptionPlan?: string }) => {
    setFilters(newFilters);
  };

  const handleSearch = () => {
    setSearchTerm(tempSearchTerm.trim());
  };

  const handleActioned = () => {
    loadAllData();
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
              isLoading={loadingUsers} 
              onUserActioned={handleActioned}
            />
            <UserTable 
              title={<><UserCheck className="inline-block mr-3 h-6 w-6 align-middle" />New Instructors</>} 
              users={instructors} 
              isLoading={loadingUsers} 
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
            <LessonProgressTable
              title={<><BarChart2 className="inline-block mr-3 h-6 w-6 align-middle" />Student Lesson Progress</>}
              data={lessonProgress}
              isLoading={loadingLessonProgress}
            />
            <UserTable 
              title={<><History className="inline-block mr-3 h-6 w-6 align-middle" />Existing Instructors</>} 
              users={existingInstructors} 
              isLoading={loadingUsers} 
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
