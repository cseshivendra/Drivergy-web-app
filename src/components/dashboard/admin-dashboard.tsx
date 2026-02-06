'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import SummaryMetrics from '@/components/dashboard/summary-metrics';
import FilterControls from '@/components/dashboard/filter-controls';
import UserTable from '@/components/dashboard/user-table';
import RequestTable from '@/components/dashboard/request-table';
import FeedbackTable from '@/components/dashboard/feedback-table';
import ReferralTable from '@/components/dashboard/referral-table';
import { fetchAdminDashboardData } from '@/lib/server-actions';
import type { SummaryData, AdminDashboardData } from '@/types';
import { UserCheck, Search, ListChecks, MessageSquare, ShieldCheck, BarChart2, Library, BookText, HelpCircle, ImagePlay, ClipboardCheck, BookOpen, Gift, Users, History, Repeat, RefreshCw } from 'lucide-react';
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
import RescheduleRequestTable from './reschedule-request-table';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import RevenueView from './revenue-view';

export default function AdminDashboard() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'default';
    const { toast } = useToast();

    const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [filters, setFilters] = useState<{ location?: string; subscriptionPlan?: string }>({});
    const [searchTerm, setSearchTerm] = useState('');

    const isContentManager = user?.contact === 'content@drivergy.in';
    const isRevenueManager = user?.contact === 'revenue@drivergy.in';

    const loadData = useCallback(async (silent = false) => {
        if (!user?.isAdmin) return;
        if (!silent) setLoading(true);
        else setIsRefreshing(true);

        try {
            const data = await fetchAdminDashboardData();
            if (data) {
                setDashboardData(data);
            } else {
                toast({ title: "Load Failed", description: "Could not retrieve dashboard data.", variant: "destructive" });
            }
        } catch (error) {
            console.error("Dashboard data error:", error);
            toast({ title: "Error", description: "An unexpected error occurred while loading data.", variant: "destructive" });
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [user, toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredUsers = useMemo(() => {
        if (!dashboardData?.allUsers) return [];
        return dashboardData.allUsers.filter(user => {
            const normalizedSearchTerm = searchTerm.toLowerCase().trim();
            const searchTermMatch = !normalizedSearchTerm || (
                user.uniqueId.toLowerCase().includes(normalizedSearchTerm) ||
                user.name.toLowerCase().includes(normalizedSearchTerm) ||
                user.contact.toLowerCase().includes(normalizedSearchTerm) ||
                (user.phone && user.phone.toLowerCase().includes(normalizedSearchTerm))
            );
            if (searchTerm) return searchTermMatch;
            const locationMatch = !filters.location || user.location === filters.location;
            const subscriptionMatch = !filters.subscriptionPlan || user.subscriptionPlan === filters.subscriptionPlan;
            return locationMatch && subscriptionMatch;
        });
    }, [dashboardData?.allUsers, filters, searchTerm]);

    const interestedCustomers = useMemo(() => filteredUsers.filter(u => u.uniqueId?.startsWith('CU') && u.subscriptionPlan === 'None'), [filteredUsers]);
    const pendingVerificationCustomers = useMemo(() => filteredUsers.filter(u => u.uniqueId?.startsWith('CU') && u.subscriptionPlan !== 'None' && u.approvalStatus === 'Pending'), [filteredUsers]);
    const existingCustomers = useMemo(() => filteredUsers.filter(u => u.uniqueId?.startsWith('CU') && u.approvalStatus === 'Approved'), [filteredUsers]);
    const cancellationRequests = useMemo(() => filteredUsers.filter(u => u.uniqueId?.startsWith('CU') && u.approvalStatus === 'On Hold'), [filteredUsers]);
    const pendingInstructors = useMemo(() => filteredUsers.filter(u => u.uniqueId?.startsWith('TR') && (!u.approvalStatus || u.approvalStatus === 'Pending' || u.approvalStatus === 'In Progress')), [filteredUsers]);
    const existingInstructors = useMemo(() => filteredUsers.filter(u => u.uniqueId?.startsWith('TR') && u.approvalStatus && ['Approved', 'Rejected'].includes(u.approvalStatus)), [filteredUsers]);

    const handleFilterChange = (newFilters: { location?: string; subscriptionPlan?: string }) => {
        setFilters(newFilters);
        setSearchTerm('');
    };
    
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
        setFilters({});
    };

    const renderDashboardView = () => (
        <>
            <SummaryMetrics data={dashboardData?.summaryData as SummaryData} isLoading={loading} />
            <FilterControls onFilterChange={handleFilterChange} currentFilters={filters} />
            <Tabs defaultValue="verifications" className="w-full mt-8">
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
                        onUserActioned={() => loadData(true)}
                        actionType="new-customer"
                    />
                     <UserTable
                        title={<><Users className="inline-block mr-3 h-6 w-6 align-middle" />Existing Students</>}
                        users={existingCustomers}
                        isLoading={loading}
                        onUserActioned={() => loadData(true)}
                        actionType="existing-customer"
                    />
                    <UserTable
                        title={<><UserCheck className="inline-block mr-3 h-6 w-6 align-middle" />New Instructor Verifications</>}
                        users={pendingInstructors}
                        isLoading={loading}
                        onUserActioned={() => loadData(true)}
                        actionType="new-trainer"
                    />
                    <UserTable
                        title={<><History className="inline-block mr-3 h-6 w-6 align-middle" />Existing Instructors</>}
                        users={existingInstructors}
                        isLoading={loading}
                        onUserActioned={() => loadData(true)}
                        actionType="existing-trainer"
                    />
                </TabsContent>
                <TabsContent value="requests" className="space-y-8">
                    <UserTable
                        title={<><Users className="inline-block mr-3 h-6 w-6 align-middle" />Interested Customers</>}
                        users={interestedCustomers}
                        isLoading={loading}
                        onUserActioned={() => loadData(true)}
                        actionType="interested-customer"
                    />
                     <RequestTable
                        title={<><ListChecks className="inline-block mr-3 h-6 w-6 align-middle" />New Lesson Requests</>}
                        requests={dashboardData?.lessonRequests || []}
                        isLoading={loading}
                    />
                     <RescheduleRequestTable
                        title={<><Repeat className="inline-block mr-3 h-6 w-6 align-middle" />Lesson Reschedule Requests</>}
                        requests={dashboardData?.rescheduleRequests || []}
                        isLoading={loading}
                        onActioned={() => loadData(true)}
                    />
                     <UserTable
                        title={<><Repeat className="inline-block mr-3 h-6 w-6 align-middle" />Subscription Cancellation Requests</>}
                        users={cancellationRequests}
                        isLoading={loading}
                        onUserActioned={() => loadData(true)}
                        actionType="cancellation-request"
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
            onActioned={() => loadData(true)}
        />
    );

    const renderContentView = () => (
        <div className="space-y-8">
            <CourseManagement
                title={<><BookOpen className="inline-block mr-3 h-6 w-6 align-middle" />Course Management</>}
                courses={dashboardData?.courses || []}
                isLoading={loading}
                onAction={() => loadData(true)}
            />
            <BlogManagement
                title={<><BookText className="inline-block mr-3 h-6 w-6 align-middle" />Blog Post Management</>}
                posts={dashboardData?.blogPosts || []}
                isLoading={loading}
                onAction={() => loadData(true)}
            />
            <FaqManagement
                title={<><HelpCircle className="inline-block mr-3 h-6 w-6 align-middle" />FAQ Management</>}
                faqs={dashboardData?.faqs || []}
                isLoading={loading}
                onAction={() => loadData(true)}
            />
            <VisualContentManagement 
                title={<><ImagePlay className="inline-block mr-3 h-6 w-6 align-middle" />Visual Content</>}
                banners={dashboardData?.siteBanners || []}
                posters={dashboardData?.promotionalPosters || []}
                isLoading={loading}
                onAction={() => loadData(true)}
            />
             <QuizManagement
                title={<><ClipboardCheck className="inline-block mr-3 h-6 w-6 align-middle" />RTO Quiz Management</>}
                quizSets={dashboardData?.quizSets || []}
                isLoading={loading}
                onAction={() => loadData(true)}
            />
        </div>
    );

    const renderRevenueView = () => (
        <RevenueView activeTab={activeTab === 'default' ? 'transactions' : activeTab} />
    );

    const renderCurrentTab = () => {
        // Strict role-based rendering for specialized managers
        if (isContentManager) return renderContentView();
        if (isRevenueManager) return renderRevenueView();

        // Standard admin tab logic
        switch(activeTab) {
            case 'content': return renderContentView();
            case 'referrals': return renderReferralsView();
            case 'transactions':
            case 'commission':
            case 'payouts':
            case 'reports':
            case 'earnings':
                return renderRevenueView();
            default: return renderDashboardView();
        }
    }

    const getPageTitle = () => {
        if (isContentManager) return 'Content Management';
        if (isRevenueManager) return 'Revenue Management';
        switch(activeTab) {
            case 'content': return 'Content Management';
            case 'referrals': return 'Referral Management';
            case 'transactions':
            case 'commission':
            case 'payouts':
            case 'reports':
            case 'earnings':
                return 'Revenue Management';
            default: return 'Admin Dashboard';
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <main className="container mx-auto max-w-7xl p-4 py-8 sm:p-6 lg:p-8 space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <h1 className="font-headline text-3xl font-semibold tracking-tight text-foreground">
                            {getPageTitle()}
                        </h1>
                        <Button variant="outline" size="icon" onClick={() => loadData(true)} disabled={loading || isRefreshing}>
                            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                        </Button>
                    </div>
                    {!isContentManager && !isRevenueManager && (
                        <div className="relative w-full sm:w-auto sm:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="h-10 pl-10 w-full"
                            />
                        </div>
                    )}
                </div>
                {renderCurrentTab()}
            </main>
        </div>
    );
}
