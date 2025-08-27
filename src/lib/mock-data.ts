
import { collection, onSnapshot, doc, query, where, getDocs, getDoc, orderBy } from 'firebase/firestore';
import { db } from './firebase/client';
import type { PromotionalPoster, UserProfile, Course, QuizSet, FaqItem, BlogPost, SiteBanner, SummaryData, LessonRequest, Feedback, Referral, LessonProgressData, AdminDashboardData, RescheduleRequest } from '@/types';
import { format, parseISO } from 'date-fns';
import { fetchCourses as serverFetchCourses, fetchQuizSets as serverFetchQuizSets, fetchBlogPosts as serverFetchBlogPosts, fetchBlogPostBySlug as serverFetchBlogPostBySlug, fetchUserById as serverFetchUserById } from './server-data';

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

export const listenToUser = (userId: string, callback: (user: UserProfile | null) => void, collectionName: 'users' | 'trainers' = 'users') => {
  if (!db) {
    console.error("Firestore not initialized");
    return () => {};
  }
  const userDocRef = doc(db, collectionName, userId);
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
    const trainersRef = collection(db, 'trainers');
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
            const [usersSnap, trainersSnap, coursesSnap, quizSetsSnap, faqsSnap, blogSnap, bannersSnap, postersSnap, rescheduleSnap] = await Promise.all([
                getDocs(usersRef),
                getDocs(trainersRef),
                getDocs(coursesRef),
                getDocs(quizSetsRef),
                getDocs(faqsRef),
                getDocs(query(blogRef, orderBy('date', 'desc'))),
                getDocs(bannersRef),
                getDocs(postersRef),
                getDocs(query(rescheduleRef, orderBy('requestTimestamp', 'desc'))),
            ]);
            
            const customers: UserProfile[] = usersSnap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                registrationTimestamp: d.data().registrationTimestamp?.toDate ? d.data().registrationTimestamp.toDate().toISOString() : d.data().registrationTimestamp,
            } as UserProfile));

            const instructors: UserProfile[] = trainersSnap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                registrationTimestamp: d.data().registrationTimestamp?.toDate ? d.data().registrationTimestamp.toDate().toISOString() : d.data().registrationTimestamp,
            } as UserProfile));

            const allUsers = [...customers, ...instructors];
            
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

    const collections = [usersRef, trainersRef, coursesRef, quizSetsRef, faqsRef, blogRef, bannersRef, postersRef, rescheduleRef];
    collections.forEach(ref => {
        const unsubscribe = onSnapshot(ref, fetchData, (error) => console.error("Snapshot error:", error));
        unsubs.push(unsubscribe);
    });

    return () => unsubs.forEach(unsub => unsub());
};


export async function fetchApprovedInstructors(filters: { location?: string, gender?: string }): Promise<UserProfile[]> {
    if (!db) return [];
    
    let q = query(collection(db, 'trainers'), where('approvalStatus', '==', 'Approved'));

    if (filters.location) {
        q = query(q, where('location', '==', filters.location));
    }
    if (filters.gender && filters.gender !== 'Any') {
        q = query(q, where('gender', '==', filters.gender));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
}

// Re-exporting server functions for client-side usage if needed through this file.
export const fetchCourses = serverFetchCourses;
export const fetchQuizSets = serverFetchQuizSets;
export const fetchBlogPosts = serverFetchBlogPosts;
export const fetchBlogPostBySlug = serverFetchBlogPostBySlug;
export const fetchUserById = serverFetchUserById;


export const listenToBlogPosts = (callback: (posts: BlogPost[]) => void) => {
    if (!db) {
        console.error("Firestore not initialized");
        return () => {};
    }
    const blogCollectionRef = query(collection(db, 'blog'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(blogCollectionRef, (querySnapshot) => {
        const posts: BlogPost[] = [];
        querySnapshot.forEach((doc) => {
            posts.push({ slug: doc.id, ...doc.data() } as BlogPost);
        });
        callback(posts);
    });
    return unsubscribe;
};


export const fetchReferralsByUserId = async (userId: string): Promise<Referral[]> => {
    if (!db) return [];
    const referralsQuery = query(collection(db, 'referrals'), where('referrerId', '==', userId));
    const snapshot = await getDocs(referralsQuery);
    return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate().toISOString() : new Date().toISOString()
    } as Referral));
};


export const listenToTrainerStudents = (
    trainerId: string,
    callback: (data: { students: UserProfile[], feedback: Feedback[], rescheduleRequests: RescheduleRequest[] }) => void
) => {
    if (!db) {
        console.error('Firestore not initialized.');
        // Immediately call back with empty data to prevent infinite loading
        callback({ students: [], feedback: [], rescheduleRequests: [] });
        return () => {};
    }

    const studentsQuery = query(collection(db, 'users'), where('assignedTrainerId', '==', trainerId));
    const feedbackQuery = query(collection(db, 'feedback'), where('trainerId', '==', trainerId));
    const rescheduleQuery = query(collection(db, 'rescheduleRequests'), where('trainerId', '==', trainerId));

    const processData = async () => {
        try {
            const [studentsSnap, feedbackSnap, rescheduleSnap] = await Promise.all([
                getDocs(studentsQuery),
                getDocs(feedbackQuery),
                getDocs(rescheduleQuery)
            ]);
            
            const students = studentsSnap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                upcomingLesson: d.data().upcomingLesson,
                registrationTimestamp: d.data().registrationTimestamp?.toDate ? d.data().registrationTimestamp.toDate().toISOString() : d.data().registrationTimestamp,
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

            // This is the crucial part: call the callback even if results are empty.
            callback({ students, feedback, rescheduleRequests });
        } catch (error) {
            console.error("Error fetching trainer student data:", error);
            // Also call back on error to stop loading
            callback({ students: [], feedback: [], rescheduleRequests: [] });
        }
    };
    
    // Set up listeners for all collections
    const unsubStudents = onSnapshot(studentsQuery, processData);
    const unsubFeedback = onSnapshot(feedbackQuery, processData);
    const unsubReschedule = onSnapshot(rescheduleQuery, processData);

    // Return a function that unsubscribes from all listeners
    return () => {
        unsubStudents();
        unsubFeedback();
        unsubReschedule();
    };
};
