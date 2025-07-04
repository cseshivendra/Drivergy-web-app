
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import SummaryMetrics from '@/components/dashboard/summary-metrics';
import FilterControls from '@/components/dashboard/filter-controls';
import UserTable from '@/components/dashboard/user-table';
import RequestTable from '@/components/dashboard/request-table';
import RescheduleRequestTable from '@/components/dashboard/reschedule-request-table';
import FeedbackTable from '@/components/dashboard/feedback-table';
import { fetchAllUsers, fetchAllLessonRequests, fetchSummaryData, fetchRescheduleRequests, fetchAllFeedback, fetchCustomerLessonProgress, fetchAllReferrals, fetchCourses, fetchQuizSets, fetchFaqs, fetchBlogPosts, fetchSiteBanners, fetchPromotionalPosters } from '@/lib/mock-data';
import type { UserProfile, LessonRequest, SummaryData, RescheduleRequest, Feedback, LessonProgressData, Referral, Course, QuizSet, FaqItem, BlogPost, SiteBanner, PromotionalPoster } from '@/types';
import { UserCheck, Search, ListChecks, Repeat, MessageSquare, History, ShieldCheck, BarChart2, Gift, Library, BookText, HelpCircle, ImagePlay, ClipboardCheck, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import LessonProgressTable from './lesson-progress-table';
import ReferralTable from './referral-table';
import CourseManagement from './course-management';
import QuizManagement from './quiz-management';
import FaqManagement from './faq-management';
import BlogManagement from './blog-management';
import VisualContentManagement from './visual-content-management';

export default function AdminDashboard() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab');

  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
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

  const loadAllData = useCallback(async () => {
    setLoading(true);

    try {
      const [
        summary, users, lessonRequests, reschedules, feedbackData,
        progressData, referralData, courseData, quizData, faqData,
        blogData, bannerData, posterData
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
        fetchFaqs(),
        fetchBlogPosts(),
        fetchSiteBanners(),
        fetchPromotionalPosters(),
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
      setFaqs(faqData);
      setBlogPosts(blogData);
      setSiteBanners(bannerData);
      setPromotionalPosters(posterData);

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

  const renderDashboardView = () => (
    <div className="space-y-8">
      <SummaryMetrics data={summaryData} isLoading={loading} />
      <FilterControls onFilterChange={handleFilterChange} currentFilters={filters} />
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
    </div>
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto max-w-7xl p-4 py-8 sm:p-6 lg:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="font-headline text-3xl font-semibold tracking-tight text-foreground">
            {activeTab === 'content' ? 'Content Management' : 'Admin Dashboard'}
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
        
        {activeTab === 'content' ? renderContentView() : renderDashboardView()}
        
      </main>
    </div>
  );
}
