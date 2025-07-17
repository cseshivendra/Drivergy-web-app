
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import SummaryMetrics from '@/components/dashboard/summary-metrics';
import FilterControls from '@/components/dashboard/filter-controls';
import UserTable from '@/components/dashboard/user-table';
import RequestTable from '@/components/dashboard/request-table';
import RescheduleRequestTable from '@/components/dashboard/reschedule-request-table';
import FeedbackTable from '@/components/dashboard/feedback-table';
import ReferralTable from '@/components/dashboard/referral-table';
import {
  listenToSummaryData,
  listenToAllUsers,
  listenToAllLessonRequests,
  listenToRescheduleRequests,
  listenToAllFeedback,
  listenToCustomerLessonProgress,
  listenToQuizSets,
  listenToFaqs,
  listenToBlogPosts,
  listenToSiteBanners,
  listenToPromotionalPosters,
  listenToAllReferrals,
  listenToCourses,
} from '@/lib/mock-data';
import type { UserProfile, LessonRequest, SummaryData, RescheduleRequest, Feedback, LessonProgressData, Course, QuizSet, FaqItem, BlogPost, SiteBanner, PromotionalPoster, Referral } from '@/types';
import { UserCheck, Search, ListChecks, Repeat, MessageSquare, History, ShieldCheck, BarChart2, Library, BookText, HelpCircle, ImagePlay, ClipboardCheck, BookOpen, Gift } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LessonProgressTable from './lesson-progress-table';
import CourseManagement from './course-management';
import QuizManagement from './quiz-management';
import FaqManagement from './faq-management';
import BlogManagement from './blog-management';
import VisualContentManagement from './visual-content-management';
import { useAuth } from '@/context/auth-context';

export default function AdminDashboard() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab');

  const [summaryData, setSummaryData] = useState<Partial<SummaryData>>({});
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allLessonRequests, setAllLessonRequests] = useState<LessonRequest[]>([]);
  const [rescheduleRequests, setRescheduleRequests] = useState<RescheduleRequest[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [lessonProgress, setLessonProgress] = useState<LessonProgressData[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizSets, setQuizSets] = useState<QuizSet[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [siteBanners, setSiteBanners] = useState<SiteBanner[]>([]);
  const [promotionalPosters, setPromotionalPosters] = useState<PromotionalPoster[]>([]);

  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<{ location?: string; subscriptionPlan?: string }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSearchTerm, setTempSearchTerm] = useState('');
  
  // Real-time data listeners
  useEffect(() => {
    if (!user) {
        setLoading(false); // If no user, no need to load data
        return;
    }
    setLoading(true);

    const subscriptions = [
      listenToSummaryData(setSummaryData),
      listenToAllUsers(setAllUsers),
      listenToAllLessonRequests(setAllLessonRequests),
      listenToRescheduleRequests(setRescheduleRequests),
      listenToAllFeedback(setFeedback),
      listenToAllReferrals(setReferrals),
      listenToCustomerLessonProgress(setLessonProgress),
      listenToCourses(setCourses),
      listenToQuizSets(setQuizSets),
      listenToFaqs(setFaqs),
      listenToBlogPosts(setBlogPosts),
      listenToSiteBanners(setSiteBanners),
      listenToPromotionalPosters(setPromotionalPosters),
    ];
    
    // A simple mechanism to hide the main loader once all initial data has likely arrived.
    const loadingTimeout = setTimeout(() => setLoading(false), 2500);

    // Cleanup listeners on component unmount
    return () => {
      subscriptions.forEach(unsubscribe => unsubscribe());
      clearTimeout(loadingTimeout);
    };
  }, [user]);

  
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
    // With real-time listeners, we no longer need to manually trigger a data refresh.
    // The UI will update automatically.
  };

  const renderDashboardView = () => (
    <>
      <SummaryMetrics data={summaryData as SummaryData} isLoading={loading} />
      <FilterControls onFilterChange={handleFilterChange} currentFilters={filters} />
      <Tabs defaultValue="verifications" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6">
          <TabsTrigger value="verifications">Verifications</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>
        <TabsContent value="verifications" className="space-y-8">
          <UserTable 
            title={<><ShieldCheck className="inline-block mr-3 h-6 w-6 align-middle" />New Customer Verifications</>} 
            users={customers} 
            isLoading={loading} 
            onUserActioned={handleActioned}
          />
          <UserTable 
            title={<><UserCheck className="inline-block mr-3 h-6 w-6 align-middle" />New Instructor Verifications</>} 
            users={instructors} 
            isLoading={loading} 
            onUserActioned={handleActioned}
          />
          <UserTable 
            title={<><History className="inline-block mr-3 h-6 w-6 align-middle" />Existing Instructors</>} 
            users={existingInstructors} 
            isLoading={loading} 
            onUserActioned={handleActioned}
          />
        </TabsContent>
        <TabsContent value="requests" className="space-y-8">
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
        <TabsContent value="progress" className="space-y-8">
            <LessonProgressTable
                title={<><BarChart2 className="inline-block mr-3 h-6 w-6 align-middle" />Student Lesson Progress</>}
                data={lessonProgress}
                isLoading={loading}
            />
        </TabsContent>
        <TabsContent value="feedback" className="space-y-8">
             <FeedbackTable
                title={<><MessageSquare className="inline-block mr-3 h-6 w-6 align-middle" />Trainer Feedback</>}
                feedback={feedback}
                isLoading={loading}
            />
        </TabsContent>
      </Tabs>
    </>
  );

  const renderReferralsView = () => (
    <ReferralTable
        title={<><Gift className="inline-block mr-3 h-6 w-6 align-middle" />Referral Program Management</>}
        referrals={referrals}
        isLoading={loading}
        onActioned={handleActioned}
    />
  );
  
  const renderContentView = () => (
    <div className="space-y-8">
      <BlogManagement
        title={<><BookText className="inline-block mr-3 h-6 w-6 align-middle" />Blog Post Management</>}
        posts={blogPosts}
        isLoading={loading}
        onAction={handleActioned}
      />
      <FaqManagement
        title={<><HelpCircle className="inline-block mr-3 h-6 w-6 align-middle" />FAQ Management</>}
        faqs={faqs}
        isLoading={loading}
        onAction={handleActioned}
      />
      <VisualContentManagement
        title={<><ImagePlay className="inline-block mr-3 h-6 w-6 align-middle" />Banners & Posters Management</>}
        banners={siteBanners}
        posters={promotionalPosters}
        isLoading={loading}
        onAction={handleActioned}
      />
      <CourseManagement
        title={<><BookOpen className="inline-block mr-3 h-6 w-6 align-middle" />Course Content Management</>}
        courses={courses}
        isLoading={loading}
        onAction={handleActioned}
      />
      <QuizManagement
        title={<><ClipboardCheck className="inline-block mr-3 h-6 w-6 align-middle" />RTO Quiz Management</>}
        quizSets={quizSets}
        isLoading={loading}
        onAction={handleActioned}
      />
    </div>
  );

  const renderCurrentTab = () => {
    switch(activeTab) {
      case 'content': return renderContentView();
      case 'referrals': return renderReferralsView();
      default: return renderDashboardView();
    }
  }

  const getPageTitle = () => {
    switch(activeTab) {
      case 'content': return 'Content Management';
      case 'referrals': return 'Referral Management';
      default: return 'Admin Dashboard';
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto max-w-7xl p-4 py-8 sm:p-6 lg:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="font-headline text-3xl font-semibold tracking-tight text-foreground">
            {getPageTitle()}
          </h1>
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
        
        {renderCurrentTab()}
        
      </main>
    </div>
  );
}
