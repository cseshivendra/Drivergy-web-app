

import type { UserProfile, LessonRequest, SummaryData, VehicleType, Course, CourseModule, CustomerRegistrationFormValues, TrainerRegistrationFormValues, ApprovalStatusType, RescheduleRequest, RescheduleRequestStatusType, UserProfileUpdateValues, TrainerSummaryData, Feedback, LessonProgressData, Referral, PayoutStatusType, QuizSet, Question, CourseModuleFormValues, QuizQuestionFormValues, FaqItem, BlogPost, SiteBanner, PromotionalPoster, FaqFormValues, BlogPostFormValues, VisualContentFormValues, FullCustomerDetailsValues, AdminDashboardData } from '@/types';
import { addDays, format, isFuture, parse, subDays } from 'date-fns';
import { Car, Bike, FileText } from 'lucide-react';
import { uploadFile } from './server-actions';

// =================================================================
// MOCK DATABASE - IN-MEMORY ARRAYS
// =================================================================

const generateId = (prefix: string): string => {
    return `${prefix}-${Math.random().toString(36).substring(2, 10)}`;
};

let mockUsers: UserProfile[] = [
    { id: 'admin-user-id', uniqueId: 'AD-001', name: 'Admin User', username: 'admin@drivergy.in', contact: 'admin@drivergy.in', subscriptionPlan: 'Admin', approvalStatus: 'Approved', registrationTimestamp: format(new Date(), 'MMM dd, yyyy'), location: 'HQ', gender: 'Other', isAdmin: true, password: 'password' },
    { id: 'customer-1', uniqueId: 'CU-123456', name: 'Sample Customer', username: 'customer@drivergy.in', contact: 'customer@drivergy.in', subscriptionPlan: 'Premium', approvalStatus: 'Approved', registrationTimestamp: format(subDays(new Date(), 10), 'MMM dd, yyyy'), location: 'Gurugram', gender: 'Female', photoURL: 'https://placehold.co/100x100/f472b6/ffffff.png', assignedTrainerId: 'trainer-1', assignedTrainerName: 'Sample Trainer', totalLessons: 20, completedLessons: 12, upcomingLesson: format(addDays(new Date(), 3), 'MMM dd, yyyy, h:mm a'), myReferralCode: 'CUST123', totalReferralPoints: 150, password: 'password', flatHouseNumber: 'A-101', street: 'Cyber Hub Road', district: 'Gurugram', state: 'Haryana', pincode: '122002', dlStatus: 'Already Have DL', dlNumber: 'HR2620220012345', subscriptionStartDate: format(subDays(new Date(), 10), 'MMM dd, yyyy'), feedbackSubmitted: true },
    { id: 'trainer-1', uniqueId: 'TR-ABCDEF', name: 'Sample Trainer', username: 'trainer@drivergy.in', contact: 'trainer@drivergy.in', subscriptionPlan: 'Trainer', approvalStatus: 'Approved', registrationTimestamp: format(subDays(new Date(), 30), 'MMM dd, yyyy'), location: 'Gurugram', gender: 'Male', photoURL: 'https://placehold.co/100x100/60a5fa/ffffff.png', yearsOfExperience: 7, specialization: 'Car (Manual)', vehicleInfo: 'Maruti Swift (HR26A1234)', password: 'password' },
    { id: 'customer-2', uniqueId: 'CU-789012', name: 'Amit Singh', username: 'amit@example.com', contact: 'amit@example.com', subscriptionPlan: 'Gold', approvalStatus: 'Pending', registrationTimestamp: format(subDays(new Date(), 5), 'MMM dd, yyyy'), location: 'Noida', gender: 'Male', photoURL: 'https://placehold.co/100x100/818cf8/ffffff.png', totalLessons: 15, completedLessons: 0, myReferralCode: 'AMIT456', password: 'password' },
    { id: 'trainer-2', uniqueId: 'TR-GHIJKL', name: 'Sunita Patel', username: 'sunita@example.com', contact: 'sunita@example.com', subscriptionPlan: 'Trainer', approvalStatus: 'Pending', registrationTimestamp: format(subDays(new Date(), 2), 'MMM dd, yyyy'), location: 'New Delhi', gender: 'Female', photoURL: 'https://placehold.co/100x100/a78bfa/ffffff.png', yearsOfExperience: 4, specialization: 'Car (Automatic)', vehicleInfo: 'Honda Amaze (DL10C5678)', password: 'password' },
];

let mockLessonRequests: LessonRequest[] = [
    { id: 'req-1', customerId: 'customer-2', customerName: 'Amit Singh', vehicleType: 'Four-Wheeler', status: 'Pending', requestTimestamp: format(subDays(new Date(), 4), 'MMM dd, yyyy, h:mm a') },
];

let mockFeedback: Feedback[] = [
    { id: 'fb-1', customerId: 'customer-1', customerName: 'Sample Customer', trainerId: 'trainer-1', trainerName: 'Sample Trainer', rating: 5, comment: "Rohan is an excellent and very patient instructor. Highly recommended!", submissionDate: format(subDays(new Date(), 1), 'MMM dd, yyyy') },
];

let mockReferrals: Referral[] = [
    { id: 'ref-1', referrerId: 'customer-1', referrerName: 'Sample Customer', refereeId: 'customer-2', refereeName: 'Amit Singh', status: 'Pending', pointsEarned: 0, payoutStatus: 'Pending', timestamp: format(subDays(new Date(), 5), 'MMM dd, yyyy') },
];

let mockCourses: Course[] = [
    { id: 'course1', title: 'Comprehensive Car Program', description: 'Master the art of car driving from basics to advanced levels.', totalEnrolled: 125, totalCertified: 98, image: 'https://placehold.co/600x400.png', icon: Car, modules: [{ id: 'm1', title: 'Vehicle Controls', description: 'Learn about steering, brakes, etc.', duration: '2 hours' }] },
    { id: 'course2', title: 'Motorcycle Rider Course', description: 'Become a safe and confident two-wheeler rider.', totalEnrolled: 88, totalCertified: 72, image: 'https://placehold.co/600x400.png', icon: Bike, modules: [] },
    { id: 'course3', title: 'RTO Test Preparation', description: 'Ace your RTO exam with our specialized training module.', totalEnrolled: 210, totalCertified: 180, image: 'https://placehold.co/600x400.png', icon: FileText, modules: [] },
];

let mockQuizSets: QuizSet[] = [
    { id: 'set1', title: 'Set 1 - Traffic Signs', questions: [{ id: 'q1', question: { en: 'What does a stop sign mean?', hi: 'स्टॉप साइन का क्या मतलब है?' }, options: { en: ['Stop', 'Go', 'Slow Down'], hi: ['रुकें', 'जाएं', 'धीमे चलें'] }, correctAnswer: { en: 'Stop', hi: 'रुकें' } }] }
];

let mockFaqs: FaqItem[] = [
    { id: 'faq1', question: "What documents do I need to enroll?", answer: "For customer registration, you'll need a valid photo ID (like Aadhaar, PAN card, or Passport). If you already have a Learner's or Permanent License, you'll be asked to provide its details. Trainers need to provide their professional certifications and vehicle documents." }
];

let mockBlogPosts: BlogPost[] = [
    { slug: '10-tips-for-passing-driving-test', title: '10 Tips for Passing Your Driving Test', category: 'Tips & Tricks', excerpt: 'Nervous about your driving test? Follow these 10 essential tips to boost your confidence and increase your chances of passing on the first try.', content: 'Full blog content goes here...', author: 'Admin', date: format(subDays(new Date(), 7), 'LLL d, yyyy'), imageSrc: 'https://placehold.co/1200x800.png', imageHint: 'driving test car', tags: 'driving test, rto, tips' }
];

let mockSiteBanners: SiteBanner[] = [
    { id: 'banner-1', title: "Start Your Driving Journey Today", description: "Join thousands of students who have successfully learned to drive with our expert instructors and state-of-the-art platform.", imageSrc: "https://res.cloudinary.com/dssbgilba/image/upload/v1753180604/Gemini_Generated_Image_zcrb88zcrb88zcrb_s6hlap.png", imageHint: "driving road car sunset" }
];

let mockPromotionalPosters: PromotionalPoster[] = [
    { id: 'poster-1', href: '/site/register', imageSrc: 'https://placehold.co/400x600/60a5fa/ffffff.png', imageHint: 'special offer monsoon', title: 'Monsoon Special Offer!', description: 'Get 20% off on all Premium plans. Limited time only.' },
    { id: 'poster-2', href: '/referrals/invite', imageSrc: 'https://placehold.co/400x600/facc15/000000.png', imageHint: 'referral gift program', title: 'Refer & Earn Rewards', description: 'Invite friends and earn points on their first subscription.' },
    { id: 'poster-3', href: '/site/register', imageSrc: 'https://placehold.co/400x600/4ade80/ffffff.png', imageHint: 'driving instructor earning', title: 'Join as a Trainer', description: 'Turn your driving expertise into a rewarding career.' },
];

// =================================================================
// MOCK API FUNCTIONS
// =================================================================

// Note: "listenTo" functions now simulate a one-time fetch for mock data.
// In a real app, these would be `onSnapshot` listeners.

export function authenticateUserByCredentials(email: string, password: string): UserProfile | null {
    const user = mockUsers.find(u => u.username === email && u.password === password);
    return user || null;
};

export async function fetchUserById(userId: string): Promise<UserProfile | null> {
    const user = mockUsers.find(u => u.id === userId);
    if (user && user.uniqueId?.startsWith('CU') && user.assignedTrainerId) {
        const trainer = mockUsers.find(t => t.id === user.assignedTrainerId);
        if (trainer) {
            user.assignedTrainerPhone = trainer.phone;
            user.assignedTrainerExperience = trainer.yearsOfExperience;
            user.assignedTrainerVehicleDetails = trainer.vehicleInfo;
        }
    }
    return user || null;
}

export function listenToAdminDashboardData(callback: (data: AdminDashboardData) => void): () => void {
    const totalCustomers = mockUsers.filter(u => u.uniqueId?.startsWith('CU')).length;
    const totalInstructors = mockUsers.filter(u => u.uniqueId?.startsWith('TR')).length;
    const activeSubscriptions = mockUsers.filter(u => u.approvalStatus === 'Approved').length;
    const totalCertifiedTrainers = mockUsers.filter(u => u.uniqueId?.startsWith('TR') && u.approvalStatus === 'Approved').length;
    const totalEarnings = mockUsers.filter(u => u.approvalStatus === 'Approved' && u.subscriptionPlan !== 'Trainer').reduce((acc, user) => {
        if (user.subscriptionPlan === 'Premium') return acc + 9999;
        if (user.subscriptionPlan === 'Gold') return acc + 7499;
        if (user.subscriptionPlan === 'Basic') return acc + 3999;
        return acc;
    }, 0);
    const pendingRequests = mockLessonRequests.filter(r => r.status === 'Pending').length;

    const lessonProgress = mockUsers
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

    const data: AdminDashboardData = {
        summaryData: { totalCustomers, totalInstructors, activeSubscriptions, pendingRequests, pendingRescheduleRequests: 0, totalEarnings, totalCertifiedTrainers },
        allUsers: [...mockUsers],
        lessonRequests: [...mockLessonRequests],
        feedback: [...mockFeedback],
        referrals: [...mockReferrals],
        lessonProgress: lessonProgress,
        courses: [...mockCourses],
        quizSets: [...mockQuizSets],
        faqs: [...mockFaqs],
        blogPosts: [...mockBlogPosts],
        siteBanners: [...mockSiteBanners],
        promotionalPosters: [...mockPromotionalPosters],
    };
    callback(data);
    return () => {}; // No-op for mock data
}

export function listenToUser(userId: string, callback: (data: UserProfile | null) => void): () => void {
    const user = mockUsers.find(u => u.id === userId) || null;
    callback(user);
    return () => {};
}

export function listenToTrainerStudents(trainerId: string, callback: (students: UserProfile[], feedback: Feedback[], profile: UserProfile | null) => void): () => void {
    const students = mockUsers.filter(u => u.assignedTrainerId === trainerId);
    const feedback = mockFeedback.filter(f => f.trainerId === trainerId);
    const profile = mockUsers.find(u => u.id === trainerId) || null;
    callback(students, feedback, profile);
    return () => {};
}

export async function fetchCourses(): Promise<Course[]> {
    return reAssignCourseIcons(mockCourses);
}

export async function fetchQuizSets(): Promise<QuizSet[]> {
    return mockQuizSets;
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    return mockBlogPosts.find(p => p.slug === slug) || null;
}

export function listenToBlogPosts(callback: (data: BlogPost[]) => void): () => void {
    callback(mockBlogPosts);
    return () => {};
}

export function listenToPromotionalPosters(callback: (data: PromotionalPoster[]) => void): () => void {
    callback(mockPromotionalPosters);
    return () => {};
}

// =================================================================
// MOCK WRITE OPERATIONS
// =================================================================

export function updateUserApprovalStatusInMock(userId: string, newStatus: ApprovalStatusType) {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        mockUsers[userIndex].approvalStatus = newStatus;
    }
}

export function registerTrainerInMock(data: TrainerRegistrationFormValues) {
    const newUser: UserProfile = {
        id: generateId('user'),
        uniqueId: generateId('TR'),
        name: data.name,
        username: data.email,
        contact: data.email,
        phone: data.phone,
        gender: data.gender,
        password: data.password,
        location: data.location,
        subscriptionPlan: "Trainer",
        registrationTimestamp: format(new Date(), 'MMM dd, yyyy'),
        approvalStatus: 'Pending',
        photoURL: `https://placehold.co/100x100.png?text=${data.name.charAt(0)}`,
        myReferralCode: `${data.name.split(' ')[0].toUpperCase()}${generateId('').slice(-4)}`,
        vehicleInfo: data.trainerVehicleType,
        specialization: data.specialization,
        yearsOfExperience: Number(data.yearsOfExperience),
        trainerCertificateUrl: data.trainerCertificateUrl,
        drivingLicenseUrl: data.drivingLicenseUrl,
        aadhaarCardUrl: data.aadhaarCardUrl,
    };
    mockUsers.push(newUser);
}

export function completeCustomerProfileInMock(userId: string, data: FullCustomerDetailsValues) {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        const getLessonsForPlan = (plan: string): number => ({ Premium: 20, Gold: 15, Basic: 10 }[plan] || 0);
        
        mockUsers[userIndex] = {
            ...mockUsers[userIndex],
            subscriptionPlan: data.subscriptionPlan,
            vehicleInfo: data.vehiclePreference,
            trainerPreference: data.trainerPreference,
            flatHouseNumber: data.flatHouseNumber,
            street: data.street,
            district: data.district,
            state: data.state,
            pincode: data.pincode,
            location: data.district, // Use district as location
            dlStatus: data.dlStatus,
            dlNumber: data.dlNumber || '',
            dlTypeHeld: data.dlTypeHeld || '',
            photoIdType: data.photoIdType,
            photoIdNumber: data.photoIdNumber,
            photoIdUrl: data.photoIdUrl,
            subscriptionStartDate: format(data.subscriptionStartDate, 'MMM dd, yyyy'),
            totalLessons: getLessonsForPlan(data.subscriptionPlan),
            completedLessons: 0,
            approvalStatus: 'Pending',
        };

        const newRequest: LessonRequest = {
            id: generateId('req'),
            customerId: userId,
            customerName: mockUsers[userIndex].name,
            vehicleType: data.vehiclePreference as VehicleType,
            status: 'Pending',
            requestTimestamp: new Date().toISOString(),
        };
        mockLessonRequests.push(newRequest);
    }
}

export async function addBlogPost(data: BlogPostFormValues): Promise<BlogPost | null> {
    let imageUrl = data.imageSrc || 'https://placehold.co/1200x800.png';
    if (data.imageFile) {
        imageUrl = await uploadFile(data.imageFile, 'blog_images');
    }

    const newPost: BlogPost = {
        slug: data.slug,
        title: data.title,
        category: data.category,
        excerpt: data.excerpt,
        content: data.content,
        author: data.author,
        date: format(new Date(), 'LLL d, yyyy'),
        imageSrc: imageUrl,
        imageHint: data.imageHint,
        tags: data.tags,
    };

    mockBlogPosts.push(newPost);
    return newPost;
}

export async function updateBlogPost(slug: string, data: BlogPostFormValues): Promise<boolean> {
    const postIndex = mockBlogPosts.findIndex(p => p.slug === slug);
    if (postIndex === -1) return false;

    let imageUrl = data.imageSrc || mockBlogPosts[postIndex].imageSrc;
    if (data.imageFile) {
        imageUrl = await uploadFile(data.imageFile, 'blog_images');
    }

    mockBlogPosts[postIndex] = {
        ...mockBlogPosts[postIndex],
        ...data,
        imageSrc: imageUrl,
    };
    return true;
}

export async function deleteBlogPost(slug: string): Promise<boolean> {
    const initialLength = mockBlogPosts.length;
    mockBlogPosts = mockBlogPosts.filter(p => p.slug !== slug);
    return mockBlogPosts.length < initialLength;
}

export async function addCourseModule(courseId: string, moduleData: Omit<CourseModule, 'id'>): Promise<Course | null> {
    const courseIndex = mockCourses.findIndex(c => c.id === courseId);
    if (courseIndex === -1) return null;

    const newModule = { ...moduleData, id: generateId('mod') };
    mockCourses[courseIndex].modules.push(newModule);
    return mockCourses[courseIndex];
}

export async function updateCourseModule(courseId: string, moduleId: string, moduleData: CourseModuleFormValues): Promise<Course | null> {
    const courseIndex = mockCourses.findIndex(c => c.id === courseId);
    if (courseIndex === -1) return null;

    const moduleIndex = mockCourses[courseIndex].modules.findIndex(m => m.id === moduleId);
    if (moduleIndex === -1) return null;

    mockCourses[courseIndex].modules[moduleIndex] = {
        ...mockCourses[courseIndex].modules[moduleIndex],
        ...moduleData
    };
    return mockCourses[courseIndex];
}

export async function deleteCourseModule(courseId: string, moduleId: string): Promise<boolean> {
    const courseIndex = mockCourses.findIndex(c => c.id === courseId);
    if (courseIndex === -1) return false;

    const initialLength = mockCourses[courseIndex].modules.length;
    mockCourses[courseIndex].modules = mockCourses[courseIndex].modules.filter(m => m.id !== moduleId);
    return mockCourses[courseIndex].modules.length < initialLength;
}

export async function addFaq(data: FaqFormValues): Promise<FaqItem | null> {
    const newFaq: FaqItem = {
      id: generateId('faq'),
      ...data,
    };
    mockFaqs.push(newFaq);
    return newFaq;
}

export async function updateFaq(id: string, data: FaqFormValues): Promise<boolean> {
    const faqIndex = mockFaqs.findIndex(f => f.id === id);
    if (faqIndex === -1) return false;
    mockFaqs[faqIndex] = { ...mockFaqs[faqIndex], ...data };
    return true;
}

export async function deleteFaq(id: string): Promise<boolean> {
    const initialLength = mockFaqs.length;
    mockFaqs = mockFaqs.filter(f => f.id !== id);
    return mockFaqs.length < initialLength;
}

export async function updateSiteBanner(id: string, data: VisualContentFormValues): Promise<boolean> {
    const bannerIndex = mockSiteBanners.findIndex(b => b.id === id);
    if (bannerIndex === -1) return false;

    let imageUrl = data.imageSrc || mockSiteBanners[bannerIndex].imageSrc;
    if (data.imageFile) {
        imageUrl = await uploadFile(data.imageFile, 'site_visuals');
    }

    mockSiteBanners[bannerIndex] = {
        ...mockSiteBanners[bannerIndex],
        title: data.title,
        description: data.description,
        imageSrc: imageUrl,
        imageHint: data.imageHint || '',
    };
    return true;
}

export async function updatePromotionalPoster(id: string, data: VisualContentFormValues): Promise<boolean> {
    const posterIndex = mockPromotionalPosters.findIndex(p => p.id === id);
    if (posterIndex === -1) return false;

    let imageUrl = data.imageSrc || mockPromotionalPosters[posterIndex].imageSrc;
    if (data.imageFile) {
        imageUrl = await uploadFile(data.imageFile, 'site_visuals');
    }
    
    mockPromotionalPosters[posterIndex] = {
        ...mockPromotionalPosters[posterIndex],
        title: data.title,
        description: data.description,
        imageSrc: imageUrl,
        imageHint: data.imageHint || '',
        href: data.href || '#',
    };
    return true;
}

export async function updateQuizQuestion(quizSetId: string, questionId: string, data: QuizQuestionFormValues): Promise<QuizSet | null> {
    const setIndex = mockQuizSets.findIndex(s => s.id === quizSetId);
    if (setIndex === -1) return null;

    const questionIndex = mockQuizSets[setIndex].questions.findIndex(q => q.id === questionId);
    if (questionIndex === -1) return null;

    const updatedQuestion: Question = {
        id: questionId,
        question: { en: data.question_en, hi: data.question_hi },
        options: { 
            en: data.options_en.split('\n').filter(o => o.trim() !== ''),
            hi: data.options_hi.split('\n').filter(o => o.trim() !== '')
        },
        correctAnswer: { en: data.correctAnswer_en, hi: data.correctAnswer_hi }
    };

    mockQuizSets[setIndex].questions[questionIndex] = updatedQuestion;
    return mockQuizSets[setIndex];
}

export async function changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return false;
    }
    const user = mockUsers[userIndex];
    if (user.password !== currentPassword) {
        return false;
    }
    mockUsers[userIndex].password = newPassword;
    return true;
};

const reAssignCourseIcons = (coursesToHydrate: Course[]): Course[] => {
    return coursesToHydrate.map(course => {
        let newIcon;
        if (course.id === 'course1') newIcon = Car;
        else if (course.id === 'course2') newIcon = Bike;
        else if (course.id === 'course3') newIcon = FileText;
        else newIcon = FileText;
        return { ...course, icon: newIcon };
    });
};

export async function fetchApprovedInstructors(filters: { location?: string; gender?: string } = {}): Promise<UserProfile[]> {
    return mockUsers.filter(u => 
        u.uniqueId.startsWith('TR') && 
        u.approvalStatus === 'Approved' &&
        (!filters.location || u.location === filters.location) &&
        (!filters.gender || u.gender === filters.gender)
    );
};

export async function assignTrainerToCustomer(customerId: string, trainerId: string): Promise<boolean> {
    const customerIndex = mockUsers.findIndex(u => u.id === customerId);
    const trainer = mockUsers.find(u => u.id === trainerId);

    if(customerIndex !== -1 && trainer) {
        mockUsers[customerIndex].assignedTrainerId = trainerId;
        mockUsers[customerIndex].assignedTrainerName = trainer.name;
        mockUsers[customerIndex].approvalStatus = 'In Progress'; // Trainer needs to confirm
        return true;
    }
    return false;
};

export async function updateAssignmentStatusByTrainer(customerId: string, newStatus: 'Approved' | 'Rejected'): Promise<boolean> {
    const customerIndex = mockUsers.findIndex(u => u.id === customerId);
    if(customerIndex === -1) return false;
    
    mockUsers[customerIndex].approvalStatus = newStatus;

    if (newStatus === 'Approved') {
        const user = mockUsers[customerIndex];
        const startDate = parse(user.subscriptionStartDate!, 'MMM dd, yyyy', new Date());
        const firstLessonDate = addDays(startDate, 2);
        firstLessonDate.setHours(9, 0, 0, 0);
        user.upcomingLesson = format(firstLessonDate, 'MMM dd, yyyy, h:mm a');

        const requestIndex = mockLessonRequests.findIndex(r => r.customerId === customerId);
        if(requestIndex !== -1) {
            mockLessonRequests[requestIndex].status = 'Active';
        }
    } else { // Rejected by trainer
        mockUsers[customerIndex].assignedTrainerId = undefined;
        mockUsers[customerIndex].assignedTrainerName = undefined;
        mockUsers[customerIndex].approvalStatus = 'Pending';
    }
    return true;
}

export async function updateUserAttendance(studentId: string, status: 'Present' | 'Absent'): Promise<boolean> {
    const studentIndex = mockUsers.findIndex(u => u.id === studentId);
    if (studentIndex === -1) return false;

    const studentData = mockUsers[studentIndex];
    
    if (status === 'Present' && studentData.attendance !== 'Present') {
        studentData.completedLessons = (studentData.completedLessons || 0) + 1;
    }
    studentData.attendance = status;
    return true;
}

export async function updateSubscriptionStartDate(customerId: string, newDate: Date): Promise<UserProfile | null> {
    const customerIndex = mockUsers.findIndex(u => u.id === customerId);
    if (customerIndex === -1) return null;

    const firstLessonDate = addDays(newDate, 2);
    firstLessonDate.setHours(9, 0, 0, 0);
    
    mockUsers[customerIndex].subscriptionStartDate = format(newDate, 'MMM dd, yyyy');
    mockUsers[customerIndex].upcomingLesson = format(firstLessonDate, 'MMM dd, yyyy, h:mm a');

    return mockUsers[customerIndex];
}

export async function addRescheduleRequest(userId: string, customerName: string, originalDate: Date, newDate: Date): Promise<RescheduleRequest | null> {
    // This function would add to a `mockRescheduleRequests` array if one existed.
    // For now, we simulate success.
    console.log(`Mock reschedule request for ${customerName} from ${originalDate} to ${newDate}`);
    return {
        id: generateId('resched'),
        userId,
        customerName,
        originalLessonDate: format(originalDate, 'MMM dd, yyyy, h:mm a'),
        requestedRescheduleDate: format(newDate, 'MMM dd, yyyy, h:mm a'),
        status: 'Pending',
        requestTimestamp: new Date().toISOString(),
    };
}

export async function updateRescheduleRequestStatus(requestId: string, newStatus: RescheduleRequestStatusType): Promise<boolean> {
    // This would update the status in a `mockRescheduleRequests` array.
    console.log(`Mock update reschedule request ${requestId} to ${newStatus}`);
    // If approved, you might update the user's upcoming lesson
    // const request = mockRescheduleRequests.find(r => r.id === requestId);
    // const userIndex = mockUsers.findIndex(u => u.id === request.userId);
    // mockUsers[userIndex].upcomingLesson = request.requestedRescheduleDate;
    return true;
}

export async function addFeedback(customerId: string, customerName: string, trainerId: string, trainerName: string, rating: number, comment: string): Promise<boolean> {
    const newFeedback: Feedback = {
        id: generateId('fb'),
        customerId,
        customerName,
        trainerId,
        trainerName,
        rating,
        comment,
        submissionDate: new Date().toISOString(),
    };
    mockFeedback.push(newFeedback);

    const userIndex = mockUsers.findIndex(u => u.id === customerId);
    if(userIndex !== -1) {
        mockUsers[userIndex].feedbackSubmitted = true;
    }
    return true;
}

export async function updateReferralPayoutStatus(referralId: string, status: PayoutStatusType): Promise<boolean> {
    const referralIndex = mockReferrals.findIndex(r => r.id === referralId);
    if (referralIndex !== -1) {
        mockReferrals[referralIndex].payoutStatus = status;
        return true;
    }
    return false;
}

export async function fetchReferralsByUserId(userId: string | undefined): Promise<Referral[]> {
    if (!userId) return [];
    return mockReferrals.filter(r => r.referrerId === userId);
}

export async function updateUserProfile(userId: string, data: UserProfileUpdateValues): Promise<UserProfile | null> {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) return null;

    const updateData: Partial<UserProfileUpdateValues> & { photoURL?: string } = {
        name: data.name,
        contact: data.email, // Assuming email from form is the new contact
        phone: data.phone,
        location: data.district, // Assuming district is the primary location field
        flatHouseNumber: data.flatHouseNumber,
        street: data.street,
        state: data.state,
        district: data.district,
        pincode: data.pincode,
    };

    if (data.photo) {
        updateData.photoURL = await uploadFile(data.photo, `user_photos/${userId}`);
    }

    Object.keys(updateData).forEach(key => (updateData as any)[key] === undefined && delete (updateData as any)[key]);
    
    mockUsers[userIndex] = { ...mockUsers[userIndex], ...updateData };
    
    return mockUsers[userIndex];
};
