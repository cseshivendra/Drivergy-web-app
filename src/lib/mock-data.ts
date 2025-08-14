// This file is being replaced by live Firestore data fetching.
// The functions are now implemented in `src/lib/server-data.ts` (for server)
// and directly within components/contexts using hooks (for client).

// We will keep this file for now to avoid breaking imports, but it will be empty.
// In a real project, you would delete this file and update all imports.

import { collection, onSnapshot, doc, query, where, getDocs, getDoc, orderBy } from 'firebase/firestore';
import { db } from './firebase/client';
import type { PromotionalPoster, UserProfile, Course, QuizSet, FaqItem, BlogPost, SiteBanner, SummaryData, LessonRequest, Feedback, Referral, LessonProgressData, AdminDashboardData, RescheduleRequest } from '@/types';
import { format, parseISO } from 'date-fns';

export const listenToPromotionalPosters = (callback: (posters: PromotionalPoster[]) => void) => {
  if (!db) {
    console.error('Firestore is not initialized.');
    return () => {};
  }
  const postersCollectionRef = collection(db, 'promotionalPosters');
  const unsubscribe = onSnapshot(postersCollectionRef, (querySnapshot) => {
    const posters: PromotionalPoster[] = [];
    querySnapshot.forEach((doc) => {
      posters.push({ id: doc.id, ...doc.data() } as PromotionalPoster);
    });
    callback(posters);
  });
  return unsubscribe;
};

export const listenToUser = (userId: string, callback: (user: UserProfile | null) => void) => {
  if (!db) {
    console.error("Firestore not initialized");
    return () => {};
  }
  const userDocRef = doc(db, 'users', userId);
  const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      const userData = docSnapshot.data();
      if (userData.registrationTimestamp && typeof userData.registrationTimestamp.toDate === 'function') {
        userData.registrationTimestamp = userData.registrationTimestamp.toDate().toISOString();
      }
      callback({ id: docSnapshot.id, ...userData } as UserProfile);
    } else {
      callback(null);
    }
  });
  return unsubscribe;
};


export const listenToAdminDashboardData = (callback: (data: AdminDashboardData | null) => void) => {
    if (!db) {
        console.error('Firestore not initialized.');
        return () => {};
    }

    const usersRef = collection(db, 'users');
    const coursesRef = collection(db, 'courses');
    const quizSetsRef = collection(db, 'quizSets');
    const faqsRef = collection(db, 'faqs');
    const blogRef = collection(db, 'blog');
    const bannersRef = collection(db, 'siteBanners');
    const postersRef = collection(db, 'promotionalPosters');
    const rescheduleRef = collection(db, 'rescheduleRequests');

    const unsubs: (() => void)[] = [];

    const fetchData = async () => {
        try {
            const [usersSnap, coursesSnap, quizSetsSnap, faqsSnap, blogSnap, bannersSnap, postersSnap, rescheduleSnap] = await Promise.all([
                getDocs(usersRef),
                getDocs(coursesRef),
                getDocs(quizSetsRef),
                getDocs(faqsRef),
                getDocs(query(blogRef, orderBy('date', 'desc'))),
                getDocs(bannersRef),
                getDocs(postersRef),
                getDocs(query(rescheduleRef, orderBy('requestTimestamp', 'desc'))),
            ]);

            const allUsers: UserProfile[] = usersSnap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                registrationTimestamp: d.data().registrationTimestamp?.toDate ? d.data().registrationTimestamp.toDate().toISOString() : d.data().registrationTimestamp,
            } as UserProfile));
            
            const customers = allUsers.filter(u => u.uniqueId?.startsWith('CU'));
            const instructors = allUsers.filter(u => u.uniqueId?.startsWith('TR'));
            
            // Derive Lesson Requests
            const lessonRequests: LessonRequest[] = customers
                .filter(c => c.subscriptionPlan !== 'None' && !c.assignedTrainerId)
                .map(c => ({
                    id: c.id,
                    customerId: c.id,
                    customerName: c.name,
                    vehicleType: c.vehiclePreference as any,
                    status: 'Pending',
                    requestTimestamp: c.registrationTimestamp ? format(parseISO(c.registrationTimestamp), 'PPp') : 'N/A',
                }));

            // Derive Feedback & Referrals from other collections if they existed
            // For now, these are empty as we don't have these collections yet.
            const feedback: Feedback[] = [];
            const referrals: Referral[] = [];

            // Derive Lesson Progress
            const lessonProgress: LessonProgressData[] = customers
                .filter(c => c.assignedTrainerId && c.totalLessons)
                .map(c => ({
                    studentId: c.id,
                    studentName: c.name,
                    trainerName: c.assignedTrainerName || 'N/A',
                    subscriptionPlan: c.subscriptionPlan,
                    totalLessons: c.totalLessons || 0,
                    completedLessons: c.completedLessons || 0,
                    remainingLessons: (c.totalLessons || 0) - (c.completedLessons || 0),
                }));
            
            const rescheduleRequests: RescheduleRequest[] = rescheduleSnap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                 originalLessonDate: d.data().originalLessonDate?.toDate ? format(d.data().originalLessonDate.toDate(), 'PPp') : 'N/A',
                requestedRescheduleDate: d.data().requestedRescheduleDate?.toDate ? format(d.data().requestedRescheduleDate.toDate(), 'PPp') : 'N/A',
                requestTimestamp: d.data().requestTimestamp?.toDate ? format(d.data().requestTimestamp.toDate(), 'PPp') : 'N/A',
            } as RescheduleRequest));


            const summaryData: SummaryData = {
                totalCustomers: customers.length,
                totalInstructors: instructors.length,
                activeSubscriptions: customers.filter(c => c.subscriptionPlan !== 'None' && c.approvalStatus === 'Approved').length,
                pendingRequests: lessonRequests.length,
                pendingRescheduleRequests: rescheduleRequests.filter(r => r.status === 'Pending').length,
                totalCertifiedTrainers: instructors.filter(i => i.approvalStatus === 'Approved').length,
                totalEarnings: customers.reduce((acc, curr) => {
                    if (curr.subscriptionPlan === 'Basic') return acc + 3999;
                    if (curr.subscriptionPlan === 'Gold') return acc + 7499;
                    if (curr.subscriptionPlan === 'Premium') return acc + 9999;
                    return acc;
                }, 0),
            };

            const data: AdminDashboardData = {
                summaryData,
                allUsers,
                lessonRequests,
                rescheduleRequests,
                feedback,
                referrals,
                lessonProgress,
                courses: coursesSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Course),
                quizSets: quizSetsSnap.docs.map(d => ({ id: d.id, ...d.data() }) as QuizSet),
                faqs: faqsSnap.docs.map(d => ({ id: d.id, ...d.data() }) as FaqItem),
                blogPosts: blogSnap.docs.map(d => ({ slug: d.id, ...d.data() }) as BlogPost),
                siteBanners: bannersSnap.docs.map(d => ({ id: d.id, ...d.data() }) as SiteBanner),
                promotionalPosters: postersSnap.docs.map(d => ({ id: d.id, ...d.data() }) as PromotionalPoster),
            };
            
            callback(data);
        } catch (error) {
            console.error("Error fetching admin dashboard data:", error);
            callback(null);
        }
    };

    fetchData(); // Initial fetch

    const collections = [usersRef, coursesRef, quizSetsRef, faqsRef, blogRef, bannersRef, postersRef, rescheduleRef];
    collections.forEach(ref => {
        const unsubscribe = onSnapshot(ref, fetchData, (error) => console.error("Snapshot error:", error));
        unsubs.push(unsubscribe);
    });

    return () => unsubs.forEach(unsub => unsub());
};


export async function fetchApprovedInstructors(filters: { location?: string, gender?: string }): Promise<UserProfile[]> {
    if (!db) return [];
    
    let q = query(collection(db, 'users'), where('uniqueId', '>', 'TR'), where('uniqueId', '<', 'TS'), where('approvalStatus', '==', 'Approved'));

    if (filters.location) {
        q = query(q, where('location', '==', filters.location));
    }
    if (filters.gender) {
        q = query(q, where('gender', '==', filters.gender));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
}

export const addCourseModule = async (courseId: string, moduleData: any) => {};
export const updateCourseModule = async (courseId: string, moduleId: string, moduleData: any) => {};
export const deleteCourseModule = async (courseId: string, moduleId: string) => { return true; };

export const updateQuizQuestion = async (quizSetId: string, questionId: string, questionData: any) => {};
export const addFaq = async (faqData: any) => {};
export const updateFaq = async (faqId: string, faqData: any) => {};
export const deleteFaq = async (faqId: string) => { return true; };

export const updateSiteBanner = async (bannerId: string, data: any) => {};
export const updatePromotionalPoster = async (posterId: string, data: any) => {};


export const listenToTrainerStudents = (
    trainerId: string,
    callback: (data: { students: UserProfile[], feedback: Feedback[], rescheduleRequests: RescheduleRequest[], profile: UserProfile | null }) => void
) => {
    if (!db) {
        console.error('Firestore not initialized.');
        return () => {};
    }

    const trainerDocRef = doc(db, 'users', trainerId);
    const studentsQuery = query(collection(db, 'users'), where('assignedTrainerId', '==', trainerId));
    const feedbackQuery = query(collection(db, 'feedback'), where('trainerId', '==', trainerId));
    const rescheduleQuery = query(collection(db, 'rescheduleRequests'), where('trainerId', '==', trainerId));

    const processData = async () => {
        try {
            const [trainerSnap, studentsSnap, feedbackSnap, rescheduleSnap] = await Promise.all([
                getDoc(trainerDocRef),
                getDocs(studentsQuery),
                getDocs(feedbackQuery),
                getDocs(rescheduleQuery)
            ]);
            
            const profile = trainerSnap.exists() ? { id: trainerSnap.id, ...trainerSnap.data() } as UserProfile : null;
            
            const students = studentsSnap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                upcomingLesson: d.data().upcomingLesson ? format(parseISO(d.data().upcomingLesson), 'PPp') : 'N/A',
            } as UserProfile));

            const feedback = feedbackSnap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                submissionDate: d.data().submissionDate?.toDate ? format(d.data().submissionDate.toDate(), 'PP') : 'N/A',
            } as Feedback));
            
             const rescheduleRequests = rescheduleSnap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                 originalLessonDate: d.data().originalLessonDate?.toDate ? format(d.data().originalLessonDate.toDate(), 'PPp') : 'N/A',
                requestedRescheduleDate: d.data().requestedRescheduleDate?.toDate ? format(d.data().requestedRescheduleDate.toDate(), 'PPp') : 'N/A',
                requestTimestamp: d.data().requestTimestamp?.toDate ? format(d.data().requestTimestamp.toDate(), 'PPp') : 'N/A',
            } as RescheduleRequest));


            callback({ students, feedback, rescheduleRequests, profile });
        } catch (error) {
            console.error("Error fetching trainer student data:", error);
        }
    };
    
    processData();

    const unsubTrainer = onSnapshot(trainerDocRef, processData);
    const unsubStudents = onSnapshot(studentsQuery, processData);
    const unsubFeedback = onSnapshot(feedbackQuery, processData);
    const unsubReschedule = onSnapshot(rescheduleQuery, processData);

    return () => {
        unsubTrainer();
        unsubStudents();
        unsubFeedback();
        unsubReschedule();
    };
};
