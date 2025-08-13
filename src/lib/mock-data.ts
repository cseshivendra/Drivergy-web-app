// This file is being replaced by live Firestore data fetching.
// The functions are now implemented in `src/lib/server-data.ts` (for server)
// and directly within components/contexts using hooks (for client).

// We will keep this file for now to avoid breaking imports, but it will be empty.
// In a real project, you would delete this file and update all imports.

import type { UserProfile, LessonRequest, SummaryData, Course, CourseModule, RescheduleRequest, Feedback, LessonProgressData, Referral, QuizSet, FaqItem, BlogPost, SiteBanner, PromotionalPoster, AdminDashboardData } from '@/types';

// The mock data arrays are no longer needed as we will use Firestore.
export let allUsers: UserProfile[] = [];
export let mockCourses: Course[] = [];
export let mockFaqs: FaqItem[] = [];
export let mockQuizSets: QuizSet[] = [];
export let mockBlogPosts: BlogPost[] = [];
export let mockSiteBanners: SiteBanner[] = [];
export let mockPromotionalPosters: PromotionalPoster[] = [];
export let mockLessonRequests: LessonRequest[] = [];
export let mockRescheduleRequests: RescheduleRequest[] = [];
export let mockFeedback: Feedback[] = [];
export let mockReferrals: Referral[] = [];
