

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import SummaryMetrics from '@/components/dashboard/summary-metrics';
import FilterControls from '@/components/dashboard/filter-controls';
import UserTable from '@/components/dashboard/user-table';
import RequestTable from '@/components/dashboard/request-table';
import FeedbackTable from '@/components/dashboard/feedback-table';
import ReferralTable from '@/components/dashboard/referral-table';
import {
  listenToSummaryData,
  listenToAllLessonRequests,
  listenToAllFeedback,
  listenToCustomerLessonProgress,
  listenToQuizSets,
  listenToFaqs,
  listenToBlogPosts,
  listenToSiteBanners,
  listenToPromotionalPosters,
  listenToAllReferrals,
  listenToCourses,
  listenToAllUsers,
  listenToAllTrainers,
} from '@/lib/mock-data';
import type { UserProfile, LessonRequest, SummaryData, RescheduleRequest, Feedback, LessonProgressData, Course, QuizSet, FaqItem, BlogPost, SiteBanner, PromotionalPoster, Referral } from '@/types';
import { UserCheck, Search, ListChecks, Repeat, MessageSquare, History, ShieldCheck, BarChart2, Library, BookText, HelpCircle, ImagePlay, ClipboardCheck, BookOpen, Gift, Users } from 'lucide-react';
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
  const [allCustomers, setAllCustomers] = useState<UserProfile[]>([]);
  const [allTrainers, setAllTrainers] = useState<UserProfile[]>([]);
  const [allLessonRequests, setAllLessonRequests] = useState<LessonRequest[]>([]);
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
  
  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    }

    setLoading(true);

    // If it's the mock admin, don't try to fetch from Firebase.
    // This prevents the permission errors and allows the dashboard to render.
    if (user.uniqueId === 'AD-001') {
        setSummaryData({ totalCustomers: 0, totalInstructors: 0, activeSubscriptions: 0, pendingRequests: 0, pendingRescheduleRequests: 0, totalEarnings: 0, totalCertifiedTrainers: 0});
        setAllCustomers([]);
        setAllTrainers([]);
        setAllLessonRequests([]);
        setFeedback([]);
        setReferrals([]);
        setLessonProgress([]);
        setCourses([]);
        setQuizSets([]);
        setFaqs([]);
        setBlogPosts([]);
        setSiteBanners([]);
        setPromotionalPosters([]);
        setLoading(false);
        return;
    }
    
    const subscriptions = [
        listenToSummaryData(setSummaryData),
        listenToAllLessonRequests(setAllLessonRequests),
        listenToAllFeedback(setFeedback),
        listenToAllReferrals(setReferrals),
        listenToCustomerLessonProgress(setLessonProgress),
        listenToCourses(setCourses),
        listenToQuizSets(setQuizSets),
        listenToFaqs(setFaqs),
        listenToBlogPosts(setBlogPosts),
        listenToSiteBanners(setSiteBanners),
        listenToPromotionalPosters(setPromotionalPosters),
        listenToAllUsers(setAllCustomers),
        listenToAllTrainers(setAllTrainers),
    ].filter(Boolean);
    
    // Unified loading state management
    const loadingTimeout = setTimeout(() => {
        setLoading(false);
    }, 2500); // Increased timeout to allow all listeners to establish

    // Cleanup function
    return () => {
        subscriptions.forEach(unsubscribe => {
            if (unsubscribe) unsubscribe();
        });
        clearTimeout(loadingTimeout);
    };
  }, [user]);

  
  const filteredCustomers = useMemo(() => {
    return allCustomers.filter(user => {
      const searchTermMatch = !searchTerm || (
          user.uniqueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.contact && user.contact.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      // If a search term is present, only match against that.
      if (searchTerm) return searchTermMatch;
      
      const locationMatch = !filters.location || user.location === filters.location;
      const subscriptionMatch = !filters.subscriptionPlan || user.subscriptionPlan === filters.subscriptionPlan;
      
      return locationMatch && subscriptionMatch;
    });
  }, [allCustomers, filters, searchTerm]);
  
  const filteredTrainers = useMemo(() => {
    return allTrainers.filter(user => {
      const searchTermMatch = !searchTerm || (
          user.uniqueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.contact && user.contact.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      // If a search term is present, only match against that.
      if (searchTerm) return searchTermMatch;
      
      const locationMatch = !filters.location || user.location === filters.location;
      
      return locationMatch;
    });
  }, [allTrainers, filters, searchTerm]);

  // Separate lists for different customer states
  const interestedCustomers = useMemo(() => filteredCustomers.filter(u => u.subscriptionPlan === 'None' && u.approvalStatus === 'Pending'), [filteredCustomers]);
  const pendingVerificationCustomers = useMemo(() => filteredCustomers.filter(u => u.subscriptionPlan !== 'None' && u.approvalStatus === 'Pending'), [filteredCustomers]);
  const pendingInstructors = useMemo(() => filteredTrainers.filter(u => u.approvalStatus === 'Pending' || u.approvalStatus === 'In Progress'), [filteredTrainers]);
  const existingInstructors = useMemo(() => filteredTrainers.filter(u => u.approvalStatus && ['Approved', 'Rejected'].includes(u.approvalStatus)), [filteredTrainers]);


  const handleFilterChange = (newFilters: { location?: string; subscriptionPlan?: string }) => {
    setFilters(newFilters);
  };

  const handleSearch = () => {
    setSearchTerm(tempSearchTerm.trim());
  };

  const handleActioned = useCallback(() => {
    // This function can be used to manually trigger re-fetches if needed,
    // but with real-time listeners, it's often not necessary.
  }, []);

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
            title={<><Users className="inline-block mr-3 h-6 w-6 align-middle" />Interested Customers</>} 
            users={interestedCustomers}
            collectionName="users"
            isLoading={loading} 
            onUserActioned={handleActioned}
            isInterestedList={true}
          />
          <UserTable 
            title={<><ShieldCheck className="inline-block mr-3 h-6 w-6 align-middle" />New Customer Verifications</>} 
            users={pendingVerificationCustomers}
            collectionName="users"
            isLoading={loading} 
            onUserActioned={handleActioned}
          />
          <UserTable 
            title={<><UserCheck className="inline-block mr-3 h-6 w-6 align-middle" />New Instructor Verifications</>} 
            users={pendingInstructors} 
            collectionName="trainers"
            isLoading={loading} 
            onUserActioned={handleActioned}
          />
          <UserTable 
            title={<><History className="inline-block mr-3 h-6 w-6 align-middle" />Existing Instructors</>} 
            users={existingInstructors}
            collectionName="trainers"
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
