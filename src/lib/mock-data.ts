

import type { UserProfile, LessonRequest, SummaryData, VehicleType, Course, CourseModule, ApprovalStatusType, RescheduleRequest, RescheduleRequestStatusType, UserProfileUpdateValues, TrainerSummaryData, Feedback, LessonProgressData, Referral, PayoutStatusType, QuizSet, Question, CourseModuleFormValues, QuizQuestionFormValues, FaqItem, BlogPost, SiteBanner, PromotionalPoster, FaqFormValues, BlogPostFormValues, VisualContentFormValues, FullCustomerDetailsValues, RegistrationFormValues, AdminDashboardData } from '@/types';
import { addDays, format, isFuture, parse } from 'date-fns';
import { Car, Bike, FileText } from 'lucide-react';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, writeBatch, documentId, orderBy, limit, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export async function fetchUserById(userId: string): Promise<UserProfile | null> {
    if (!db) return null;

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

export function listenToAdminDashboardData(callback: (data: AdminDashboardData) => void): () => void {
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
    if (!db) return [];
    const snapshot = await getDocs(collection(db, "courses"));
    return reAssignCourseIcons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
}

export function listenToBlogPosts(callback: (data: BlogPost[]) => void): () => void {
    if (!db) {
        callback([]);
        return () => {};
    }
    const q = query(collection(db, 'blogPosts'), orderBy('date', 'desc'));
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ slug: d.id, ...d.data() } as BlogPost)));
    });
}


export function listenToPromotionalPosters(callback: (data: PromotionalPoster[]) => void): () => void {
    const posterData: PromotionalPoster[] = [
        {
            id: 'customer-offer-1',
            title: 'Learn Car driving at just Rs. 999',
            description: 'Get started with our best plan and save big. Limited time only!',
            href: '/payment?plan=Premium&price=999',
            imageSrc: 'https://res.cloudinary.com/dssbgilba/image/upload/v1754478493/ChatGPT_Image_Aug_6_2025_04_37_53_PM_qxaaye.png',
            imageHint: 'discount sale offer',
        },
        {
            id: 'trainer-offer-1',
            title: 'Join as a Trainer!',
            description: 'Sign up this month and get a ₹1000 joining bonus after your first student.',
            href: '/register',
            imageSrc: 'https://res.cloudinary.com/dssbgilba/image/upload/v1754478297/ChatGPT_Image_Aug_6_2025_04_34_41_PM_nwyvmi.png',
            imageHint: 'driving instructor welcome',
        },
        {
            id: 'referral-offer-1',
            title: 'Double Referral Points!',
            description: 'For a limited time, earn double the points for every friend you refer.',
            href: '/dashboard/referrals/invite',
            imageSrc: 'https://res.cloudinary.com/dssbgilba/image/upload/v1754478271/ChatGPT_Image_Aug_6_2025_04_28_56_PM_b2sdin.png',
            imageHint: 'gift points reward',
        },
    ];
    callback(posterData);
    return () => {}; // No-op for cleanup since it's static data
}

const reAssignCourseIcons = (coursesToHydrate: Course[]): Course[] => coursesToHydrate.map(course => {
    let newIcon;
    if (course.title.includes('Car')) newIcon = Car;
    else if (course.title.includes('Motorcycle')) newIcon = Bike;
    else newIcon = FileText;
    return { ...course, icon: newIcon };
});

export async function fetchApprovedInstructors(filters: { location?: string; gender?: string } = {}): Promise<UserProfile[]> {
    if (!db) return [];
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

export async function fetchReferralsByUserId(userId: string | undefined): Promise<Referral[]> {
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
