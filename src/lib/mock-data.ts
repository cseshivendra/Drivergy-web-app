
import type { UserProfile, LessonRequest, SummaryData, VehicleType, Course, CourseModule, ApprovalStatusType, RescheduleRequest, RescheduleRequestStatusType, UserProfileUpdateValues, TrainerSummaryData, Feedback, LessonProgressData, Referral, PayoutStatusType, QuizSet, Question, CourseModuleFormValues, QuizQuestionFormValues, FaqItem, BlogPost, SiteBanner, PromotionalPoster, FaqFormValues, BlogPostFormValues, VisualContentFormValues, FullCustomerDetailsValues, RegistrationFormValues, AdminDashboardData } from '@/types';
import { addDays, format, isFuture, parse } from 'date-fns';
import { Car, Bike, FileText } from 'lucide-react';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { initializeFirebaseApp } from '@/lib/firebase/client';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, writeBatch, documentId, orderBy, limit, setDoc, onSnapshot } from 'firebase/firestore';
import type { FirebaseOptions } from 'firebase/app';


// Helper to get initialized client DB instance
const getClientDb = () => {
    const firebaseConfig: FirebaseOptions = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    try {
        const { db } = initializeFirebaseApp(firebaseConfig);
        return db;
    } catch(e) {
        console.warn("Client DB not available", e);
        return null;
    }
}


// =================================================================
// USER MANAGEMENT - READ OPERATIONS
// =================================================================

export async function fetchUserById(userId: string): Promise<UserProfile | null> {
    const db = getAdminFirestore(); // Use admin SDK on server
    const collectionsToSearch = ['customers', 'trainers'];
    for (const col of collectionsToSearch) {
        try {
            const userRef = doc(db, col, userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const user = { id: userSnap.id, ...userSnap.data() } as UserProfile;
                if (user.uniqueId?.startsWith('CU') && user.assignedTrainerId) {
                    const trainerSnap = await getDoc(doc(db, "trainers", user.assignedTrainerId));
                    if (trainerSnap.exists()) {
                        const trainer = trainerSnap.data() as UserProfile;
                        user.assignedTrainerPhone = trainer.phone;
                        user.assignedTrainerExperience = trainer.yearsOfExperience;
                        user.assignedTrainerVehicleDetails = trainer.vehicleInfo;
                    }
                }
                return user;
            }
        } catch (error: any) {
            console.error(`Error fetching user ${userId} from ${col}:`, error);
        }
    }
    return null; // Not found in any collection
};

// =================================================================
// DATA LISTENERS (REAL-TIME & ONE-TIME)
// =================================================================

export function listenToAdminDashboardData(callback: (data: AdminDashboardData) => void): () => void {
    const db = getClientDb();
    if (!db) {
        callback({} as AdminDashboardData);
        return () => {};
    }

    const unsubs: (() => void)[] = [];
    let combinedData: Partial<AdminDashboardData> = {};

    const updateData = (newData: Partial<AdminDashboardData>) => {
        combinedData = { ...combinedData, ...newData };
        callback(combinedData as AdminDashboardData);
    };

    const unsubCustomers = onSnapshot(collection(db, 'customers'), (snap) => {
        const customers = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
        updateCombinedUsers(customers, 'customers');
    });

    const unsubTrainers = onSnapshot(collection(db, 'trainers'), (snap) => {
        const trainers = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
        updateCombinedUsers(trainers, 'trainers');
    });

    let customerUsers: UserProfile[] = [];
    let trainerUsers: UserProfile[] = [];

    const updateCombinedUsers = (users: UserProfile[], type: 'customers' | 'trainers') => {
        if (type === 'customers') customerUsers = users;
        if (type === 'trainers') trainerUsers = users;

        const allUsers = [...customerUsers, ...trainerUsers];
        const totalCustomers = customerUsers.length;
        const totalInstructors = trainerUsers.length;

        const activeSubscriptions = customerUsers.filter(u => u.approvalStatus === 'Approved' && u.subscriptionPlan !== 'None').length;
        const totalCertifiedTrainers = trainerUsers.filter(u => u.approvalStatus === 'Approved').length;
        const totalEarnings = customerUsers.filter(u => u.approvalStatus === 'Approved').reduce((acc, user) => {
            if (user.subscriptionPlan === 'Premium') return acc + 9999;
            if (user.subscriptionPlan === 'Gold') return acc + 7499;
            if (user.subscriptionPlan === 'Basic') return acc + 3999;
            return acc;
        }, 0);

        const lessonProgress = customerUsers
            .filter(u => u.approvalStatus === 'Approved' && u.assignedTrainerName)
            .map(c => ({
                studentId: c.uniqueId, studentName: c.name, trainerName: c.assignedTrainerName!,
                subscriptionPlan: c.subscriptionPlan, totalLessons: c.totalLessons || 0,
                completedLessons: c.completedLessons || 0,
                remainingLessons: (c.totalLessons || 0) - (c.completedLessons || 0),
            })).sort((a, b) => a.remainingLessons - b.remainingLessons);

        updateData({
            allUsers,
            lessonProgress,
            summaryData: {
                ...combinedData.summaryData,
                totalCustomers,
                totalInstructors,
                activeSubscriptions,
                totalEarnings,
                totalCertifiedTrainers
            } as SummaryData
        });
    };

    unsubs.push(unsubCustomers, unsubTrainers);

    unsubs.push(onSnapshot(collection(db, 'lessonRequests'), snap => updateData({ lessonRequests: snap.docs.map(d => ({ id: d.id, ...d.data() } as LessonRequest)), summaryData: { ...combinedData.summaryData, pendingRequests: snap.docs.filter(d => d.data().status === 'Pending').length } as SummaryData })));
    unsubs.push(onSnapshot(collection(db, 'rescheduleRequests'), snap => updateData({ rescheduleRequests: snap.docs.map(d => ({ id: d.id, ...d.data() } as RescheduleRequest)), summaryData: { ...combinedData.summaryData, pendingRescheduleRequests: snap.docs.filter(d => d.data().status === 'Pending').length } as SummaryData })));
    unsubs.push(onSnapshot(collection(db, 'feedback'), snap => updateData({ feedback: snap.docs.map(d => ({ id: d.id, ...d.data() } as Feedback)) })));
    unsubs.push(onSnapshot(collection(db, 'referrals'), snap => updateData({ referrals: snap.docs.map(d => ({ id: d.id, ...d.data() } as Referral)) })));
    unsubs.push(onSnapshot(collection(db, 'courses'), snap => updateData({ courses: reAssignCourseIcons(snap.docs.map(d => ({ id: d.id, ...d.data() } as Course))) })));
    unsubs.push(onSnapshot(collection(db, 'quizSets'), snap => updateData({ quizSets: snap.docs.map(d => ({ id: d.id, ...d.data() } as QuizSet)) })));
    unsubs.push(onSnapshot(collection(db, 'faqs'), snap => updateData({ faqs: snap.docs.map(d => ({ id: d.id, ...d.data() } as FaqItem)) })));
    unsubs.push(onSnapshot(collection(db, 'blogPosts'), snap => updateData({ blogPosts: snap.docs.map(d => ({ slug: d.id, ...d.data() } as BlogPost)) })));
    unsubs.push(onSnapshot(collection(db, 'siteBanners'), snap => updateData({ siteBanners: snap.docs.map(d => ({ id: d.id, ...d.data() } as SiteBanner)) })));
    unsubs.push(onSnapshot(collection(db, 'promotionalPosters'), snap => updateData({ promotionalPosters: snap.docs.map(d => ({ id: d.id, ...d.data() } as PromotionalPoster)) })));

    return () => unsubs.forEach(unsub => unsub());
}

export function listenToUser(userId: string, callback: (data: UserProfile | null) => void): () => void {
    const db = getClientDb();
    if (!db) {
        callback(null); return () => {};
    }

    const unsubCustomer = onSnapshot(doc(db, 'customers', userId), async (snap) => {
        if (snap.exists()) {
            const user = { id: snap.id, ...snap.data() } as UserProfile;
            if (user.assignedTrainerId) {
                const trainerSnap = await getDoc(doc(db, "trainers", user.assignedTrainerId));
                if (trainerSnap.exists()) {
                    const trainer = trainerSnap.data() as UserProfile;
                    user.assignedTrainerPhone = trainer.phone;
                    user.assignedTrainerExperience = trainer.yearsOfExperience;
                    user.assignedTrainerVehicleDetails = trainer.vehicleInfo;
                }
            }
            callback(user);
        }
    });

    const unsubTrainer = onSnapshot(doc(db, 'trainers', userId), (snap) => {
        if (snap.exists()) {
            callback({ id: snap.id, ...snap.data() } as UserProfile);
        }
    });

    return () => {
        unsubCustomer();
        unsubTrainer();
    };
};

export function listenToTrainerStudents(trainerId: string, callback: (data: { students: UserProfile[]; feedback: Feedback[]; rescheduleRequests: RescheduleRequest[]; profile: UserProfile | null; }) => void): () => void {
    const db = getClientDb();
    if (!db) {
        callback({ students: [], feedback: [], rescheduleRequests: [], profile: null });
        return () => {};
    }

    const trainerProfileUnsub = onSnapshot(doc(db, 'trainers', trainerId), (trainerSnap) => {
        const trainerProfile = trainerSnap.exists() ? { id: trainerSnap.id, ...trainerSnap.data() } as UserProfile : null;

        const studentsQuery = query(collection(db!, "customers"), where("assignedTrainerId", "==", trainerId));
        const studentUnsub = onSnapshot(studentsQuery, (studentsSnap) => {
            const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
            const studentIds = students.map(s => s.id);

            const feedbackQuery = query(collection(db!, 'feedback'), where('trainerId', '==', trainerId));
            const feedbackUnsub = onSnapshot(feedbackQuery, (feedbackSnap) => {
                const feedback = feedbackSnap.docs.map(d => ({ id: d.id, ...d.data() } as Feedback));

                let rescheduleUnsub = () => {};
                if (studentIds.length > 0) {
                    const rescheduleQuery = query(collection(db!, 'rescheduleRequests'), where('userId', 'in', studentIds));
                    rescheduleUnsub = onSnapshot(rescheduleQuery, (rescheduleSnap) => {
                        const rescheduleRequests = rescheduleSnap.docs.map(d => ({ id: d.id, ...d.data() } as RescheduleRequest));
                        callback({ students, feedback, rescheduleRequests, profile: trainerProfile });
                    });
                } else {
                    callback({ students, feedback, rescheduleRequests: [], profile: trainerProfile });
                }

                return () => rescheduleUnsub();
            });
            return () => feedbackUnsub();
        });
        return () => studentUnsub();
    });

    return () => trainerProfileUnsub();
}

export async function fetchCourses(): Promise<Course[]> {
    const db = getClientDb();
    if (!db) return [];
    const snapshot = await getDocs(collection(db, "courses"));
    return reAssignCourseIcons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
}

export async function fetchQuizSets(): Promise<QuizSet[]> {
    const db = getClientDb();
    if (!db) return [];
    const snapshot = await getDocs(collection(db, "quizSets"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizSet));
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    const db = getClientDb();
    if (!db) return null;
    const snapshot = await getDoc(doc(db, 'blogPosts', slug));
    return snapshot.exists() ? { slug: snapshot.id, ...snapshot.data() } as BlogPost : null;
}

export function listenToBlogPosts(callback: (data: BlogPost[]) => void): () => void {
    const db = getClientDb();
    if (!db) {
        callback([]);
        return () => {};
    }
    return onSnapshot(query(collection(db, 'blogPosts'), orderBy('date', 'desc')), snap => {
        callback(snap.docs.map(d => ({ slug: d.id, ...d.data() } as BlogPost)));
    });
}

export function listenToPromotionalPosters(callback: (data: PromotionalPoster[]) => void): () => void {
    const db = getClientDb();
    if (!db) {
        callback([]);
        return () => {};
    }
    return onSnapshot(collection(db, 'promotionalPosters'), snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as PromotionalPoster)));
    }, (error) => {
        console.error("Error listening to promotional posters:", error);
    });
}

// =================================================================
// WRITE OPERATIONS
// =================================================================

const generateId = (): string => Math.random().toString(36).substring(2, 10);

export async function addBlogPost(data: BlogPostFormValues): Promise<BlogPost | null> {
    const db = getAdminFirestore();
    let imageUrl = data.imageSrc || 'https://placehold.co/1200x800.png';
    // File upload is handled by server action now
    const newPostData: Omit<BlogPost, 'slug'> = {
        title: data.title, category: data.category, excerpt: data.excerpt,
        content: data.content, author: data.author, date: format(new Date(), 'LLL d, yyyy'),
        imageSrc: imageUrl, imageHint: data.imageHint, tags: data.tags,
    };
    const docRef = doc(db, 'blogPosts', data.slug);
    await setDoc(docRef, newPostData);
    return { slug: docRef.id, ...newPostData };
}

export async function updateBlogPost(slug: string, data: BlogPostFormValues): Promise<boolean> {
    const db = getAdminFirestore();
    const updateData: Partial<BlogPostFormValues> = { ...data };
    // File upload handled by server action
    delete updateData.imageFile;
    await updateDoc(doc(db, 'blogPosts', slug), updateData as any);
    return true;
}

export async function deleteBlogPost(slug: string): Promise<boolean> {
    const db = getAdminFirestore();
    await deleteDoc(doc(db, 'blogPosts', slug));
    return true;
}

export async function addCourseModule(courseId: string, moduleData: Omit<CourseModule, 'id'>): Promise<Course | null> {
    const db = getAdminFirestore();
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    if (!courseSnap.exists()) return null;
    const course = courseSnap.data() as Course;
    const newModule = { ...moduleData, id: generateId() };
    const updatedModules = [...(course.modules || []), newModule];
    await updateDoc(courseRef, { modules: updatedModules });
    return { ...course, modules: updatedModules, id: courseId };
}

export async function updateCourseModule(courseId: string, moduleId: string, moduleData: CourseModuleFormValues): Promise<Course | null> {
    const db = getAdminFirestore();
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    if (!courseSnap.exists()) return null;
    const course = courseSnap.data() as Course;
    const updatedModules = course.modules.map(m => m.id === moduleId ? { ...m, ...moduleData } : m);
    await updateDoc(courseRef, { modules: updatedModules });
    return { ...course, modules: updatedModules, id: courseId };
}

export async function deleteCourseModule(courseId: string, moduleId: string): Promise<boolean> {
    const db = getAdminFirestore();
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    if (!courseSnap.exists()) return false;
    const course = courseSnap.data() as Course;
    const updatedModules = course.modules.filter(m => m.id !== moduleId);
    await updateDoc(courseRef, { modules: updatedModules });
    return true;
}

export async function addFaq(data: FaqFormValues): Promise<FaqItem | null> {
    const db = getAdminFirestore();
    const docRef = await addDoc(collection(db, 'faqs'), data);
    return { id: docRef.id, ...data };
}

export async function updateFaq(id: string, data: FaqFormValues): Promise<boolean> {
    const db = getAdminFirestore();
    await updateDoc(doc(db, 'faqs', id), data as any);
    return true;
}

export async function deleteFaq(id: string): Promise<boolean> {
    const db = getAdminFirestore();
    await deleteDoc(doc(db, 'faqs', id));
    return true;
}

export async function updateSiteBanner(id: string, data: VisualContentFormValues): Promise<boolean> {
    const db = getAdminFirestore();
    const updateData: Partial<VisualContentFormValues> = { ...data };
    // File upload handled by server action
    delete updateData.imageFile;
    await updateDoc(doc(db, 'siteBanners', id), updateData as any);
    return true;
}

export async function updatePromotionalPoster(id: string, data: VisualContentFormValues): Promise<boolean> {
    const db = getAdminFirestore();
    const updateData: Partial<VisualContentFormValues> = { ...data };
    // File upload handled by server action
    delete updateData.imageFile;
    await updateDoc(doc(db, 'promotionalPosters', id), updateData as any);
    return true;
}

export async function updateQuizQuestion(quizSetId: string, questionId: string, data: QuizQuestionFormValues): Promise<QuizSet | null> {
    const db = getAdminFirestore();
    const setRef = doc(db, 'quizSets', quizSetId);
    const setSnap = await getDoc(setRef);
    if (!setSnap.exists()) return null;
    const quizSet = setSnap.data() as QuizSet;
    const updatedQuestions = quizSet.questions.map(q => {
        if (q.id === questionId) {
            return {
                id: q.id,
                question: { en: data.question_en, hi: data.question_hi },
                options: { en: data.options_en.split('\n').filter(o => o.trim() !== ''), hi: data.options_hi.split('\n').filter(o => o.trim() !== '') },
                correctAnswer: { en: data.correctAnswer_en, hi: data.correctAnswer_hi },
            };
        }
        return q;
    });
    await updateDoc(setRef, { questions: updatedQuestions });
    return { ...quizSet, questions: updatedQuestions, id: quizSetId };
}

export async function changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const db = getAdminFirestore();
    const collections = ['customers', 'trainers'];
    for (const col of collections) {
        const userRef = doc(db, col, userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            // Password verification should be handled by Firebase Auth, this is a mock
            return false;
        }
    }
    return false;
};

const reAssignCourseIcons = (coursesToHydrate: Course[]): Course[] => coursesToHydrate.map(course => {
    let newIcon;
    if (course.title.includes('Car')) newIcon = Car;
    else if (course.title.includes('Motorcycle')) newIcon = Bike;
    else newIcon = FileText;
    return { ...course, icon: newIcon };
});

export async function fetchApprovedInstructors(filters: { location?: string; gender?: string } = {}): Promise<UserProfile[]> {
    const db = getAdminFirestore();
    let q = query(collection(db, "trainers"), where("approvalStatus", "==", "Approved"));
    if (filters.location) {
        q = query(q, where("location", "==", filters.location));
    }
    if (filters.gender) {
        q = query(q, where("gender", "==", filters.gender));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
};

export async function assignTrainerToCustomer(customerId: string, trainerId: string): Promise<boolean> {
    const db = getAdminFirestore();
    const customerRef = doc(db, "customers", customerId);
    const trainerRef = doc(db, "trainers", trainerId);
    const [customerSnap, trainerSnap] = await Promise.all([getDoc(customerRef), getDoc(trainerRef)]);
    if (!customerSnap.exists() || !trainerSnap.exists()) return false;
    const trainerData = trainerSnap.data() as UserProfile;
    await updateDoc(customerRef, {
        approvalStatus: 'In Progress', assignedTrainerId: trainerId,
        assignedTrainerName: trainerData.name
    });
    return true;
};

export async function updateAssignmentStatusByTrainer(customerId: string, newStatus: 'Approved' | 'Rejected'): Promise<boolean> {
    const db = getAdminFirestore();
    const customerRef = doc(db, "customers", customerId);
    const updates: { [key: string]: any } = { approvalStatus: newStatus };

    if (newStatus === 'Approved') {
        const customerSnap = await getDoc(customerRef);
        if(!customerSnap.exists()) return false;
        const user = customerSnap.data() as UserProfile;
        if(user.subscriptionStartDate) {
            const startDate = parse(user.subscriptionStartDate!, 'MMM dd, yyyy', new Date());
            const firstLessonDate = addDays(startDate, 2);
            firstLessonDate.setHours(9, 0, 0, 0);
            updates.upcomingLesson = format(firstLessonDate, 'MMM dd, yyyy, h:mm a');
        }


        const requestQuery = query(collection(db, 'lessonRequests'), where('customerId', '==', customerId));
        const requestSnapshot = await getDocs(requestQuery);
        if (!requestSnapshot.empty) {
            await updateDoc(requestSnapshot.docs[0].ref, { status: 'Active' });
        }
    } else { // Rejected
        updates.assignedTrainerId = null; updates.assignedTrainerName = null;
        updates.approvalStatus = 'Pending';
    }
    await updateDoc(customerRef, updates);
    return true;
}

export async function updateUserAttendance(studentId: string, status: 'Present' | 'Absent'): Promise<boolean> {
    const db = getAdminFirestore();
    const studentRef = doc(db, "customers", studentId);
    const studentSnap = await getDoc(studentRef);
    if (!studentSnap.exists()) return false;
    const studentData = studentSnap.data() as UserProfile;
    const updates: { [key: string]: any } = { attendance: status };
    if (status === 'Present' && studentData.attendance !== 'Present') {
        updates.completedLessons = (studentData.completedLessons || 0) + 1;
    }
    await updateDoc(studentRef, updates);
    return true;
}

export async function updateSubscriptionStartDate(customerId: string, newDate: Date): Promise<UserProfile | null> {
    const db = getAdminFirestore();
    const firstLessonDate = addDays(newDate, 2);
    firstLessonDate.setHours(9, 0, 0, 0);
    const updates = {
        subscriptionStartDate: format(newDate, 'MMM dd, yyyy'),
        upcomingLesson: format(firstLessonDate, 'MMM dd, yyyy, h:mm a'),
    };
    const customerRef = doc(db, 'customers', customerId);
    await updateDoc(customerRef, updates);
    const updatedSnap = await getDoc(customerRef);
    return updatedSnap.exists() ? { id: updatedSnap.id, ...updatedSnap.data() } as UserProfile : null;
}

export async function addRescheduleRequest(userId: string, customerName: string, originalDate: Date, newDate: Date): Promise<RescheduleRequest | null> {
    const db = getAdminFirestore();
    const newRequest: Omit<RescheduleRequest, 'id'> = {
        userId, customerName,
        originalLessonDate: format(originalDate, 'MMM dd, yyyy, h:mm a'),
        requestedRescheduleDate: format(newDate, 'MMM dd, yyyy, h:mm a'),
        status: 'Pending', requestTimestamp: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, 'rescheduleRequests'), newRequest);
    return { id: docRef.id, ...newRequest };
}

export async function updateRescheduleRequestStatus(requestId: string, newStatus: RescheduleRequestStatusType): Promise<boolean> {
    const db = getAdminFirestore();
    const requestRef = doc(db, 'rescheduleRequests', requestId);
    await updateDoc(requestRef, { status: newStatus });
    if (newStatus === 'Approved') {
        const requestSnap = await getDoc(requestRef);
        if (!requestSnap.exists()) return false;
        const requestData = requestSnap.data() as RescheduleRequest;
        await updateDoc(doc(db, 'customers', requestData.userId), { upcomingLesson: requestData.requestedRescheduleDate });
    }
    return true;
}

export async function addFeedback(customerId: string, customerName: string, trainerId: string, trainerName: string, rating: number, comment: string): Promise<boolean> {
    const db = getAdminFirestore();
    const newFeedback: Omit<Feedback, 'id'> = { customerId, customerName, trainerId, trainerName, rating, comment, submissionDate: new Date().toISOString() };
    await addDoc(collection(db, 'feedback'), newFeedback);
    await updateDoc(doc(db, 'customers', customerId), { feedbackSubmitted: true });
    return true;
}

export async function updateReferralPayoutStatus(referralId: string, status: PayoutStatusType): Promise<boolean> {
    const db = getAdminFirestore();
    await updateDoc(doc(db, 'referrals', referralId), { payoutStatus: status });
    return true;
}

export async function fetchReferralsByUserId(userId: string | undefined): Promise<Referral[]> {
    const db = getClientDb();
    if (!db || !userId) return [];
    const q = query(collection(db, "referrals"), where("referrerId", "==", userId));
    const querySnapshot = await getDocs(q);
    const referrals = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));
    if (referrals.length === 0) return referrals;
    const refereeIds = referrals.map(r => r.refereeId).filter(Boolean);
    if(refereeIds.length === 0) return referrals;

    const usersMap = new Map<string, UserProfile>();
    for (let i = 0; i < refereeIds.length; i += 30) {
        const batchIds = refereeIds.slice(i, i + 30);
        const usersQuery = query(collection(db, 'customers'), where(documentId(), 'in', batchIds));
        const usersSnapshot = await getDocs(usersQuery);
        usersSnapshot.forEach(doc => usersMap.set(doc.id, { id: doc.id, ...doc.data() } as UserProfile));
    }

    return referrals.map(ref => {
        const referee = usersMap.get(ref.refereeId);
        return { ...ref, refereeUniqueId: referee?.uniqueId, refereeSubscriptionPlan: referee?.subscriptionPlan, refereeApprovalStatus: referee?.approvalStatus };
    });
}

export async function updateUserProfile(userId: string, data: UserProfileUpdateValues): Promise<UserProfile | null> {
    const db = getAdminFirestore();
    let userRef;

    const collectionsToSearch = ['customers', 'trainers'];
    for (const col of collectionsToSearch) {
        const ref = doc(db, col, userId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            userRef = ref;
            break;
        }
    }

    if (!userRef) return null;

    const { photo, ...restData } = data;

    const updateData: Partial<UserProfile> = {
        ...restData,
        location: data.district,
    };

    Object.keys(updateData).forEach(key => (updateData as any)[key] === undefined && delete (updateData as any)[key]);
    await updateDoc(userRef, updateData);
    const updatedDoc = await getDoc(userRef);
    return updatedDoc.exists() ? { id: updatedDoc.id, ...updatedDoc.data() } as UserProfile : null;
};
