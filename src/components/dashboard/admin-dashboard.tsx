
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import SummaryMetrics from '@/components/dashboard/summary-metrics';
import FilterControls from '@/components/dashboard/filter-controls';
import UserTable from '@/components/dashboard/user-table';
import RequestTable from '@/components/dashboard/request-table';
import RescheduleRequestTable from '@/components/dashboard/reschedule-request-table';
import FeedbackTable from '@/components/dashboard/feedback-table';
import { fetchAllUsers, fetchAllLessonRequests, fetchSummaryData, fetchRescheduleRequests, fetchAllFeedback, fetchCustomerLessonProgress, fetchAllReferrals, fetchCourses, fetchQuizSets } from '@/lib/mock-data';
import type { UserProfile, LessonRequest, SummaryData, RescheduleRequest, Feedback, LessonProgressData, Referral, Course, QuizSet } from '@/types';
import { Users, UserCheck, Search, ListChecks, Repeat, MessageSquare, History, ShieldCheck, BellRing, ClipboardList, BarChart2, Gift, Library } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LessonProgressTable from './lesson-progress-table';
import ReferralTable from './referral-table';
import CourseManagement from './course-management';
import QuizManagement from './quiz-management';

export default function AdminDashboard() {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allLessonRequests, setAllLessonRequests] = useState<LessonRequest[]>([]);
  const [rescheduleRequests, setRescheduleRequests] = useState<RescheduleRequest[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [lessonProgress, setLessonProgress] = useState<LessonProgressData[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizSets, setQuizSets] = useState<QuizSet[]>([]);

  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<{ location?: string; subscriptionPlan?: string }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSearchTerm, setTempSearchTerm] = useState('');

  const loadAllData = useCallback(async () => {
    setLoading(true);

    try {
      const [
        summary, users, lessonRequests, reschedules, feedbackData,
        progressData, referralData, courseData, quizData
      ] = await Promise.all([
        fetchSummaryData(),
        fetchAllUsers(),
        fetchAllLessonRequests(),
        fetchRescheduleRequests(),
        fetchAllFeedback(),
        fetchCustomerLessonProgress(),
        fetchAllReferrals(),
        fetchCourses(),
        fetchQuizSets(),
      ]);
      
      setSummaryData(summary);
      setAllUsers(users);
      setAllLessonRequests(lessonRequests);
      setRescheduleRequests(reschedules);
      setFeedback(feedbackData);
      setLessonProgress(progressData);
      setReferrals(referralData);
      setCourses(courseData);
      setQuizSets(quizData);

    } catch (error) {
        console.error("Error loading dashboard data:", error);
    } finally {
        setLoading(false);
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
        
        <SummaryMetrics data={summaryData} isLoading={loading} />
        
        <FilterControls 
          onFilterChange={handleFilterChange} 
          currentFilters={filters}
        />
        
        <Tabs defaultValue="verifications" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
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
            <TabsTrigger value="content">
              <Library className="mr-2 h-4 w-4" />
              Content
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="verifications" className="mt-6 space-y-8">
            <UserTable 
              title={<><Users className="inline-block mr-3 h-6 w-6 align-middle" />New Customers</>} 
              users={customers} 
              isLoading={loading} 
              onUserActioned={handleActioned}
            />
            <UserTable 
              title={<><UserCheck className="inline-block mr-3 h-6 w-6 align-middle" />New Instructors</>} 
              users={instructors} 
              isLoading={loading} 
              onUserActioned={handleActioned}
            />
          </TabsContent>
          
          <TabsContent value="requests" className="mt-6 space-y-8">
             <RequestTable 
              title={<><ListChecks className="inline-block mr-3 h-6 w-6 align-middle" />New Lesson Requests</>} 
              requests={allLessonRequests} 
              isLoading={loading} 
            />
            <RescheduleRequestTable
              title={<><Repeat className="inline-block mr-3 h-6 w-6 align-middle" />Reschedule Requests</>}
              requests={rescheduleRequests}
              isLoading={loading}
              onActioned={handleActioned}
            />
          </TabsContent>

          <TabsContent value="management" className="mt-6 space-y-8">
            <ReferralTable
              title={<><Gift className="inline-block mr-3 h-6 w-6 align-middle" />Referral Management</>}
              referrals={referrals}
              isLoading={loading}
              onActioned={handleActioned}
            />
            <LessonProgressTable
              title={<><BarChart2 className="inline-block mr-3 h-6 w-6 align-middle" />Student Lesson Progress</>}
              data={lessonProgress}
              isLoading={loading}
            />
            <UserTable 
              title={<><History className="inline-block mr-3 h-6 w-6 align-middle" />Existing Instructors</>} 
              users={existingInstructors} 
              isLoading={loading} 
              onUserActioned={handleActioned}
            />
            <FeedbackTable
              title={<><MessageSquare className="inline-block mr-3 h-6 w-6 align-middle" />Trainer Feedback</>}
              feedback={feedback}
              isLoading={loading}
            />
          </TabsContent>

          <TabsContent value="content" className="mt-6 space-y-8">
            <CourseManagement
              title={<>Course Content Management</>}
              courses={courses}
              isLoading={loading}
              onAction={handleActioned}
            />
            <QuizManagement
              title={<>RTO Quiz Management</>}
              quizSets={quizSets}
              isLoading={loading}
              onAction={handleActioned}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
