import type { UserProfile, LessonRequest, SummaryData, VehicleType, Course, CourseModule, CustomerRegistrationFormValues, TrainerRegistrationFormValues, ApprovalStatusType, RescheduleRequest, RescheduleRequestStatusType, UserProfileUpdateValues, TrainerSummaryData, Feedback, LessonProgressData, Referral, PayoutStatusType, QuizSet, Question, CourseModuleFormValues, QuizQuestionFormValues, FaqItem, BlogPost, SiteBanner, PromotionalPoster, FaqFormValues, BlogPostFormValues, VisualContentFormValues, FullCustomerDetailsValues, AdminDashboardData } from '@/types';
import { addDays, format, isFuture, parse } from 'date-fns';
import { Car, Bike, FileText } from 'lucide-react';
import { db, isFirebaseConfigured } from './firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { uploadFile } from './server-actions';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  documentId,
  orderBy,
  limit,
  setDoc,
  onSnapshot
} from 'firebase/firestore';


// =================================================================
// USER MANAGEMENT - WRITE & ONE-TIME READ OPERATIONS
// =================================================================
export async function getOrCreateUser(firebaseUser: FirebaseUser, additionalData?: Partial<UserProfile>): Promise<UserProfile | null> {
    if (!db) return null;
    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() } as UserProfile;
    } else {
        const isTrainerRegistration = additionalData?.userRole === 'trainer';
        const uniqueIdPrefix = isTrainerRegistration ? 'TR' : 'CU';

        const newUser: Omit<UserProfile, 'id'> = {
            uniqueId: `${uniqueIdPrefix}-${generateId().slice(-6).toUpperCase()}`,
            name: firebaseUser.displayName || additionalData?.name || 'New User',
            contact: firebaseUser.email || (additionalData?.contact ?? ''),
            phone: firebaseUser.phoneNumber || additionalData?.phone || '',
            gender: additionalData?.gender || 'Prefer not to say',
            location: additionalData?.location || 'TBD',
            subscriptionPlan: additionalData?.subscriptionPlan || 'None',
            registrationTimestamp: format(new Date(), 'MMM dd, yyyy'),
            approvalStatus: 'Pending',
            myReferralCode: `${(firebaseUser.displayName || 'USER').split(' ')[0].toUpperCase()}${generateId().slice(-4)}`,
            photoURL: firebaseUser.photoURL || `https://placehold.co/100x100.png?text=${(firebaseUser.displayName || 'U').charAt(0)}`,
            totalReferralPoints: 0,
            ...additionalData,
        };
        try {
            await setDoc(userRef, newUser);
            return { id: userRef.id, ...newUser };
        } catch(error: any) {
            console.error("Error creating new user in Firestore:", error);
            return null;
        }
    }
};

export async function fetchUserById(userId: string): Promise<UserProfile | null> {
    if (!db || !userId) return null;
    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return null;

        const user = { id: userSnap.id, ...userSnap.data() } as UserProfile;

        if (user.uniqueId?.startsWith('CU') && user.assignedTrainerId) {
            const trainerSnap = await getDoc(doc(db, "users", user.assignedTrainerId));
            if (trainerSnap.exists()) {
                const trainer = trainerSnap.data() as UserProfile;
                user.assignedTrainerPhone = trainer.phone;
                user.assignedTrainerExperience = trainer.yearsOfExperience;
                user.assignedTrainerVehicleDetails = trainer.vehicleInfo;
            }
        }
        return user;
    } catch(error: any) {
        console.error(`Error fetching user ${userId}:`, error);
        return null;
    }
};

export async function updateUserProfile(userId: string, data: UserProfileUpdateValues): Promise<UserProfile | null> {
  console.warn("updateUserProfile is a mock function. No database is connected.");
  return null;
}

export async function changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
  console.warn("changeUserPassword is a mock function. No database is connected.");
  return true;
}

export async function assignTrainerToCustomer(customerId: string, trainerId: string): Promise<boolean> {
    if (!db) return false;
    try {
        const customerRef = doc(db, "users", customerId);
        const customerSnap = await getDoc(customerRef);
        const trainerSnap = await getDoc(doc(db, "users", trainerId));

        if (!customerSnap.exists() || !trainerSnap.exists()) {
            throw new Error("Assign Trainer Error: Customer or Trainer document not found.");
        }
        
        const trainerData = trainerSnap.data() as UserProfile;

        // Update customer to 'In Progress' and assign trainer details
        await updateDoc(customerRef, {
            approvalStatus: 'In Progress',
            assignedTrainerId: trainerId,
            assignedTrainerName: trainerData.name
        });
        return true;
    } catch (error: any) {
        console.error("Error assigning trainer:", error);
        return false;
    }
};

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
    if (!isFirebaseConfigured() || !db) {
      callback(null);
      return () => {};
    }
    return onSnapshot(doc(db, 'users', userId), async (snap) => {
        if (!snap.exists()) {
            callback(null);
            return;
        }
        const user = { id: snap.id, ...snap.data() } as UserProfile;
        if (user.uniqueId?.startsWith('CU') && user.assignedTrainerId) {
            const trainerSnap = await getDoc(doc(db, "users", user.assignedTrainerId));
            if (trainerSnap.exists()) {
                const trainer = trainerSnap.data() as UserProfile;
                user.assignedTrainerPhone = trainer.phone;
                user.assignedTrainerExperience = trainer.yearsOfExperience;
                user.assignedTrainerVehicleDetails = trainer.vehicleInfo;
            }
        }
        callback(user);
    }, (error) => {
        console.error(`Error listening to user ${userId}:`, error);
    });
};


export function listenToTrainerStudents(trainerId: string, callback: (students: UserProfile[], feedback: Feedback[], profile: UserProfile | null) => void): () => void {
    if (!isFirebaseConfigured() || !db) {
      callback([], [], null);
      return () => {};
    }
    const studentsQuery = query(collection(db, "users"), where("assignedTrainerId", "==", trainerId));
    const feedbackQuery = query(collection(db, 'feedback'), where('trainerId', '==', trainerId));
    const trainerProfileRef = doc(db, 'users', trainerId);

    const unsubStudents = onSnapshot(studentsQuery, () => {
        Promise.all([getDocs(studentsQuery), getDocs(feedbackQuery), getDoc(trainerProfileRef)]).then(([studentsSnap, feedbackSnap, profileSnap]) => {
            const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
            const feedback = feedbackSnap.docs.map(d => ({ id: d.id, ...d.data() } as Feedback));
            const profile = profileSnap.exists() ? { id: profileSnap.id, ...profileSnap.data() } as UserProfile : null;
            callback(students, feedback, profile);
        }).catch(err => console.error("Error fetching trainer student data:", err));
    }, (err) => console.error("Student listener error:", err));

    return () => {
        unsubStudents();
    };
}


export function listenToAdminDashboardData(callback: (data: AdminDashboardData) => void): () => void {
    if (!isFirebaseConfigured() || !db) {
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

    const usersUnsub = onSnapshot(collection(db, 'users'), (snap) => {
      const allUsers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
      const totalCustomers = allUsers.filter(u => u.uniqueId?.startsWith('CU')).length;
      const totalInstructors = allUsers.filter(u => u.uniqueId?.startsWith('TR')).length;
      const activeSubscriptions = allUsers.filter(u => u.approvalStatus === 'Approved').length;
      const totalCertifiedTrainers = allUsers.filter(u => u.uniqueId?.startsWith('TR') && u.approvalStatus === 'Approved').length;
      const totalEarnings = allUsers.filter(u => u.approvalStatus === 'Approved' && u.subscriptionPlan !== 'Trainer').reduce((acc, user) => {
            if (user.subscriptionPlan === 'Premium') return acc + 9999;
            if (user.subscriptionPlan === 'Gold') return acc + 7499;
            if (user.subscriptionPlan === 'Basic') return acc + 3999;
            return acc;
        }, 0);
      
      const summaryData = { totalCustomers, totalInstructors, activeSubscriptions, pendingRequests: 0, pendingRescheduleRequests: 0, totalEarnings, totalCertifiedTrainers };

      const lessonProgress = allUsers
            .filter(u => u.uniqueId?.startsWith('CU') && u.approvalStatus === 'Approved' && u.assignedTrainerName)
            .map(c => ({
                studentId: c.uniqueId,
                studentName: c.name,
                trainerName: c.assignedTrainerName!,
                subscriptionPlan: c.subscriptionPlan,
                totalLessons: c.totalLessons || 0,
                completedLessons: c.completedLessons || 0,
                remainingLessons: (c.totalLessons || 0) - (c.completedLessons || 0),
            })).sort((a, b) => a.remainingLessons - b.remainingLessons);

      getDocs(collection(db, 'lessonRequests')).then(lessonRequestsSnap => {
        const lessonRequests = lessonRequestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LessonRequest));
        summaryData.pendingRequests = lessonRequests.filter(r => r.status === 'Pending').length;

        // This is a simplified example. A full implementation would combine all listeners.
        // For now, we update the callback inside the user listener which is the most frequent.
        callback({
          allUsers: allUsers,
          summaryData: summaryData,
          lessonRequests: lessonRequests,
          lessonProgress: lessonProgress,
          // Other collections would be fetched here too
          feedback: [],
          referrals: [],
          courses: [],
          quizSets: [],
          faqs: [],
          blogPosts: [],
          siteBanners: [],
          promotionalPosters: [],
        });
      });
    }, (error) => {
      console.error("Error listening to users collection:", error);
    });

    return () => {
        usersUnsub();
    };
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
    if (!db) return [];
    try {
        const q = query(
            collection(db, "users"),
            where("uniqueId", ">=", "TR-"),
            where("uniqueId", "<", "TR-~"),
            where("approvalStatus", "==", "Approved")
        );
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as UserProfile))
            .filter(u =>
                (!filters.location || u.location === filters.location) &&
                (!filters.gender || u.gender === filters.gender)
            );
    } catch (error: any) {
        console.error("Error fetching approved instructors:", error);
        return [];
    }
};


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
