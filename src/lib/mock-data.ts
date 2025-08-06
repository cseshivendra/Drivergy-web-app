

import type { UserProfile, LessonRequest, SummaryData, VehicleType, Course, CourseModule, ApprovalStatusType, RescheduleRequest, RescheduleRequestStatusType, UserProfileUpdateValues, TrainerSummaryData, Feedback, LessonProgressData, Referral, PayoutStatusType, QuizSet, Question, CourseModuleFormValues, QuizQuestionFormValues, FaqItem, BlogPost, SiteBanner, PromotionalPoster, FaqFormValues, BlogPostFormValues, VisualContentFormValues, FullCustomerDetailsValues, RegistrationFormValues, AdminDashboardData } from '@/types';
import { addDays, format, isFuture, parse } from 'date-fns';
import { Car, Bike, FileText } from 'lucide-react';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, writeBatch, documentId, orderBy, limit, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export const allUsers: UserProfile[] = [
    {
        id: 'mock-customer-1',
        uniqueId: 'CU-MOCK01',
        name: 'Priya Sharma',
        username: 'priya',
        contact: 'customer@drivergy.com',
        phone: '1234567890',
        gender: 'Female',
        location: 'Gurugram',
        subscriptionPlan: 'Premium',
        registrationTimestamp: format(new Date(), 'MMM dd, yyyy'),
        approvalStatus: 'Approved',
        photoURL: 'https://placehold.co/100x100.png?text=P',
        myReferralCode: 'PRIYA1234',
        trainerPreference: 'Any',
        assignedTrainerId: 'mock-trainer-1',
        assignedTrainerName: 'Rajesh Kumar',
        upcomingLesson: format(addDays(new Date(), 3), 'MMM dd, yyyy, h:mm a'),
        subscriptionStartDate: format(new Date(), 'MMM dd, yyyy'),
        totalLessons: 20,
        completedLessons: 5,
        feedbackSubmitted: false,
        totalReferralPoints: 100,
        flatHouseNumber: '123, Sample Apartments',
        street: 'Main Road',
        district: 'Gurugram',
        state: 'Haryana',
        pincode: '122001',
        dlStatus: 'New Learner',
        photoIdType: 'Aadhaar Card',
        photoIdNumber: '123456789012',
        photoIdUrl: 'https://placehold.co/file.pdf'
    },
    {
        id: 'mock-trainer-1',
        uniqueId: 'TR-MOCK01',
        name: 'Rajesh Kumar',
        username: 'rajesh',
        contact: 'trainer@drivergy.com',
        phone: '9876543210',
        gender: 'Male',
        location: 'Gurugram',
        subscriptionPlan: 'Trainer',
        registrationTimestamp: format(new Date(), 'MMM dd, yyyy'),
        approvalStatus: 'Approved' as ApprovalStatusType,
        photoURL: `https://placehold.co/100x100.png?text=R`,
        myReferralCode: `RAJESH5678`,
        vehicleInfo: 'Car (Manual)',
        specialization: 'Car',
        yearsOfExperience: 5,
        trainerCertificateUrl: 'https://placehold.co/file.pdf',
        drivingLicenseUrl: 'https://placehold.co/file.pdf',
        aadhaarCardUrl: 'https://placehold.co/file.pdf',
    }
];


export async function fetchUserById(userId: string): Promise<UserProfile | null> {
    const user = allUsers.find(u => u.id === userId || u.username === userId);
    if (user) {
        if (user.uniqueId?.startsWith('CU') && user.assignedTrainerId) {
            const trainer = allUsers.find(t => t.id === user.assignedTrainerId);
            if (trainer) {
                user.assignedTrainerPhone = trainer.phone;
                user.assignedTrainerExperience = trainer.yearsOfExperience;
                user.assignedTrainerVehicleDetails = trainer.vehicleInfo;
            }
        }
        return { ...user };
    }
    
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
    const mockLessonRequests: LessonRequest[] = allUsers
        .filter(u => u.uniqueId?.startsWith('CU'))
        .map(u => ({
            id: `req-${u.id}`,
            customerId: u.id,
            customerName: u.name,
            vehicleType: (u.vehicleInfo as VehicleType) || 'Four-Wheeler',
            status: 'Pending',
            requestTimestamp: u.registrationTimestamp
        }));
    
    const mockRescheduleRequests: RescheduleRequest[] = allUsers
     .filter(u => u.uniqueId?.startsWith('CU') && u.upcomingLesson)
     .map(u => ({
        id: `resched-${u.id}`,
        userId: u.id,
        customerName: u.name,
        originalLessonDate: u.upcomingLesson!,
        requestedRescheduleDate: format(addDays(new Date(), 5), 'MMM dd, yyyy, h:mm a'),
        status: 'Pending',
        requestTimestamp: u.registrationTimestamp
     }));

    const mockFeedback: Feedback[] = allUsers.filter(u => u.assignedTrainerId).map(u => ({
        id: `fb-${u.id}`,
        customerId: u.id,
        customerName: u.name,
        trainerId: u.assignedTrainerId!,
        trainerName: u.assignedTrainerName!,
        rating: 5,
        comment: "Excellent and very patient trainer!",
        submissionDate: format(new Date(), 'MMM dd, yyyy')
    }));
    
    const customerUsers = allUsers.filter(u => u.uniqueId?.startsWith('CU'));
    const trainerUsers = allUsers.filter(u => u.uniqueId?.startsWith('TR'));
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

    const mockReferrals: Referral[] = [{
        id: 'ref-1',
        referrerId: 'mock-customer-1',
        refereeId: 'new-customer-id',
        refereeName: 'New Customer',
        status: 'Successful',
        pointsEarned: 100,
        payoutStatus: 'Pending',
        timestamp: format(new Date(), 'MMM dd, yyyy')
    }];
    
    const mockCourses: Course[] = [];
    const mockQuizSets: QuizSet[] = [];
    const mockFaqs: FaqItem[] = [];
    const mockBlogPosts: BlogPost[] = [];
    const mockSiteBanners: SiteBanner[] = [];
    const mockPromotionalPosters: PromotionalPoster[] = [];

    const data: AdminDashboardData = {
        summaryData: {
            totalCustomers, totalInstructors, activeSubscriptions, 
            pendingRequests: mockLessonRequests.filter(r => r.status === 'Pending').length,
            pendingRescheduleRequests: mockRescheduleRequests.filter(r => r.status === 'Pending').length,
            totalEarnings, totalCertifiedTrainers
        },
        allUsers,
        lessonRequests: mockLessonRequests,
        rescheduleRequests: mockRescheduleRequests,
        feedback: mockFeedback,
        referrals: mockReferrals,
        lessonProgress,
        courses: mockCourses,
        quizSets: mockQuizSets,
        faqs: mockFaqs,
        blogPosts: mockBlogPosts,
        siteBanners: mockSiteBanners,
        promotionalPosters: mockPromotionalPosters
    }
    
    callback(data);

    // This listener is now a mock, so it doesn't need a real Firebase connection.
    // It returns an empty cleanup function.
    return () => {};
}

export function listenToUser(userId: string, callback: (data: UserProfile | null) => void): () => void {
    const user = allUsers.find(u => u.id === userId);
    if(user){
        if (user.uniqueId?.startsWith('CU') && user.assignedTrainerId) {
            const trainer = allUsers.find(t => t.id === user.assignedTrainerId);
            if (trainer) {
                user.assignedTrainerPhone = trainer.phone;
                user.assignedTrainerExperience = trainer.yearsOfExperience;
                user.assignedTrainerVehicleDetails = trainer.vehicleInfo;
            }
        }
        callback(user);
    } else {
        callback(null);
    }
    return () => {};
};

export function listenToTrainerStudents(trainerId: string, callback: (data: { students: UserProfile[]; feedback: Feedback[]; rescheduleRequests: RescheduleRequest[]; profile: UserProfile | null; }) => void): () => void {
    const trainerProfile = allUsers.find(u => u.id === trainerId) || null;
    const students = allUsers.filter(u => u.assignedTrainerId === trainerId);
    const feedback = allUsers.filter(u => u.assignedTrainerId === trainerId).map(u => ({
        id: `fb-${u.id}`,
        customerId: u.id,
        customerName: u.name,
        trainerId: trainerId,
        trainerName: trainerProfile?.name || 'Trainer',
        rating: 5,
        comment: "Excellent and very patient trainer!",
        submissionDate: format(new Date(), 'MMM dd, yyyy')
    }));
    const rescheduleRequests = allUsers.filter(u => u.assignedTrainerId === trainerId && u.upcomingLesson).map(u => ({
        id: `resched-${u.id}`,
        userId: u.id,
        customerName: u.name,
        originalLessonDate: u.upcomingLesson!,
        requestedRescheduleDate: format(addDays(new Date(), 5), 'MMM dd, yyyy, h:mm a'),
        status: 'Pending' as RescheduleRequestStatusType,
        requestTimestamp: u.registrationTimestamp
     }));

    callback({ students, feedback, rescheduleRequests, profile: trainerProfile });

    return () => {};
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
    let instructors = allUsers.filter(u => u.uniqueId?.startsWith('TR') && u.approvalStatus === 'Approved');
    if (filters.location) {
        instructors = instructors.filter(i => i.location === filters.location);
    }
    if (filters.gender && filters.gender !== 'Any') {
        instructors = instructors.filter(i => i.gender === filters.gender);
    }
    return instructors;
};

export async function fetchReferralsByUserId(userId: string | undefined): Promise<Referral[]> {
    if (!userId) return [];
    
    const mockReferrals: Referral[] = [{
        id: 'ref-1',
        referrerId: userId,
        refereeId: 'new-customer-id',
        refereeName: 'New Mock Customer',
        status: 'Successful',
        pointsEarned: 100,
        payoutStatus: 'Pending',
        timestamp: format(new Date(), 'MMM dd, yyyy'),
        refereeUniqueId: 'CU-NEW01',
        refereeSubscriptionPlan: 'Premium',
        refereeApprovalStatus: 'Approved'
    }];

    return allUsers.find(u => u.id === userId) ? mockReferrals : [];
}

export async function addCourseModule(courseId: string, moduleData: Omit<CourseModule, 'id'>): Promise<Course | null> {
    console.log("Mock addCourseModule called");
    return null;
}

export async function updateCourseModule(courseId: string, moduleId: string, moduleData: CourseModuleFormValues): Promise<Course | null> {
    console.log("Mock updateCourseModule called");
    return null;
}

export async function deleteCourseModule(courseId: string, moduleId: string): Promise<boolean> {
    console.log("Mock deleteCourseModule called");
    return true;
}

export async function addFaq(data: FaqFormValues): Promise<FaqItem | null> {
    console.log("Mock addFaq called");
    return null;
}

export async function updateFaq(id: string, data: FaqFormValues): Promise<boolean> {
    console.log("Mock updateFaq called");
    return true;
}

export async function deleteFaq(id: string): Promise<boolean> {
    console.log("Mock deleteFaq called");
    return true;
}

export async function updateSiteBanner(id: string, data: VisualContentFormValues): Promise<boolean> {
    console.log("Mock updateSiteBanner called");
    return true;
}

export async function updatePromotionalPoster(id: string, data: VisualContentFormValues): Promise<boolean> {
    console.log("Mock updatePromotionalPoster called");
    return true;
}

export async function updateQuizQuestion(quizSetId: string, questionId: string, data: QuizQuestionFormValues): Promise<QuizSet | null> {
    console.log("Mock updateQuizQuestion called");
    return null;
}
    
