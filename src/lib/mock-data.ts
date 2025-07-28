import type { UserProfile, LessonRequest, SummaryData, VehicleType, Course, CourseModule, CustomerRegistrationFormValues, TrainerRegistrationFormValues, ApprovalStatusType, RescheduleRequest, RescheduleRequestStatusType, UserProfileUpdateValues, TrainerSummaryData, Feedback, LessonProgressData, Referral, PayoutStatusType, QuizSet, Question, CourseModuleFormValues, QuizQuestionFormValues, FaqItem, BlogPost, SiteBanner, PromotionalPoster, FaqFormValues, BlogPostFormValues, VisualContentFormValues, FullCustomerDetailsValues, AdminDashboardData } from '@/types';
import { addDays, format, isFuture, parse } from 'date-fns';
import { Car, Bike, FileText } from 'lucide-react';
import { isFirebaseConfigured } from './firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { uploadFile } from './server-actions'; 

// All functions that interacted with Firestore have been removed.
// This file is now a shell and will need to be populated with logic for the new database (e.g., Vercel Postgres).

export async function getOrCreateUser(firebaseUser: FirebaseUser, additionalData?: Partial<UserProfile>): Promise<UserProfile | null> {
  console.warn("getOrCreateUser is a mock function. No database is connected.");
  const email = firebaseUser.email || (additionalData?.contact ?? '');
  const name = firebaseUser.displayName || (additionalData?.name ?? 'New User');
  return {
    id: firebaseUser.uid,
    uniqueId: `CU-${generateId().slice(-6).toUpperCase()}`,
    name,
    contact: email,
    phone: firebaseUser.phoneNumber || additionalData?.phone || '',
    gender: additionalData?.gender || 'Prefer not to say',
    location: 'TBD',
    subscriptionPlan: 'None',
    registrationTimestamp: format(new Date(), 'MMM dd, yyyy'),
    approvalStatus: 'Pending',
    myReferralCode: `${name.split(' ')[0].toUpperCase()}${generateId().slice(-4)}`,
    photoURL: firebaseUser.photoURL || `https://placehold.co/100x100.png?text=${name.charAt(0)}`,
    totalReferralPoints: 0,
    ...additionalData,
  };
};

export async function fetchUserById(userId: string): Promise<UserProfile | null> {
  console.warn("fetchUserById is a mock function. No database is connected.");
  return null;
}

export async function updateUserProfile(userId: string, data: UserProfileUpdateValues): Promise<UserProfile | null> {
  console.warn("updateUserProfile is a mock function. No database is connected.");
  return null;
}

export async function changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
  console.warn("changeUserPassword is a mock function. No database is connected.");
  return true;
}

export async function assignTrainerToCustomer(customerId: string, trainerId: string): Promise<boolean> {
  console.warn("assignTrainerToCustomer is a mock function. No database is connected.");
  return true;
}

export async function updateAssignmentStatusByTrainer(customerId: string, newStatus: 'Approved' | 'Rejected'): Promise<boolean> {
  console.warn("updateAssignmentStatusByTrainer is a mock function. No database is connected.");
  return true;
}

export async function updateUserAttendance(studentId: string, status: 'Present' | 'Absent'): Promise<boolean> {
  console.warn("updateUserAttendance is a mock function. No database is connected.");
  return true;
}

export async function updateSubscriptionStartDate(customerId: string, newDate: Date): Promise<UserProfile | null> {
  console.warn("updateSubscriptionStartDate is a mock function. No database is connected.");
  return null;
}

export function listenToUser(userId: string, callback: (data: UserProfile | null) => void): () => void {
  console.warn("listenToUser is a mock function. No database is connected.");
  callback(null);
  return () => {};
}

export function listenToTrainerStudents(trainerId: string, callback: (students: UserProfile[], feedback: Feedback[], profile: UserProfile | null) => void): () => void {
  console.warn("listenToTrainerStudents is a mock function. No database is connected.");
  callback([], [], null);
  return () => {};
}

export function listenToAdminDashboardData(callback: (data: AdminDashboardData) => void): () => void {
  console.warn("listenToAdminDashboardData is a mock function. No database is connected.");
  callback({
      summaryData: { totalCustomers: 0, totalInstructors: 0, activeSubscriptions: 0, pendingRequests: 0, pendingRescheduleRequests: 0, totalEarnings: 0, totalCertifiedTrainers: 0 },
      allUsers: [],
      lessonRequests: [],
      feedback: [],
      referrals: [],
      lessonProgress: [],
      courses: [],
      quizSets: [],
      faqs: [],
      blogPosts: [],
      siteBanners: [],
      promotionalPosters: [],
  });
  return () => {};
}

export async function addRescheduleRequest(userId: string, customerName: string, originalDate: Date, newDate: Date): Promise<RescheduleRequest | null> {
  console.warn("addRescheduleRequest is a mock function. No database is connected.");
  return null;
}

export async function updateRescheduleRequestStatus(requestId: string, newStatus: RescheduleRequestStatusType): Promise<boolean> {
  console.warn("updateRescheduleRequestStatus is a mock function. No database is connected.");
  return true;
}

export async function addFeedback(customerId: string, customerName: string, trainerId: string, trainerName: string, rating: number, comment: string): Promise<boolean> {
  console.warn("addFeedback is a mock function. No database is connected.");
  return true;
}

export async function updateReferralPayoutStatus(referralId: string, status: PayoutStatusType): Promise<boolean> {
  console.warn("updateReferralPayoutStatus is a mock function. No database is connected.");
  return true;
}

export async function addCourseModule(courseId: string, moduleData: Omit<CourseModule, 'id'>): Promise<Course | null> {
  console.warn("addCourseModule is a mock function. No database is connected.");
  return null;
}

export async function updateCourseModule(courseId: string, moduleId: string, moduleData: CourseModuleFormValues): Promise<Course | null> {
  console.warn("updateCourseModule is a mock function. No database is connected.");
  return null;
}

export async function deleteCourseModule(courseId: string, moduleId: string): Promise<boolean> {
  console.warn("deleteCourseModule is a mock function. No database is connected.");
  return true;
}

export async function updateQuizQuestion(quizSetId: string, questionId: string, data: QuizQuestionFormValues): Promise<QuizSet | null> {
  console.warn("updateQuizQuestion is a mock function. No database is connected.");
  return null;
}

export async function addFaq(data: FaqFormValues): Promise<FaqItem | null> {
  console.warn("addFaq is a mock function. No database is connected.");
  return null;
}

export async function updateFaq(id: string, data: FaqFormValues): Promise<boolean> {
  console.warn("updateFaq is a mock function. No database is connected.");
  return true;
}

export async function deleteFaq(id: string): Promise<boolean> {
  console.warn("deleteFaq is a mock function. No database is connected.");
  return true;
}

export async function addBlogPost(data: BlogPostFormValues): Promise<BlogPost | null> {
  console.warn("addBlogPost is a mock function. No database is connected.");
  return null;
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  console.warn("fetchBlogPostBySlug is a mock function. No database is connected.");
  return null;
}

export async function updateBlogPost(slug: string, data: BlogPostFormValues): Promise<boolean> {
  console.warn("updateBlogPost is a mock function. No database is connected.");
  return true;
}

export async function deleteBlogPost(slug: string): Promise<boolean> {
  console.warn("deleteBlogPost is a mock function. No database is connected.");
  return true;
}

export async function updateSiteBanner(id: string, data: VisualContentFormValues): Promise<boolean> {
  console.warn("updateSiteBanner is a mock function. No database is connected.");
  return true;
}

export async function updatePromotionalPoster(id: string, data: VisualContentFormValues): Promise<boolean> {
  console.warn("updatePromotionalPoster is a mock function. No database is connected.");
  return true;
}

export async function fetchCourses(): Promise<Course[]> {
  console.warn("fetchCourses is a mock function. No database is connected.");
  return [];
}

export async function fetchQuizSets(): Promise<QuizSet[]> {
  console.warn("fetchQuizSets is a mock function. No database is connected.");
  return [];
}

export async function fetchApprovedInstructors(filters: { location?: string; gender?: string } = {}): Promise<UserProfile[]> {
  console.warn("fetchApprovedInstructors is a mock function. No database is connected.");
  return [];
}

export async function fetchReferralsByUserId(userId: string | undefined): Promise<Referral[]> {
  console.warn("fetchReferralsByUserId is a mock function. No database is connected.");
  return [];
}

const generateId = (): string => {
    return Math.random().toString(36).substring(2, 10);
};

const reAssignCourseIcons = (coursesToHydrate: Course[]): Course[] => {
    return coursesToHydrate.map(course => {
        let newIcon;
        if (course.id === 'course1') newIcon = Car;
        else if (course.id === 'course2') newIcon = Bike;
        else if (course.id === 'course3') newIcon = FileText;
        else newIcon = FileText; // Default icon
        return { ...course, icon: newIcon };
    });
};
