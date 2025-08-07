

import type { UserProfile, LessonRequest, SummaryData, VehicleType, Course, CourseModule, ApprovalStatusType, RescheduleRequest, RescheduleRequestStatusType, UserProfileUpdateValues, TrainerSummaryData, Feedback, LessonProgressData, Referral, PayoutStatusType, QuizSet, Question, CourseModuleFormValues, QuizQuestionFormValues, FaqItem, BlogPost, SiteBanner, PromotionalPoster, FaqFormValues, BlogPostFormValues, VisualContentFormValues, FullCustomerDetailsValues, RegistrationFormValues, AdminDashboardData } from '@/types';
import { addDays, format, isFuture, parse } from 'date-fns';
import { Car, Bike, FileText } from 'lucide-react';


// =================================================================
// MOCK IN-MEMORY DATABASE
// =================================================================

export let allUsers: UserProfile[] = [
    {
        id: 'mock-customer-1',
        uniqueId: 'CU-MOCK01',
        name: 'Priya Sharma',
        username: 'priya',
        contact: 'customer@drivergy.com',
        password: 'password',
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
        password: 'password',
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
    },
    {
        id: 'admin',
        uniqueId: 'ADMIN-001',
        name: 'Admin',
        username: 'admin',
        isAdmin: true,
        contact: 'admin@drivergy.com',
        password: 'admin',
        location: 'HQ',
        subscriptionPlan: 'Admin',
        approvalStatus: 'Approved',
        registrationTimestamp: new Date().toISOString(),
        gender: 'Any'
    }
];

let mockCourses: Course[] = [
    {
        id: 'car-driving',
        title: 'Comprehensive Car Program',
        description: 'Master the art of car driving with our comprehensive program covering everything from basics to advanced defensive techniques.',
        totalEnrolled: 1250,
        totalCertified: 980,
        image: 'https://placehold.co/600x400.png',
        icon: Car,
        modules: [
            { id: 'm1', title: 'Vehicle Controls & Basics', description: 'Understanding the car and its controls.', duration: '2 Hours' },
            { id: 'm2', title: 'On-Road Practice (City)', description: 'Navigating city traffic and roads.', duration: '8 Hours' },
        ]
    },
    {
        id: 'motorcycle-riding',
        title: 'Motorcycle Rider Course',
        description: 'Learn to ride a two-wheeler safely and confidently on all types of roads.',
        totalEnrolled: 850,
        totalCertified: 720,
        image: 'https://placehold.co/600x400.png',
        icon: Bike,
        modules: [
            { id: 'm1', title: 'Balancing and Control', description: 'Mastering the fundamentals of bike balance.', duration: '2 Hours' },
        ]
    },
    {
        id: 'rto-prep',
        title: 'RTO Test Preparation',
        description: 'A specialized course to help you ace the official RTO driving test with confidence.',
        totalEnrolled: 2500,
        totalCertified: 2300,
        image: 'https://placehold.co/600x400.png',
        icon: FileText,
        modules: [
            { id: 'm1', title: 'Theory and Signs', description: 'In-depth review of all traffic signs and rules.', duration: '3 Hours' },
        ]
    }
];

let mockFaqs: FaqItem[] = [
    {
        id: "faq1",
        question: "What documents do I need to enroll in a driving course?",
        answer: "For customer registration, you'll need a valid photo ID (like Aadhaar, PAN card, or Passport). If you already have a Learner's or Permanent License, you'll be asked to provide its details. Trainers need to provide their professional certifications and vehicle documents.",
    },
    {
        id: "faq2",
        question: "Can I choose my driving instructor?",
        answer: "Yes! Our platform allows you to specify your preference for a male or female instructor during registration. We do our best to accommodate your choice based on instructor availability in your location.",
    }
];

let mockQuizSets: QuizSet[] = [
    {
        id: 'set1', title: 'Practice Set 1', questions: [
            { id: 'q1', question: { en: 'What does a red traffic light indicate?', hi: 'लाल बत्ती क्या संकेत देती है?' }, options: { en: ['Stop', 'Go', 'Slow Down'], hi: ['रुकें', 'जाएँ', 'धीमे चलें'] }, correctAnswer: { en: 'Stop', hi: 'रुकें' } }
        ]
    },
    {
        id: 'set2', title: 'Practice Set 2', questions: [
             { id: 'q1', question: { en: 'What does a yellow traffic light indicate?', hi: 'पीली बत्ती क्या संकेत देती है?' }, options: { en: ['Stop', 'Go', 'Slow Down'], hi: ['रुकें', 'जाएँ', 'धीमे चलें'] }, correctAnswer: { en: 'Slow Down', hi: 'धीमे चलें' } }
        ]
    }
];

let mockBlogPosts: BlogPost[] = [
    {
        slug: 'first-post',
        title: '10 Tips for Passing Your Driving Test',
        category: 'Tips & Tricks',
        excerpt: 'Passing your driving test can be a daunting experience, but with the right preparation, you can significantly increase your chances of success. Here are 10 essential tips to help you ace your test.',
        content: 'Full content of the blog post goes here...',
        author: 'Shivendra Singh',
        date: 'Jul 22, 2024',
        imageSrc: 'https://placehold.co/1200x800.png',
        imageHint: 'driving test road',
        tags: 'driving test, rto, tips'
    }
];

let mockSiteBanners: SiteBanner[] = [
    {
        id: "banner-1",
        title: "India's #1 Driving School",
        description: "Join thousands of students who have successfully learned to drive with our expert instructors and state-of-the-art platform. Start your car driving lessons today.",
        imageSrc: "https://res.cloudinary.com/dssbgilba/image/upload/v1753180604/Gemini_Generated_Image_zcrb88zcrb88zcrb_s6hlap.png",
        imageHint: "driving road car sunset",
    },
    {
        id: "banner-2",
        title: "Become a Certified Driving Trainer",
        description: "Empower the next generation of drivers. Join our platform to manage your schedule, connect with students, and grow your business.",
        imageSrc: "https://res.cloudinary.com/dssbgilba/image/upload/v1753180604/Gemini_Generated_Image_4j07z44j07z44j07_nhtkry.png",
        imageHint: "driving instructor teaching student",
    },
    {
        id: "banner-3",
        title: "Master Indian Roads with Confidence",
        description: "Our advanced courses will equip you with defensive driving techniques and skills for all road conditions. Sign up now!",
        imageSrc: "https://res.cloudinary.com/dssbgilba/image/upload/v1753180603/Gemini_Generated_Image_7pzsi77pzsi77pzs_um61ih.png",
        imageHint: "city traffic modern car",
    }
];

let mockPromotionalPosters: PromotionalPoster[] = [
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

// Helper to update a user in the mock DB
export const updateUserInMockDB = (updatedUser: UserProfile) => {
    const index = allUsers.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
        allUsers[index] = updatedUser;
    }
};


// =================================================================
// MOCK DATA FETCHING FUNCTIONS (Simulating DB calls)
// =================================================================

export async function fetchUserById(userId: string): Promise<UserProfile | null> {
    const user = allUsers.find(u => 
        u.id === userId || 
        u.uniqueId === userId || 
        u.username === userId || 
        u.contact === userId
    );
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
    return null; 
};

const getDashboardData = (): AdminDashboardData => {
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
        timestamp: format(new Date(), 'MMM dd, yyyy'),
        refereeUniqueId: 'CU-NEW01',
        refereeSubscriptionPlan: 'Premium',
        refereeApprovalStatus: 'Approved'
    }];
    
    return {
        summaryData: {
            totalCustomers, totalInstructors, activeSubscriptions, 
            pendingRequests: mockLessonRequests.filter(r => r.status === 'Pending').length,
            pendingRescheduleRequests: mockRescheduleRequests.filter(r => r.status === 'Pending').length,
            totalEarnings, totalCertifiedTrainers
        },
        allUsers: JSON.parse(JSON.stringify(allUsers)), // Deep copy
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
    };
};

export function listenToAdminDashboardData(callback: (data: AdminDashboardData) => void): () => void {
    const data = getDashboardData();
    callback(data);
    
    // In a real app, this would return an unsubscribe function.
    // For this mock, we don't need a persistent listener, as re-fetch is manual.
    return () => {};
}

export function listenToUser(userId: string, callback: (data: UserProfile | null) => void): () => void {
    const user = allUsers.find(u => u.id === userId);
    if(user){
        // Make a deep copy to avoid direct mutation
        const userCopy = JSON.parse(JSON.stringify(user));
        if (userCopy.uniqueId?.startsWith('CU') && userCopy.assignedTrainerId) {
            const trainer = allUsers.find(t => t.id === userCopy.assignedTrainerId);
            if (trainer) {
                userCopy.assignedTrainerPhone = trainer.phone;
                userCopy.assignedTrainerExperience = trainer.yearsOfExperience;
                userCopy.assignedTrainerVehicleDetails = trainer.vehicleInfo;
            }
        }
        callback(userCopy);
    } else {
        callback(null);
    }
    // No-op for unsubscribe in mock environment
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
    return mockCourses;
}

export function listenToBlogPosts(callback: (data: BlogPost[]) => void): () => void {
    callback(mockBlogPosts);
    return () => {};
}

export function listenToPromotionalPosters(callback: (data: PromotionalPoster[]) => void): () => void {
    callback(mockPromotionalPosters);
    return () => {};
}

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
    const course = mockCourses.find(c => c.id === courseId);
    if (course) {
        const newModule = { ...moduleData, id: `mod-${Date.now()}` };
        course.modules.push(newModule);
        return course;
    }
    return null;
}

export async function updateCourseModule(courseId: string, moduleId: string, moduleData: CourseModuleFormValues): Promise<Course | null> {
    const course = mockCourses.find(c => c.id === courseId);
    if (course) {
        const moduleIndex = course.modules.findIndex(m => m.id === moduleId);
        if (moduleIndex !== -1) {
            course.modules[moduleIndex] = { ...course.modules[moduleIndex], ...moduleData };
            return course;
        }
    }
    return null;
}

export async function deleteCourseModule(courseId: string, moduleId: string): Promise<boolean> {
    const course = mockCourses.find(c => c.id === courseId);
    if (course) {
        const initialLength = course.modules.length;
        course.modules = course.modules.filter(m => m.id !== moduleId);
        return course.modules.length < initialLength;
    }
    return false;
}

export async function addFaq(data: FaqFormValues): Promise<FaqItem | null> {
    const newFaq: FaqItem = { ...data, id: `faq-${Date.now()}` };
    mockFaqs.push(newFaq);
    return newFaq;
}

export async function updateFaq(id: string, data: FaqFormValues): Promise<boolean> {
    const faqIndex = mockFaqs.findIndex(f => f.id === id);
    if (faqIndex !== -1) {
        mockFaqs[faqIndex] = { ...mockFaqs[faqIndex], ...data };
        return true;
    }
    return false;
}

export async function deleteFaq(id: string): Promise<boolean> {
    const initialLength = mockFaqs.length;
    mockFaqs = mockFaqs.filter(f => f.id !== id);
    return mockFaqs.length < initialLength;
}

export async function updateSiteBanner(id: string, data: VisualContentFormValues): Promise<boolean> {
    const bannerIndex = mockSiteBanners.findIndex(b => b.id === id);
    if (bannerIndex !== -1) {
        mockSiteBanners[bannerIndex] = { ...mockSiteBanners[bannerIndex], ...data };
        return true;
    }
    return false;
}

export async function updatePromotionalPoster(id: string, data: VisualContentFormValues): Promise<boolean> {
    const posterIndex = mockPromotionalPosters.findIndex(p => p.id === id);
    if (posterIndex !== -1) {
        mockPromotionalPosters[posterIndex] = { ...mockPromotionalPosters[posterIndex], ...data, href: data.href || '#' };
        return true;
    }
    return false;
}

export async function updateQuizQuestion(quizSetId: string, questionId: string, data: QuizQuestionFormValues): Promise<QuizSet | null> {
    const quizSet = mockQuizSets.find(qs => qs.id === quizSetId);
    if (quizSet) {
        const questionIndex = quizSet.questions.findIndex(q => q.id === questionId);
        if (questionIndex !== -1) {
            quizSet.questions[questionIndex] = {
                ...quizSet.questions[questionIndex],
                question: { en: data.question_en, hi: data.question_hi },
                options: { en: data.options_en.split('\n'), hi: data.options_hi.split('\n') },
                correctAnswer: { en: data.correctAnswer_en, hi: data.correctAnswer_hi },
            };
            return quizSet;
        }
    }
    return null;
}

export async function fetchQuizSets(): Promise<QuizSet[]> {
    return mockQuizSets;
}
