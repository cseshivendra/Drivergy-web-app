

import type { UserProfile, LessonRequest, SummaryData, VehicleType, Course, CourseModule, CustomerRegistrationFormValues, TrainerRegistrationFormValues, ApprovalStatusType, RescheduleRequest, RescheduleRequestStatusType, UserProfileUpdateValues, TrainerSummaryData, Feedback, LessonProgressData, Referral, PayoutStatusType, QuizSet, Question, CourseModuleFormValues, QuizQuestionFormValues, FaqItem, BlogPost, SiteBanner, PromotionalPoster, FaqFormValues, BlogPostFormValues, VisualContentFormValues, FullCustomerDetailsValues } from '@/types';
import { addDays, format, isFuture, parse } from 'date-fns';
import { Car, Bike, FileText } from 'lucide-react';
import { db, isFirebaseConfigured } from './firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, writeBatch, documentId, orderBy, limit, setDoc, onSnapshot } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

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


const generateId = () => {
    // Use Firestore's ID generation if available, otherwise fallback to a simple random string.
    // This ensures that even in mock mode, we can generate unique-enough IDs.
    if (db) {
        return doc(collection(db, 'id-generator')).id;
    }
    return Math.random().toString(36).substring(2, 15);
};

// Helper to re-hydrate icons after fetching from DB
const reAssignCourseIcons = (coursesToHydrate: Course[]): Course[] => {
    return coursesToHydrate.map(course => {
        let newIcon = course.icon;
        if (course.id === 'course1') newIcon = Car;
        else if (course.id === 'course2') newIcon = Bike;
        else if (course.id === 'course3') newIcon = FileText;
        return { ...course, icon: newIcon };
    });
};

// =================================================================
// USER MANAGEMENT - WRITE & ONE-TIME READ OPERATIONS
// =================================================================

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
  if (!db) return null;
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return null;

    const user = { id: userSnap.id, ...userSnap.data() } as UserProfile;

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
        const userRef = doc(db, "users", userId);
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
          // In a real app, upload data.photo to Firebase Storage and get the URL
          updateData.photoURL = `https://placehold.co/100x100.png?text=${data.name.charAt(0)}`;
        }
        
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

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
    location: "N/A", // Default valid value
    subscriptionPlan: "N/A", // Default valid value
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
        subscriptionStartDate: format(data.subscriptionStartDate, 'MMM dd, yyyy'),
        totalLessons: getLessonsForPlan(data.subscriptionPlan),
        completedLessons: 0,
        approvalStatus: 'Pending' as ApprovalStatusType, // Now pending admin assignment
    };

    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, profileData);
        // In a real app, upload data.photoIdFile to Firebase Storage here
        return true;
    } catch (error: any) {
        console.error("Error completing customer profile:", error);
        toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        return false;
    }
};

export const addTrainer = async (data: TrainerRegistrationFormValues): Promise<UserProfile | null> => {
   if (!db) return null;
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
  };

  try {
    const userRef = doc(collection(db, 'users'));
    await setDoc(userRef, newTrainer);
    return { id: userRef.id, ...newTrainer };
  } catch (error: any) {
    console.error("Error adding trainer:", error);
    toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
    return null;
  }
};

export const updateUserApprovalStatus = async (userToUpdate: UserProfile, newStatus: ApprovalStatusType): Promise<boolean> => {
    if (!db) return false;
    try {
        const userRef = doc(db, 'users', userToUpdate.id);
        await updateDoc(userRef, { approvalStatus: newStatus });
        return true;
    } catch (error: any)
    {
        console.error(`Error updating user ${userToUpdate.id} status:`, error);
        toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        return false;
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

        const batch = writeBatch(db);
        
        // Update customer to 'In Progress' and assign trainer details
        batch.update(customerRef, {
            approvalStatus: 'In Progress',
            assignedTrainerId: trainerId,
            assignedTrainerName: trainerData.name
        });

        // Create the lesson request now that the customer is assigned
        const newRequestData: Omit<LessonRequest, 'id'> = {
          customerId: customerId,
          customerName: customerData.name,
          vehicleType: customerData.vehicleInfo as VehicleType,
          status: 'Pending', // This is pending for the trainer to accept
          requestTimestamp: new Date().toISOString(),
        };
        const newRequestRef = doc(collection(db, 'lessonRequests'));
        batch.set(newRequestRef, newRequestData);
        
        await batch.commit();
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

const createListener = <T>(collectionName: string, callback: (data: T[]) => void, orderField?: string, orderDirection: 'asc' | 'desc' = 'asc', mockData: T[] = []) => {
    if (!isFirebaseConfigured()) {
        console.warn(`[createListener] Firebase is not configured. Using mock data for ${collectionName}.`);
        setTimeout(() => callback(mockData), 50); // Small delay to mimic async fetch
        return () => {}; // Return an empty unsubscribe function
    }
    
    let q = query(collection(db!, collectionName));
    if (orderField) {
        q = query(q, orderBy(orderField, orderDirection));
    }

    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[];
        callback(data);
    }, (error) => {
        console.error(`Error listening to ${collectionName}:`, error);
        toast({ title: "Connection Error", description: `Could not sync ${collectionName}. Using local data.`, variant: "destructive" });
        callback(mockData); // Fallback to mock data on error
    });
};

export const listenToAllUsers = (callback: (data: UserProfile[]) => void) => createListener('users', callback, 'registrationTimestamp');
export const listenToAllLessonRequests = (callback: (data: LessonRequest[]) => void) => createListener('lessonRequests', callback, 'requestTimestamp');
export const listenToRescheduleRequests = (callback: (data: RescheduleRequest[]) => void) => createListener('rescheduleRequests', callback, 'requestTimestamp');
export const listenToAllFeedback = (callback: (data: Feedback[]) => void) => createListener('feedback', callback, 'submissionDate');
export const listenToAllReferrals = (callback: (data: Referral[]) => void) => createListener('referrals', callback, 'timestamp');
export const listenToCourses = (callback: (data: Course[]) => void) => createListener('courses', (data) => callback(reAssignCourseIcons(data)));
export const listenToQuizSets = (callback: (data: QuizSet[]) => void) => createListener('quizSets', callback);
export const listenToFaqs = (callback: (data: FaqItem[]) => void) => createListener('faqs', callback, undefined, 'asc', MOCK_FAQS);
export const listenToBlogPosts = (callback: (data: BlogPost[]) => void) => createListener('blogPosts', callback, 'date', 'desc', MOCK_BLOG_POSTS);
export const listenToSiteBanners = (callback: (data: SiteBanner[]) => void) => createListener('siteBanners', callback, undefined, 'asc', MOCK_SITE_BANNERS);
export const listenToPromotionalPosters = (callback: (data: PromotionalPoster[]) => void) => createListener('promotionalPosters', callback);

export const listenToUser = (userId: string, callback: (data: UserProfile | null) => void) => {
    if (!isFirebaseConfigured()) return () => {};
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
    if (!isFirebaseConfigured()) return () => {};
    const studentsQuery = query(collection(db!, "users"), where("assignedTrainerId", "==", trainerId));
    const feedbackQuery = query(collection(db!, 'feedback'), where('trainerId', '==', trainerId));

    const unsubStudents = onSnapshot(studentsQuery, () => {
        // This is a bit of a trick. When student data changes, we refetch both to keep them in sync.
        Promise.all([getDocs(studentsQuery), getDocs(feedbackQuery)]).then(([studentsSnap, feedbackSnap]) => {
            const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
            const feedback = feedbackSnap.docs.map(d => ({ id: d.id, ...d.data() } as Feedback));
            callback(students, feedback);
        });
    });

    const unsubFeedback = onSnapshot(feedbackQuery, () => {
         Promise.all([getDocs(studentsQuery), getDocs(feedbackQuery)]).then(([studentsSnap, feedbackSnap]) => {
            const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
            const feedback = feedbackSnap.docs.map(d => ({ id: d.id, ...d.data() } as Feedback));
            callback(students, feedback);
        });
    });

    return () => {
        unsubStudents();
        unsubFeedback();
    };
}


// =================================================================
// CALCULATED/AGGREGATED DATA LISTENERS
// =================================================================

export const listenToSummaryData = (callback: (data: Partial<SummaryData>) => void) => {
    if (!isFirebaseConfigured()) return () => {};
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
    });

    const requestsUnsub = onSnapshot(query(collection(db!, 'lessonRequests'), where('status', '==', 'Pending')), (snap) => {
        callback(prev => ({ ...prev, pendingRequests: snap.size }));
    });
    
    const rescheduleUnsub = onSnapshot(query(collection(db!, 'rescheduleRequests'), where('status', '==', 'Pending')), (snap) => {
        callback(prev => ({ ...prev, pendingRescheduleRequests: snap.size }));
    });

    return () => {
        usersUnsub();
        requestsUnsub();
        rescheduleUnsub();
    };
};

export const listenToCustomerLessonProgress = (callback: (data: LessonProgressData[]) => void) => {
    if (!isFirebaseConfigured()) return () => {};
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
  const { imageFile, ...restOfData } = data;
  const newImageSrc = imageFile ? `https://placehold.co/1200x800.png?text=New` : data.imageSrc;
  const newPost: BlogPost = { ...restOfData, imageSrc: newImageSrc || 'https://placehold.co/1200x800.png' };

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
  if (!db) {
    return MOCK_BLOG_POSTS.find(p => p.slug === slug) || null;
  }
  try {
    const docRef = doc(db, 'blogPosts', slug);
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
    const { imageFile, ...restOfData } = data;
    const newImageSrc = imageFile ? `https://placehold.co/1200x800.png?text=Updated` : data.imageSrc;
    try {
        const docRef = doc(db, 'blogPosts', slug);
        await updateDoc(docRef, { ...restOfData, imageSrc: newImageSrc || data.imageSrc });
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
  const newImageSrc = data.imageFile ? 'https://placehold.co/1920x1080.png' : data.imageSrc;
  const updateData = { title: data.title, description: data.description, imageSrc: newImageSrc || 'https://placehold.co/1920x1080.png', imageHint: data.imageHint };
  try {
    await updateDoc(doc(db, 'siteBanners', id), updateData);
    return true;
  } catch(error: any) {
    console.error("Error updating site banner:", error);
    toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    return false;
  }
}

export const updatePromotionalPoster = async (id: string, data: VisualContentFormValues): Promise<boolean> => {
  if (!db) return false;
  const newImageSrc = data.imageFile ? 'https://placehold.co/600x800.png' : data.imageSrc;
  const updateData = { title: data.title, description: data.description, imageSrc: newImageSrc || 'https://placehold.co/600x800.png', imageHint: data.imageHint, href: data.href || '#' };
  
  try {
    await updateDoc(doc(db, 'promotionalPosters', id), updateData);
    return true;
  } catch(error: any) {
    console.error("Error updating promotional poster:", error);
    toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    return false;
  }
}

// These one-time fetches are still needed for pages that don't need real-time updates.
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

export const fetchReferralsByUserId = async (userId: string): Promise<Referral[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, "referrals"), where("referrerId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const referrals = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));

    if (referrals.length === 0) return [];
    
    const refereeIds = referrals.map(r => r.refereeId);
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
