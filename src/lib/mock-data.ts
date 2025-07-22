
import type { UserProfile, LessonRequest, SummaryData, VehicleType, Course, CourseModule, CustomerRegistrationFormValues, TrainerRegistrationFormValues, ApprovalStatusType, RescheduleRequest, RescheduleRequestStatusType, UserProfileUpdateValues, TrainerSummaryData, Feedback, LessonProgressData, Referral, PayoutStatusType, QuizSet, Question, CourseModuleFormValues, QuizQuestionFormValues, FaqItem, BlogPost, SiteBanner, PromotionalPoster, FaqFormValues, BlogPostFormValues, VisualContentFormValues, FullCustomerDetailsValues } from '@/types';
import { addDays, format, isFuture, parse } from 'date-fns';
import { Car, Bike, FileText } from 'lucide-react';
import { db, isFirebaseConfigured } from './firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, writeBatch, documentId, orderBy, limit, setDoc, onSnapshot } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import type { User as FirebaseUser } from 'firebase/auth';
import { uploadFile } from './file-upload';

// Default mock data for when Firebase is not connected
const MOCK_SITE_BANNERS: SiteBanner[] = [
    {
        id: "banner-1",
        title: "Start Your Driving Journey Today",
        description: "Join thousands of students who have successfully learned to drive with our expert instructors and state-of-the-art platform.",
        imageSrc: "https://placehold.co/1920x1080/dc2626/ffffff.png",
        imageHint: "driving road car sunset",
    },
    {
        id: "banner-2",
        title: "Become a Certified Driving Trainer",
        description: "Empower the next generation of drivers. Join our platform to manage your schedule, connect with students, and grow your business.",
        imageSrc: "https://placehold.co/1920x1080/1d4ed8/ffffff.png",
        imageHint: "driving instructor teaching student",
    },
    {
        id: "banner-3",
        title: "Master the Roads with Confidence",
        description: "Our advanced courses will equip you with defensive driving techniques and skills for all road conditions. Sign up now!",
        imageSrc: "https://placehold.co/1920x1080/16a34a/ffffff.png",
        imageHint: "city traffic modern car",
    },
];

const MOCK_BLOG_POSTS: BlogPost[] = [
    {
        slug: "mastering-the-three-point-turn",
        title: "Mastering the Three-Point Turn: A Step-by-Step Guide",
        category: "Driving Tips",
        excerpt: "The three-point turn is a fundamental driving maneuver. This guide breaks it down into simple, easy-to-follow steps.",
        content: "The three-point turn can be intimidating, but it's an essential skill for every driver. It allows you to turn a vehicle around in a narrow space. Here's how to do it safely: 1. Signal and pull over to the right side of the road. 2. Signal left, check mirrors and blind spots. 3. Turn the steering wheel fully to the left and move forward slowly until you are close to the opposite curb. 4. Put the car in reverse, turn the wheel fully to the right, and back up until you have enough space to move forward. 5. Shift to drive, turn the wheel left, and straighten out in your new direction of travel. Practice makes perfect!",
        author: "Priya Sharma",
        date: "August 15, 2024",
        imageSrc: "https://placehold.co/1200x800.png",
        imageHint: "driving maneuver car",
        tags: "driving, tips, maneuver, test",
    },
    {
        slug: "passing-your-rto-exam",
        title: "Top 5 Tips for Passing Your RTO Exam on the First Try",
        category: "RTO Exams",
        excerpt: "Don't let the RTO exam intimidate you. Follow these five expert tips to ensure you're fully prepared for success.",
        content: "Passing your RTO exam is your ticket to freedom on the road. To boost your chances: 1. Study the official manual thoroughly. 2. Take as many mock tests as you can, like the ones offered by Drivergy. 3. Understand traffic signs and signals completely, not just memorize them. 4. On the day of the test, stay calm and get a good night's sleep. 5. During the practical test, remember to check your mirrors frequently and use your signals for every turn.",
        author: "Rohan Verma",
        date: "August 10, 2024",
        imageSrc: "https://placehold.co/1200x800.png",
        imageHint: "exam test paper",
        tags: "rto, exam, license, driving test",
    },
];

const MOCK_FAQS: FaqItem[] = [
    {
        id: "faq1",
        question: "What documents do I need to enroll?",
        answer: "For customer registration, you'll need a valid photo ID (like Aadhaar, PAN card, or Passport). If you already have a Learner's or Permanent License, you'll be asked to provide its details. Trainers need to provide their professional certifications and vehicle documents.",
    },
    {
        id: "faq2",
        question: "Can I choose my instructor?",
        answer: "Yes! Our platform allows you to specify your preference for a male or female instructor during registration. We do our best to accommodate your choice based on instructor availability in your location.",
    },
    {
        id: "faq3",
        question: "How do I book a driving lesson slot?",
        answer: "Once your registration is approved and you have an active subscription, you can log in to your customer dashboard. From there, you'll be able to view available slots for your chosen instructor and book them according to your convenience.",
    },
];

const MOCK_QUIZ_SETS: QuizSet[] = Array.from({ length: 10 }, (_, i) => ({
    id: `set${i + 1}`,
    title: `Practice Set ${i + 1}`,
    questions: Array.from({ length: 15 }, (_, j) => ({
        id: `q${i * 15 + j + 1}`,
        question: {
            en: `This is English question number ${j + 1} for Set ${i + 1}. What should you do at a stop sign?`,
            hi: `यह सेट ${i + 1} के लिए हिंदी प्रश्न संख्या ${j + 1} है। स्टॉप साइन पर आपको क्या करना चाहिए?`
        },
        options: {
            en: ["Stop completely", "Slow down", "Honk", "Speed up"],
            hi: ["पूरी तरह रुकें", "धीमे चलें", "हॉर्न बजाएं", "गति बढ़ाएं"]
        },
        correctAnswer: {
            en: "Stop completely",
            hi: "पूरी तरह रुकें"
        }
    }))
}));


const generateId = () => {
    if (db) {
        return doc(collection(db, 'id-generator')).id;
    }
    return Math.random().toString(36).substring(2, 15);
};

// Helper to re-hydrate icons after fetching from DB
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

// =================================================================
// USER MANAGEMENT - WRITE & ONE-TIME READ OPERATIONS
// =================================================================
export const getOrCreateGoogleUser = async (firebaseUser: FirebaseUser): Promise<UserProfile | null> => {
    if (!db) return null;
    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() } as UserProfile;
    } else {
        const newUser: Omit<UserProfile, 'id'> = {
            uniqueId: `CU-${generateId().slice(-6).toUpperCase()}`,
            name: firebaseUser.displayName || 'Google User',
            username: firebaseUser.email || '',
            contact: firebaseUser.email || '',
            phone: firebaseUser.phoneNumber || '',
            gender: 'Prefer not to say',
            location: 'TBD',
            subscriptionPlan: 'None',
            registrationTimestamp: format(new Date(), 'MMM dd, yyyy'),
            approvalStatus: 'Pending',
            myReferralCode: `${(firebaseUser.displayName || 'USER').split(' ')[0].toUpperCase()}${generateId().slice(-4)}`,
            photoURL: firebaseUser.photoURL || `https://placehold.co/100x100.png?text=${(firebaseUser.displayName || 'U').charAt(0)}`,
            totalReferralPoints: 0,
        };
        try {
            await setDoc(userRef, newUser);
            return { id: userRef.id, ...newUser };
        } catch(error: any) {
            console.error("Error creating new Google user:", error);
            toast({ title: "User Creation Failed", description: error.message, variant: "destructive" });
            return null;
        }
    }
};

export const authenticateUserByCredentials = async (username: string, password: string): Promise<UserProfile | null> => {
    if (!db) return null;
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", username), where("password", "==", password), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) return null;

        const userDoc = querySnapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() } as UserProfile;
    } catch (error: any) {
        console.error("Error authenticating user:", error);
        toast({ title: "Authentication Error", description: error.message, variant: "destructive" });
        return null;
    }
};

export const fetchUserById = async (userId: string): Promise<UserProfile | null> => {
    if (!db || !userId) return null;
    try {
        let userQuery;
        // Check if the ID is a Firebase Auth UID or a Drivergy uniqueId
        if (userId.startsWith('CU-') || userId.startsWith('TR-')) {
            userQuery = query(collection(db, 'users'), where('uniqueId', '==', userId), limit(1));
        } else {
            // Assume it's a Firestore document ID (which is the Firebase Auth UID)
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
        }

        const querySnapshot = await getDocs(userQuery);
        if (querySnapshot.empty) {
            return null;
        }

        const userDoc = querySnapshot.docs[0];
        const user = { id: userDoc.id, ...userDoc.data() } as UserProfile;

        if (user.uniqueId?.startsWith('CU') && user.assignedTrainerId) {
            const trainerRef = doc(db, "users", user.assignedTrainerId);
            const trainerSnap = await getDoc(trainerRef);
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
        toast({ title: "Data Fetch Error", description: `Could not fetch user profile: ${error.message}`, variant: "destructive" });
        return null;
    }
};


export const updateUserProfile = async (userId: string, data: UserProfileUpdateValues): Promise<UserProfile | null> => {
    if (!db) return null;
    try {
        const updateData: { [key: string]: any } = {
            name: data.name,
            contact: data.email,
            phone: data.phone,
            location: data.district,
            flatHouseNumber: data.flatHouseNumber,
            street: data.street,
            state: data.state,
            district: data.district,
            pincode: data.pincode,
        };

        if (data.photo) {
            updateData.photoURL = await uploadFile(data.photo, `user_photos/${userId}`);
        }

        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, updateData);
        const updatedDoc = await getDoc(userRef);
        return { id: updatedDoc.id, ...updatedDoc.data() } as UserProfile;
    } catch (error: any) {
        console.error("Error updating user profile:", error);
        toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        return null;
    }
};

export const changeUserPassword = async (userId: string, currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!db) return false;
    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists() || userSnap.data().password !== currentPassword) {
            return false;
        }
        await updateDoc(userRef, { password: newPassword });
        return true;
    } catch (error: any) {
        console.error("Error changing password:", error);
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return false;
    }
};

export const addCustomer = async (data: CustomerRegistrationFormValues): Promise<UserProfile | null> => {
    if (!db) return null;

    const newUser: Omit<UserProfile, 'id'> = {
        uniqueId: `CU-${generateId().slice(-6).toUpperCase()}`,
        name: data.name,
        username: data.username,
        password: data.password,
        contact: data.email,
        phone: data.phone,
        gender: data.gender,
        location: "TBD", // To be determined
        subscriptionPlan: "None", // Start with no plan
        registrationTimestamp: format(new Date(), 'MMM dd, yyyy'),
        approvalStatus: 'Pending', // Pending profile completion
        myReferralCode: `${data.name.split(' ')[0].toUpperCase()}${generateId().slice(-4)}`,
        photoURL: `https://placehold.co/100x100.png?text=${data.name.charAt(0)}`,
        totalReferralPoints: 0,
    };

    try {
        const userRef = doc(collection(db, 'users'));
        await setDoc(userRef, newUser);
        return { id: userRef.id, ...newUser };
    } catch (error: any) {
        console.error("Error adding customer:", error);
        toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
        return null;
    }
};

export const completeCustomerProfile = async (userId: string, data: FullCustomerDetailsValues): Promise<boolean> => {
    if (!db) return false;
    const getLessonsForPlan = (plan: string): number => ({ Premium: 20, Gold: 15, Basic: 10 }[plan] || 0);

    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            throw new Error("User profile not found.");
        }
        const user = userSnap.data();

        const photoIdUrl = await uploadFile(data.photoIdFile, `user_documents/${userId}`);
        const profileData = {
            subscriptionPlan: data.subscriptionPlan,
            vehicleInfo: data.vehiclePreference,
            trainerPreference: data.trainerPreference,
            flatHouseNumber: data.flatHouseNumber,
            street: data.street,
            district: data.district,
            state: data.state,
            pincode: data.pincode,
            location: data.district, // Set primary location from district
            dlStatus: data.dlStatus,
            dlNumber: data.dlNumber || '',
            dlTypeHeld: data.dlTypeHeld || '',
            photoIdType: data.photoIdType,
            photoIdNumber: data.photoIdNumber,
            photoIdUrl: photoIdUrl,
            subscriptionStartDate: format(data.subscriptionStartDate, 'MMM dd, yyyy'),
            totalLessons: getLessonsForPlan(data.subscriptionPlan),
            completedLessons: 0,
            approvalStatus: 'Pending' as ApprovalStatusType, // Now pending admin assignment
        };

        await updateDoc(userRef, profileData);

        // Create the lesson request for the admin
        const newRequestData: Omit<LessonRequest, 'id'> = {
            customerId: userId,
            customerName: user.name,
            vehicleType: data.vehiclePreference as VehicleType,
            status: 'Pending',
            requestTimestamp: new Date().toISOString(),
        };
        const newRequestRef = doc(collection(db, 'lessonRequests'));
        await setDoc(newRequestRef, newRequestData);
        return true;
    } catch (error: any) {
        console.error("Error completing customer profile:", error);
        if (error instanceof Error && error.message.includes("Cloudinary configuration")) {
            throw new Error("Cannot upload file: Server storage is not configured. Please contact support.");
        }
        throw new Error("An unexpected error occurred during profile update.");
    }
};

export const addTrainer = async (data: TrainerRegistrationFormValues): Promise<UserProfile | null> => {
    if (!db) return null;

    try {
        const [certUrl, dlUrl, aadhaarUrl] = await Promise.all([
            uploadFile(data.trainerCertificateFile, 'trainer_documents'),
            uploadFile(data.drivingLicenseFile, 'trainer_documents'),
            uploadFile(data.aadhaarCardFile, 'trainer_documents'),
        ]);

        const newTrainer: Omit<UserProfile, 'id'> = {
            uniqueId: `TR-${generateId().slice(-6).toUpperCase()}`,
            name: data.name,
            username: data.username,
            password: data.password,
            contact: data.email,
            phone: data.phone,
            location: data.location,
            gender: data.gender,
            subscriptionPlan: "Trainer",
            registrationTimestamp: format(new Date(), 'MMM dd, yyyy'),
            vehicleInfo: data.trainerVehicleType,
            approvalStatus: 'Pending',
            myReferralCode: `${data.name.split(' ')[0].toUpperCase()}${generateId().slice(-4)}`,
            photoURL: `https://placehold.co/100x100.png?text=${data.name.charAt(0)}`,
            specialization: data.specialization,
            yearsOfExperience: data.yearsOfExperience,
            trainerCertificateUrl: certUrl,
            drivingLicenseUrl: dlUrl,
            aadhaarCardUrl: aadhaarUrl,
        };

        const userRef = doc(collection(db, 'users'));
        await setDoc(userRef, newTrainer);
        return { id: userRef.id, ...newTrainer };
    } catch (error: any) {
        console.error("Error adding trainer:", error);
        if (error instanceof Error && error.message.includes("Cloudinary configuration")) {
            throw new Error("Server configuration error. Cannot upload documents. Please contact support.");
        }
        throw new Error(error.message || "An unexpected error occurred during registration.");
    }
};

export const assignTrainerToCustomer = async (customerId: string, trainerId: string): Promise<boolean> => {
    if (!db) return false;
    try {
        const customerRef = doc(db, "users", customerId);
        const customerSnap = await getDoc(customerRef);
        const trainerSnap = await getDoc(doc(db, "users", trainerId));

        if (!customerSnap.exists() || !trainerSnap.exists()) {
            throw new Error("Assign Trainer Error: Customer or Trainer document not found.");
        }

        const customerData = customerSnap.data() as UserProfile;
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
        toast({ title: "Assignment Failed", description: error.message, variant: "destructive" });
        return false;
    }
};


export const updateAssignmentStatusByTrainer = async (customerId: string, newStatus: 'Approved' | 'Rejected'): Promise<boolean> => {
    if (!db) return false;
    try {
        const customerRef = doc(db, "users", customerId);
        const updates: { [key: string]: any } = { approvalStatus: newStatus };

        if (newStatus === 'Approved') {
            const customerSnap = await getDoc(customerRef);
            if(!customerSnap.exists()) return false;
            const user = customerSnap.data() as UserProfile;
            const startDate = parse(user.subscriptionStartDate!, 'MMM dd, yyyy', new Date());
            const firstLessonDate = addDays(startDate, 2);
            firstLessonDate.setHours(9, 0, 0, 0);
            updates.upcomingLesson = format(firstLessonDate, 'MMM dd, yyyy, h:mm a');

            // Update lesson request to 'Active'
            const requestQuery = query(collection(db, 'lessonRequests'), where('customerId', '==', customerId));
            const requestSnapshot = await getDocs(requestQuery);
            if (!requestSnapshot.empty) {
                const requestDocRef = requestSnapshot.docs[0].ref;
                await updateDoc(requestDocRef, { status: 'Active' });
            }

        } else { // If trainer rejects
            updates.assignedTrainerId = null;
            updates.assignedTrainerName = null;
            updates.approvalStatus = 'Pending'; // Return to admin queue
        }

        await updateDoc(customerRef, updates);
        return true;
    } catch (error: any) {
        console.error("Error updating assignment by trainer:", error);
        toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        return false;
    }
};

export const updateUserAttendance = async (studentId: string, status: 'Present' | 'Absent'): Promise<boolean> => {
    if (!db) return false;
    try {
        const studentRef = doc(db, "users", studentId);
        const studentSnap = await getDoc(studentRef);
        if (!studentSnap.exists()) return false;

        const studentData = studentSnap.data() as UserProfile;
        const updates: { [key: string]: any } = { attendance: status };

        if (status === 'Present' && studentData.attendance !== 'Present') {
            updates.completedLessons = (studentData.completedLessons || 0) + 1;
        }

        await updateDoc(studentRef, updates);
        return true;
    } catch(error: any) {
        console.error("Error updating attendance:", error);
        toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        return false;
    }
};

export const updateSubscriptionStartDate = async (customerId: string, newDate: Date): Promise<UserProfile | null> => {
    if (!db) return null;
    const firstLessonDate = addDays(newDate, 2);
    firstLessonDate.setHours(9, 0, 0, 0);
    const updates = {
        subscriptionStartDate: format(newDate, 'MMM dd, yyyy'),
        upcomingLesson: format(firstLessonDate, 'MMM dd, yyyy, h:mm a'),
    };
    try {
        const customerRef = doc(db, 'users', customerId);
        await updateDoc(customerRef, updates);
        const updatedSnap = await getDoc(customerRef);
        return updatedSnap.exists() ? { id: updatedSnap.id, ...updatedSnap.data() } as UserProfile : null;
    } catch(error: any) {
        console.error("Error updating start date:", error);
        toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        return null;
    }
}

// =================================================================
// REAL-TIME LISTENERS
// =================================================================

const createListener = <T>(collectionName: string, callback: (data: T[]) => void, orderField?: string, orderDirection: 'asc' | 'desc' = 'asc') => {
    if (!isFirebaseConfigured() || !db) {
        if (collectionName === 'faqs') callback(MOCK_FAQS as any);
        else if (collectionName === 'blogPosts') callback(MOCK_BLOG_POSTS as any);
        else if (collectionName === 'quizSets') callback(MOCK_QUIZ_SETS as any);
        else if (collectionName === 'siteBanners') callback(MOCK_SITE_BANNERS as any);
        else callback([]);
        return () => {};
    }

    let q = query(collection(db, collectionName));
    if (orderField) {
        q = query(q, orderBy(orderField, orderDirection));
    }

    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[];
        callback(data);
    }, (error) => {
        console.error(`Error listening to ${collectionName}:`, error);
        toast({ title: "Connection Error", description: `Could not sync ${collectionName}.`, variant: "destructive" });
    });
};

export const listenToAllLessonRequests = (callback: (data: LessonRequest[]) => void) => createListener('lessonRequests', callback, 'requestTimestamp');
export const listenToAllFeedback = (callback: (data: Feedback[]) => void) => createListener('feedback', callback, 'submissionDate');
export const listenToAllReferrals = (callback: (data: Referral[]) => void) => {
    if (!isFirebaseConfigured() || !db) return () => {};
    const q = query(collection(db, "referrals"), orderBy("timestamp", "desc"));
    return onSnapshot(q, async (snapshot) => {
        const referrals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));
        if (referrals.length === 0) {
            callback([]);
            return;
        }

        const refereeIds = [...new Set(referrals.map(r => r.refereeId))].filter(Boolean);
        if (refereeIds.length === 0) {
            callback(referrals);
            return;
        }

        const usersMap = new Map<string, UserProfile>();
        // Firestore 'in' query supports up to 30 items. We need to batch if there are more.
        for (let i = 0; i < refereeIds.length; i += 30) {
            const batchIds = refereeIds.slice(i, i + 30);
            const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', batchIds));
            const usersSnapshot = await getDocs(usersQuery);
            usersSnapshot.forEach(doc => usersMap.set(doc.id, { id: doc.id, ...doc.data() } as UserProfile));
        }

        const enrichedReferrals = referrals.map(ref => {
            const referee = usersMap.get(ref.refereeId);
            return {
                ...ref,
                refereeUniqueId: referee?.uniqueId,
                refereeSubscriptionPlan: referee?.subscriptionPlan,
                refereeApprovalStatus: referee?.approvalStatus,
            };
        });
        callback(enrichedReferrals);
    }, (error) => {
        console.error(`Error listening to referrals:`, error);
        toast({ title: "Connection Error", description: `Could not sync referrals.`, variant: "destructive" });
    });
};
export const listenToQuizSets = (callback: (data: QuizSet[]) => void) => createListener('quizSets', callback);
export const listenToPromotionalPosters = (callback: (data: PromotionalPoster[]) => void) => createListener('promotionalPosters', callback);
export const listenToCourses = (callback: (data: Course[]) => void) => createListener('courses', callback);

export const listenToFaqs = (callback: (data: FaqItem[]) => void) => createListener('faqs', callback, undefined, 'asc');
export const listenToBlogPosts = (callback: (data: BlogPost[]) => void) => createListener('blogPosts', callback, 'date', 'desc');

export const listenToSiteBanners = (callback: (data: SiteBanner[]) => void) => {
    if (!isFirebaseConfigured() || !db) {
        callback(MOCK_SITE_BANNERS);
        return () => {}; // Return an empty unsubscribe function
    }

    const q = query(collection(db, 'siteBanners'));

    return onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            callback(MOCK_SITE_BANNERS); // Fallback if Firestore collection is empty
            return;
        }
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SiteBanner[];
        callback(data);
    }, (error) => {
        console.error(`Error listening to siteBanners:`, error);
        toast({ title: "Connection Error", description: `Could not sync siteBanners.`, variant: "destructive" });
        callback(MOCK_SITE_BANNERS); // Fallback on error
    });
};


export const listenToUser = (userId: string, callback: (data: UserProfile | null) => void) => {
    if (!isFirebaseConfigured() || !db) return () => {};
    return onSnapshot(doc(db!, 'users', userId), async (snap) => {
        if (!snap.exists()) {
            callback(null);
            return;
        }
        const user = { id: snap.id, ...snap.data() } as UserProfile;
        if (user.uniqueId?.startsWith('CU') && user.assignedTrainerId) {
            const trainerSnap = await getDoc(doc(db!, "users", user.assignedTrainerId));
            if (trainerSnap.exists()) {
                const trainer = trainerSnap.data() as UserProfile;
                user.assignedTrainerPhone = trainer.phone;
                user.assignedTrainerExperience = trainer.yearsOfExperience;
                user.assignedTrainerVehicleDetails = trainer.vehicleInfo;
            }
        }
        callback(user);
    });
};

export const listenToTrainerStudents = (trainerId: string, callback: (students: UserProfile[], feedback: Feedback[]) => void) => {
    if (!isFirebaseConfigured() || !db) return () => {};
    const studentsQuery = query(collection(db!, "users"), where("assignedTrainerId", "==", trainerId));
    const feedbackQuery = query(collection(db!, 'feedback'), where('trainerId', '==', trainerId));

    const unsubStudents = onSnapshot(studentsQuery, () => {
        Promise.all([getDocs(studentsQuery), getDocs(feedbackQuery)]).then(([studentsSnap, feedbackSnap]) => {
            const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
            const feedback = feedbackSnap.docs.map(d => ({ id: d.id, ...d.data() } as Feedback));
            callback(students, feedback);
        }).catch(err => console.error("Error fetching trainer student data:", err));
    }, (err) => console.error("Student listener error:", err));

    const unsubFeedback = onSnapshot(feedbackQuery, () => {
        Promise.all([getDocs(studentsQuery), getDocs(feedbackQuery)]).then(([studentsSnap, feedbackSnap]) => {
            const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
            const feedback = feedbackSnap.docs.map(d => ({ id: d.id, ...d.data() } as Feedback));
            callback(students, feedback);
        }).catch(err => console.error("Error fetching trainer feedback data:", err));
    }, (err) => console.error("Feedback listener error:", err));

    return () => {
        unsubStudents();
        unsubFeedback();
    };
}


// =================================================================
// CALCULATED/AGGREGATED DATA LISTENERS
// =================================================================

export const listenToSummaryData = (callback: (data: Partial<SummaryData>) => void) => {
    if (!isFirebaseConfigured() || !db) return () => {};
    const usersUnsub = onSnapshot(collection(db!, 'users'), (snap) => {
        const users = snap.docs.map(doc => doc.data() as UserProfile);
        const totalCustomers = users.filter(u => u.uniqueId?.startsWith('CU')).length;
        const totalInstructors = users.filter(u => u.uniqueId?.startsWith('TR')).length;
        const activeSubscriptions = users.filter(u => u.approvalStatus === 'Approved').length;
        const totalCertifiedTrainers = users.filter(u => u.uniqueId?.startsWith('TR') && u.approvalStatus === 'Approved').length;
        const totalEarnings = users.filter(u => u.approvalStatus === 'Approved' && u.subscriptionPlan !== 'Trainer').reduce((acc, user) => {
            if (user.subscriptionPlan === 'Premium') return acc + 9999;
            if (user.subscriptionPlan === 'Gold') return acc + 7499;
            if (user.subscriptionPlan === 'Basic') return acc + 3999;
            return acc;
        }, 0);

        callback({ totalCustomers, totalInstructors, activeSubscriptions, totalCertifiedTrainers, totalEarnings });
    }, (error) => {
      console.error("Error listening to users for summary:", error);
    });

    const requestsUnsub = onSnapshot(query(collection(db!, 'lessonRequests'), where('status', '==', 'Pending')), (snap) => {
        callback(prev => ({ ...prev, pendingRequests: snap.size }));
    }, (error) => {
      console.error("Error listening to lessonRequests for summary:", error);
    });

    const rescheduleUnsub = onSnapshot(query(collection(db!, 'rescheduleRequests'), where('status', '==', 'Pending')), (snap) => {
        callback(prev => ({ ...prev, pendingRescheduleRequests: snap.size }));
    }, (error) => {
      console.error("Error listening to rescheduleRequests for summary:", error);
    });

    return () => {
        usersUnsub();
        requestsUnsub();
        rescheduleUnsub();
    };
};

export const listenToCustomerLessonProgress = (callback: (data: LessonProgressData[]) => void) => {
    if (!isFirebaseConfigured() || !db) return () => {};
    const q = query(collection(db!, 'users'), where('approvalStatus', '==', 'Approved'));
    return onSnapshot(q, (snapshot) => {
        const users = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as UserProfile))
            .filter(u => u.assignedTrainerName);

        const progressData = users.map(c => ({
            studentId: c.uniqueId,
            studentName: c.name,
            trainerName: c.assignedTrainerName!,
            subscriptionPlan: c.subscriptionPlan,
            totalLessons: c.totalLessons || 0,
            completedLessons: c.completedLessons || 0,
            remainingLessons: (c.totalLessons || 0) - (c.completedLessons || 0),
        })).sort((a, b) => a.remainingLessons - b.remainingLessons);

        callback(progressData);
    }, (error) => {
      console.error("Error listening to lesson progress:", error);
    });
};

// =================================================================
// WRITE OPERATIONS (No changes needed for real-time, they trigger listeners)
// =================================================================

export const addRescheduleRequest = async (userId: string, customerName: string, originalDate: Date, newDate: Date): Promise<RescheduleRequest | null> => {
    if (!db) return null;
    const newRequest = {
        userId, customerName,
        originalLessonDate: format(originalDate, 'MMM dd, yyyy, h:mm a'),
        requestedRescheduleDate: format(newDate, 'MMM dd, yyyy, h:mm a'),
        status: 'Pending' as RescheduleRequestStatusType,
        requestTimestamp: new Date().toISOString(),
    };

    try {
        const docRef = await addDoc(collection(db, 'rescheduleRequests'), newRequest);
        return { id: docRef.id, ...newRequest };
    } catch(error: any) {
        console.error("Error adding reschedule request:", error);
        toast({ title: "Request Failed", description: error.message, variant: "destructive" });
        return null;
    }
};

export const updateRescheduleRequestStatus = async (requestId: string, newStatus: RescheduleRequestStatusType): Promise<boolean> => {
    if (!db) return false;
    try {
        const requestRef = doc(db, 'rescheduleRequests', requestId);
        await updateDoc(requestRef, { status: newStatus });
        if (newStatus === 'Approved') {
            const requestSnap = await getDoc(requestRef);
            if (!requestSnap.exists()) return false;
            const requestData = requestSnap.data() as RescheduleRequest;
            await updateDoc(doc(db, 'users', requestData.userId), { upcomingLesson: requestData.requestedRescheduleDate });
        }
        return true;
    } catch(error: any) {
        console.error("Error updating reschedule request:", error);
        toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        return false;
    }
};

export const addFeedback = async (customerId: string, customerName: string, trainerId: string, trainerName: string, rating: number, comment: string): Promise<boolean> => {
    if (!db) return false;
    const newFeedback: Omit<Feedback, 'id'> = { customerId, customerName, trainerId, trainerName, rating, comment, submissionDate: new Date().toISOString() };
    try {
        await addDoc(collection(db, 'feedback'), newFeedback);
        await updateDoc(doc(db, 'users', customerId), { feedbackSubmitted: true });
        return true;
    } catch(error: any) {
        console.error("Error adding feedback:", error);
        toast({ title: "Submit Failed", description: error.message, variant: "destructive" });
        return false;
    }
};

export const updateReferralPayoutStatus = async (referralId: string, status: PayoutStatusType): Promise<boolean> => {
    if (!db) return false;
    try {
        await updateDoc(doc(db, 'referrals', referralId), { payoutStatus: status });
        return true;
    } catch(error: any) {
        console.error("Error updating referral status:", error);
        toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        return false;
    }
};


export const addCourseModule = async (courseId: string, moduleData: Omit<CourseModule, 'id'>): Promise<Course | null> => {
    if (!db) return null;
    try {
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);
        if (!courseSnap.exists()) return null;
        const course = courseSnap.data() as Course;
        const newModule = { ...moduleData, id: generateId() };
        const updatedModules = [...(course.modules || []), newModule];
        await updateDoc(courseRef, { modules: updatedModules });
        return { ...course, modules: updatedModules, id: courseId };
    } catch (error: any) {
        console.error("Error adding course module:", error);
        toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        return null;
    }
};

export const updateCourseModule = async (courseId: string, moduleId: string, moduleData: CourseModuleFormValues): Promise<Course | null> => {
    if (!db) return null;
    try {
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);
        if (!courseSnap.exists()) return null;
        const course = courseSnap.data() as Course;
        const updatedModules = course.modules.map(m => m.id === moduleId ? { ...m, ...moduleData } : m);
        await updateDoc(courseRef, { modules: updatedModules });
        return { ...course, modules: updatedModules, id: courseId };
    } catch (error: any) {
        console.error("Error updating course module:", error);
        toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        return null;
    }
};

export const deleteCourseModule = async (courseId: string, moduleId: string): Promise<boolean> => {
    if (!db) return false;
    try {
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);
        if (!courseSnap.exists()) return false;
        const course = courseSnap.data() as Course;
        const updatedModules = course.modules.filter(m => m.id !== moduleId);
        await updateDoc(courseRef, { modules: updatedModules });
        return true;
    } catch(error: any) {
        console.error("Error deleting course module:", error);
        toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
        return false;
    }
};

export const updateQuizQuestion = async (quizSetId: string, questionId: string, data: QuizQuestionFormValues): Promise<QuizSet | null> => {
    if (!db) return null;
    try {
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
    } catch(error: any) {
        console.error("Error updating quiz question:", error);
        toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        return null;
    }
};


export const addFaq = async (data: FaqFormValues): Promise<FaqItem | null> => {
    if (!db) return null;
    try {
        const docRef = await addDoc(collection(db, 'faqs'), data);
        return { id: docRef.id, ...data };
    } catch (error: any) {
        console.error("Error adding FAQ:", error);
        toast({ title: "Save Failed", description: error.message, variant: "destructive" });
        return null;
    }
}

export const updateFaq = async (id: string, data: FaqFormValues): Promise<boolean> => {
    if (!db) return false;
    try {
        await updateDoc(doc(db, 'faqs', id), data);
        return true;
    } catch (error: any) {
        console.error("Error updating FAQ:", error);
        toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        return false;
    }
}

export const deleteFaq = async (id: string): Promise<boolean> => {
    if (!db) return false;
    try {
        await deleteDoc(doc(db, 'faqs', id));
        return true;
    } catch(error: any) {
        console.error("Error deleting FAQ:", error);
        toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
        return false;
    }
}

export const addBlogPost = async (data: BlogPostFormValues): Promise<BlogPost | null> => {
    if (!db) return null;
    let imageUrl = 'https://placehold.co/1200x800.png';
    if(data.imageFile) {
        imageUrl = await uploadFile(data.imageFile, 'blog_images');
    } else if (data.imageSrc) {
        imageUrl = data.imageSrc;
    }
    const newPost: BlogPost = { ...data, imageSrc: imageUrl };
    try {
        const q = query(collection(db, 'blogPosts'), where('slug', '==', newPost.slug));
        const existing = await getDocs(q);
        if (!existing.empty) { throw new Error("A blog post with this slug already exists."); }
        await setDoc(doc(db, 'blogPosts', newPost.slug), newPost);
        return newPost;
    } catch(error: any) {
        console.error("Error adding blog post:", error);
        toast({ title: "Save Failed", description: error.message, variant: "destructive" });
        return null;
    }
};

export const fetchBlogPostBySlug = async (slug: string): Promise<BlogPost | null> => {
    if (!isFirebaseConfigured() || !db) {
        return MOCK_BLOG_POSTS.find(p => p.slug === slug) || null;
    }
    try {
        const docRef = doc(db!, 'blogPosts', slug);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) return null;
        return snapshot.data() as BlogPost;
    } catch (error: any) {
        console.error("Error fetching blog post by slug:", error);
        toast({ title: "Data Fetch Error", description: `Could not fetch post: ${error.message}`, variant: "destructive" });
        return null;
    }
};

export const updateBlogPost = async (slug: string, data: BlogPostFormValues): Promise<boolean> => {
    if (!db) return false;
    try {
        const docRef = doc(db, 'blogPosts', slug);
        const updateData: Partial<BlogPostFormValues> = { ...data };
        if(data.imageFile) {
            updateData.imageSrc = await uploadFile(data.imageFile, 'blog_images');
        }
        delete updateData.imageFile;

        await updateDoc(docRef, updateData as any);
        return true;
    } catch(error: any) {
        console.error("Error updating blog post:", error);
        toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        return false;
    }
}

export const deleteBlogPost = async (slug: string): Promise<boolean> => {
    if (!db) return false;
    try {
        await deleteDoc(doc(db, 'blogPosts', slug));
        return true;
    } catch(error: any) {
        console.error("Error deleting blog post:", error);
        toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
        return false;
    }
}

export const updateSiteBanner = async (id: string, data: VisualContentFormValues): Promise<boolean> => {
    if (!db) return false;
    try {
        const updateData: Partial<VisualContentFormValues> = { ...data };
        if(data.imageFile) {
            updateData.imageSrc = await uploadFile(data.imageFile, 'site_visuals');
        }
        delete updateData.imageFile;
        await updateDoc(doc(db, 'siteBanners', id), updateData as any);
        return true;
    } catch(error: any) {
        console.error("Error updating site banner:", error);
        toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        return false;
    }
}

export const updatePromotionalPoster = async (id: string, data: VisualContentFormValues): Promise<boolean> => {
    if (!db) return false;
    try {
        const updateData: Partial<VisualContentFormValues> = { ...data };
        if(data.imageFile) {
            updateData.imageSrc = await uploadFile(data.imageFile, 'site_visuals');
        }
        delete updateData.imageFile;
        await updateDoc(doc(db, 'promotionalPosters', id), updateData as any);
        return true;
    } catch(error: any) {
        console.error("Error updating promotional poster:", error);
        toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        return false;
    }
}

// This one-time fetch is still needed for pages that don't need real-time updates.
export const fetchCourses = async (): Promise<Course[]> => {
    if (!isFirebaseConfigured() || !db) return [];
    try {
        const snapshot = await getDocs(collection(db!, "courses"));
        const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Course);
        return reAssignCourseIcons(courses);
    } catch (error: any) {
        console.error("Error fetching courses:", error);
        toast({ title: "Data Fetch Error", description: `Could not fetch courses: ${error.message}`, variant: "destructive" });
        return [];
    }
};

export const fetchQuizSets = async (): Promise<QuizSet[]> => {
    if (!isFirebaseConfigured() || !db) return MOCK_QUIZ_SETS;
    try {
        const snapshot = await getDocs(collection(db!, "quizSets"));
        if (snapshot.empty) {
            console.warn("No quiz sets found in Firestore, returning mock data.");
            return MOCK_QUIZ_SETS;
        }
        const sets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizSet));
        return sets;
    } catch (error: any) {
        console.error("Error fetching quiz sets:", error);
        toast({ title: "Data Fetch Error", description: `Could not fetch quiz sets: ${error.message}`, variant: "destructive" });
        return MOCK_QUIZ_SETS;
    }
};


export const fetchApprovedInstructors = async (filters: { location?: string; gender?: string } = {}): Promise<UserProfile[]> => {
    if (!db) return [];
    try {
        const q = query(
            collection(db, "users"),
            where("approvalStatus", "==", "Approved"),
            where("subscriptionPlan", "==", "Trainer")
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
        toast({ title: "Data Fetch Error", description: `Could not fetch trainers: ${error.message}`, variant: "destructive" });
        return [];
    }
};

export const fetchReferralsByUserId = async (userId: string | undefined): Promise<Referral[]> => {
    if (!db || !userId) return [];
    try {
        const q = query(collection(db, "referrals"), where("referrerId", "==", userId));
        const querySnapshot = await getDocs(q);

        const referrals = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));

        if (referrals.length === 0) return [];

        const refereeIds = referrals.map(r => r.refereeId);
        if(refereeIds.length === 0) return referrals;

        const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', refereeIds));
        const usersSnapshot = await getDocs(usersQuery);
        const usersMap = new Map<string, UserProfile>();
        usersSnapshot.forEach(doc => usersMap.set(doc.id, { id: doc.id, ...doc.data() } as UserProfile));

        return referrals.map(ref => {
            const referee = usersMap.get(ref.refereeId);
            return {
                ...ref,
                refereeUniqueId: referee?.uniqueId,
                refereeSubscriptionPlan: referee?.subscriptionPlan,
                refereeApprovalStatus: referee?.approvalStatus,
            };
        });
    } catch (error: any) {
        console.error("Error fetching user referrals:", error);
        toast({ title: "Data Fetch Error", description: `Could not fetch referrals: ${error.message}`, variant: "destructive" });
        return [];
    }
};
