

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import SummaryMetrics from '@/components/dashboard/summary-metrics';
import FilterControls from '@/components/dashboard/filter-controls';
import UserTable from '@/components/dashboard/user-table';
import RequestTable from '@/components/dashboard/request-table';
import FeedbackTable from '@/components/dashboard/feedback-table';
import ReferralTable from '@/components/dashboard/referral-table';
import { listenToAdminDashboardData } from '@/lib/mock-data';
import type { UserProfile, LessonRequest, SummaryData, Feedback, LessonProgressData, Course, QuizSet, FaqItem, BlogPost, SiteBanner, PromotionalPoster, Referral, AdminDashboardData } from '@/types';
import { UserCheck, Search, ListChecks, MessageSquare, ShieldCheck, BarChart2, Library, BookText, HelpCircle, ImagePlay, ClipboardCheck, BookOpen, Gift, Users, History } from 'lucide-react';
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

    const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
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
        const unsubscribe = listenToAdminDashboardData((data) => {
            setDashboardData(data);
            setLoading(false);
        });

        // Cleanup function
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user]);


    const filteredUsers = useMemo(() => {
        if (!dashboardData?.allUsers) return [];
        return dashboardData.allUsers.filter(user => {
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
    }, [dashboardData?.allUsers, filters, searchTerm]);

    // Separate lists for different user states
    const interestedCustomers = useMemo(() => filteredUsers.filter(u => u.uniqueId?.startsWith('CU') && u.subscriptionPlan === 'None' && u.approvalStatus === 'Pending'), [filteredUsers]);
    const pendingVerificationCustomers = useMemo(() => filteredUsers.filter(u => u.uniqueId?.startsWith('CU') && u.subscriptionPlan !== 'None' && u.approvalStatus === 'Pending'), [filteredUsers]);
    const pendingInstructors = useMemo(() => filteredUsers.filter(u => u.uniqueId?.startsWith('TR') && (!u.approvalStatus || u.approvalStatus === 'Pending' || u.approvalStatus === 'In Progress')), [filteredUsers]);
    const existingInstructors = useMemo(() => filteredUsers.filter(u => u.uniqueId?.startsWith('TR') && u.approvalStatus && ['Approved', 'Rejected'].includes(u.approvalStatus)), [filteredUsers]);


    const handleFilterChange = (newFilters: { location?: string; subscriptionPlan?: string }) => {
        setFilters(newFilters);
    };

    const handleSearch = () => {
        setSearchTerm(tempSearchTerm.trim());
    };

    // With a unified listener, this callback is less critical, but good to keep for potential manual refetches.
    const handleActioned = useCallback(() => {}, []);

    const renderDashboardView = () => (
        <>
            <SummaryMetrics data={dashboardData?.summaryData as SummaryData} isLoading={loading} />
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
                        users={pendingVerificationCustomers}
                        isLoading={loading}
                        onUserActioned={handleActioned}
                    />
                    <UserTable
                        title={<><UserCheck className="inline-block mr-3 h-6 w-6 align-middle" />New Instructor Verifications</>}
                        users={pendingInstructors}
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
                    <UserTable
                        title={<><Users className="inline-block mr-3 h-6 w-6 align-middle" />Interested Customers</>}
                        users={interestedCustomers}
                        isLoading={loading}
                        onUserActioned={handleActioned}
                        isInterestedList={true}
                    />
                    <RequestTable
                        title={<><ListChecks className="inline-block mr-3 h-6 w-6 align-middle" />New Lesson Requests</>}
                        requests={dashboardData?.lessonRequests || []}
                        isLoading={loading}
                    />
                </TabsContent>
                <TabsContent value="progress" className="space-y-8">
                    <LessonProgressTable
                        title={<><BarChart2 className="inline-block mr-3 h-6 w-6 align-middle" />Student Lesson Progress</>}
                        data={dashboardData?.lessonProgress || []}
                        isLoading={loading}
                    />
                </TabsContent>
                <TabsContent value="feedback" className="space-y-8">
                    <FeedbackTable
                        title={<><MessageSquare className="inline-block mr-3 h-6 w-6 align-middle" />Trainer Feedback</>}
                        feedback={dashboardData?.feedback || []}
                        isLoading={loading}
                    />
                </TabsContent>
            </Tabs>
        </>
    );

    const renderReferralsView = () => (
        <ReferralTable
            title={<><Gift className="inline-block mr-3 h-6 w-6 align-middle" />Referral Program Management</>}
            referrals={dashboardData?.referrals || []}
            isLoading={loading}
            onActioned={handleActioned}
        />
    );

    const renderContentView = () => (
        <div className="space-y-8">
            <BlogManagement
                title={<><BookText className="inline-block mr-3 h-6 w-6 align-middle" />Blog Post Management</>}
                posts={dashboardData?.blogPosts || []}
                isLoading={loading}
                onAction={handleActioned}
            />
            <FaqManagement
                title={<><HelpCircle className="inline-block mr-3 h-6 w-6 align-middle" />FAQ Management</>}
                faqs={dashboardData?.faqs || []}
                isLoading={loading}
                onAction={handleActioned}
            />
            <VisualContentManagement
                title={<><ImagePlay className="inline-block mr-3 h-6 w-6 align-middle" />Banners & Posters Management</>}
                banners={dashboardData?.siteBanners || []}
                posters={dashboardData?.promotionalPosters || []}
                isLoading={loading}
                onAction={handleActioned}
            />
            <CourseManagement
                title={<><BookOpen className="inline-block mr-3 h-6 w-6 align-middle" />Course Content Management</>}
                courses={dashboardData?.courses || []}
                isLoading={loading}
                onAction={handleActioned}
            />
            <QuizManagement
                title={<><ClipboardCheck className="inline-block mr-3 h-6 w-6 align-middle" />RTO Quiz Management</>}
                quizSets={dashboardData?.quizSets || []}
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
