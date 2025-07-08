
import type { UserProfile, LessonRequest, SummaryData, VehicleType, Course, CourseModule, CustomerRegistrationFormValues, TrainerRegistrationFormValues, ApprovalStatusType, RescheduleRequest, RescheduleRequestStatusType, UserProfileUpdateValues, TrainerSummaryData, Feedback, LessonProgressData, Referral, PayoutStatusType, QuizSet, Question, CourseModuleFormValues, QuizQuestionFormValues, FaqItem, BlogPost, SiteBanner, PromotionalPoster, FaqFormValues, BlogPostFormValues, VisualContentFormValues } from '@/types';
import { addDays, format, isFuture, parse } from 'date-fns';
import { Car, Bike, FileText } from 'lucide-react';
import { db } from './firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, writeBatch, documentId, orderBy, limit, setDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

const generateId = () => doc(collection(db!, 'mock')).id; // Use Firestore's ID generation

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
// USER MANAGEMENT
// =================================================================

export const authenticateUserByCredentials = async (username: string, password: string): Promise<UserProfile | null> => {
    if (!db) {
        toast({ title: "Database Error", description: "Firebase is not configured.", variant: "destructive" });
        return null;
    }

    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", username), where("password", "==", password), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }
        const userDoc = querySnapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() } as UserProfile;
    } catch (error: any) {
        console.error("Error authenticating user:", error);
        toast({ title: "Authentication Error", description: error.message, variant: "destructive" });
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
  const getLessonsForPlan = (plan: string): number => ({ Premium: 20, Gold: 15, Basic: 10 }[plan] || 0);

  const newUser: Omit<UserProfile, 'id'> = {
    uniqueId: `CU-${generateId().slice(-6).toUpperCase()}`,
    name: data.name,
    username: data.username,
    password: data.password,
    contact: data.email,
    phone: data.phone,
    location: data.district,
    gender: data.gender,
    flatHouseNumber: data.flatHouseNumber,
    street: data.street,
    district: data.district,
    state: data.state,
    pincode: data.pincode,
    subscriptionPlan: data.subscriptionPlan,
    registrationTimestamp: new Date().toISOString(),
    vehicleInfo: data.vehiclePreference,
    approvalStatus: 'Pending',
    dlStatus: data.dlStatus,
    dlNumber: data.dlNumber,
    dlTypeHeld: data.dlTypeHeld,
    photoIdType: data.photoIdType,
    photoIdNumber: data.photoIdNumber,
    trainerPreference: data.trainerPreference,
    myReferralCode: `${data.name.split(' ')[0].toUpperCase()}${generateId().slice(-4)}`,
    attendance: 'Pending',
    photoURL: `https://placehold.co/100x100.png?text=${data.name.charAt(0)}`,
    subscriptionStartDate: format(data.subscriptionStartDate, 'MMM dd, yyyy'),
    totalLessons: getLessonsForPlan(data.subscriptionPlan),
    completedLessons: 0,
    totalReferralPoints: 0,
  };
  
  try {
    const docRef = await addDoc(collection(db, 'users'), newUser);
    const newRequestData: Omit<LessonRequest, 'id'> = { customerId: docRef.id, customerName: newUser.name, vehicleType: data.vehiclePreference as VehicleType, status: 'Pending', requestTimestamp: new Date().toISOString() };
    await addDoc(collection(db, 'lessonRequests'), newRequestData);
    return { id: docRef.id, ...newUser };
  } catch (error: any) {
    console.error("Error adding customer:", error);
    toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
    return null;
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
    registrationTimestamp: new Date().toISOString(),
    vehicleInfo: data.trainerVehicleType,
    approvalStatus: 'Pending',
    myReferralCode: `${data.name.split(' ')[0].toUpperCase()}${generateId().slice(-4)}`,
    photoURL: `https://placehold.co/100x100.png?text=${data.name.charAt(0)}`,
    specialization: data.specialization,
    yearsOfExperience: data.yearsOfExperience,
  };

  try {
    const docRef = await addDoc(collection(db, 'users'), newTrainer);
    return { id: docRef.id, ...newTrainer };
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

export const fetchAllUsers = async (): Promise<UserProfile[]> => {
  if (!db) return [];
  try {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, orderBy("registrationTimestamp", "desc"));
    const userSnapshot = await getDocs(q);
    return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserProfile[];
  } catch (error: any) {
    console.error("Error fetching all users:", error);
    toast({ title: "Data Fetch Error", description: `Could not fetch users: ${error.message}`, variant: "destructive" });
    return [];
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

export const fetchApprovedInstructors = async (filters: { location?: string; gender?: string } = {}): Promise<UserProfile[]> => {
  if (!db) return [];
  try {
    const q = query(
      collection(db, "users"),
      where("approvalStatus", "==", "Approved"),
      where("subscriptionPlan", "==", "Trainer")
    );
    const querySnapshot = await getDocs(q);
    
    // Perform subsequent filtering on the client side to avoid composite indexes
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

export const assignTrainerToCustomer = async (customerId: string, trainerId: string): Promise<boolean> => {
    if (!db) return false;
    try {
        const customerRef = doc(db, "users", customerId);
        const trainerDoc = await getDoc(doc(db, "users", trainerId));
        if (!trainerDoc.exists()) {
            throw new Error("Assign Trainer Error: Trainer document not found.");
        }

        const batch = writeBatch(db);
        batch.update(customerRef, {
            approvalStatus: 'In Progress',
            assignedTrainerId: trainerId,
            assignedTrainerName: trainerDoc.data().name
        });

        const requestQuery = query(collection(db, 'lessonRequests'), where('customerId', '==', customerId), where('status', '==', 'Pending'));
        const requestSnapshot = await getDocs(requestQuery);
        if (!requestSnapshot.empty) {
            const requestDocRef = requestSnapshot.docs[0].ref;
            batch.update(requestDocRef, { status: 'Active' });
        }

        await batch.commit();
        return true;
    } catch (error: any) {
        console.error("Error assigning trainer:", error);
        toast({ title: "Assignment Failed", description: error.message, variant: "destructive" });
        return false;
    }
};

// =================================================================
// SUMMARY & DASHBOARD DATA
// =================================================================

export const fetchSummaryData = async (): Promise<SummaryData | null> => {
   if (!db) return null;
   try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => doc.data() as UserProfile);

    const totalCustomers = users.filter(u => u.uniqueId?.startsWith('CU')).length;
    const totalInstructors = users.filter(u => u.uniqueId?.startsWith('TR')).length;
    const activeSubscriptions = users.filter(u => u.approvalStatus === 'Approved').length;
    const pendingRequests = (await getDocs(query(collection(db, 'lessonRequests'), where('status', '==', 'Pending')))).size;
    const pendingRescheduleRequests = (await getDocs(query(collection(db, 'rescheduleRequests'), where('status', '==', 'Pending')))).size;
    const totalCertifiedTrainers = users.filter(u => u.uniqueId?.startsWith('TR') && u.approvalStatus === 'Approved').length;

    const totalEarnings = users.filter(u => u.approvalStatus === 'Approved' && u.subscriptionPlan !== 'Trainer').reduce((acc, user) => {
      if (user.subscriptionPlan === 'Premium') return acc + 9999;
      if (user.subscriptionPlan === 'Gold') return acc + 7499;
      if (user.subscriptionPlan === 'Basic') return acc + 3999;
      return acc;
    }, 0);

    return { totalCustomers, totalInstructors, activeSubscriptions, pendingRequests, pendingRescheduleRequests, totalEarnings, totalCertifiedTrainers };
  } catch (error: any) {
    console.error("Error fetching summary data:", error);
    toast({ title: "Dashboard Load Error", description: `Could not fetch summary data: ${error.message}`, variant: "destructive" });
    return null;
  }
};

// =================================================================
// TRAINER SPECIFIC FUNCTIONS
// =================================================================
export const fetchAllTrainerStudents = async (trainerId: string): Promise<UserProfile[]> => {
    if (!db) return [];
    try {
        const q = query(collection(db, "users"), where("assignedTrainerId", "==", trainerId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserProfile[];
    } catch (error: any) {
        console.error("Error fetching trainer's students:", error);
        toast({ title: "Data Fetch Error", description: `Could not fetch students: ${error.message}`, variant: "destructive" });
        return [];
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
        } else { // Rejected
            updates.assignedTrainerId = null; // Using null to remove field
            updates.assignedTrainerName = null;
        }

        await updateDoc(customerRef, updates);
        return true;
    } catch (error: any) {
        console.error("Error updating assignment by trainer:", error);
        toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        return false;
    }
};

export const fetchTrainerFeedback = async (trainerId: string): Promise<Feedback[]> => {
    if (!db) return [];
    try {
        const q = query(collection(db, 'feedback'), where('trainerId', '==', trainerId), orderBy('submissionDate', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Feedback[];
    } catch (error: any) {
        console.error("Error fetching trainer feedback:", error);
        toast({ title: "Data Fetch Error", description: `Could not fetch feedback: ${error.message}`, variant: "destructive" });
        return [];
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

// =================================================================
// GENERIC CONTENT MANAGEMENT & OTHER FUNCTIONS
// =================================================================

export const fetchAllLessonRequests = async (): Promise<LessonRequest[]> => {
  if (!db) return [];
  try {
    const snapshot = await getDocs(query(collection(db, 'lessonRequests'), orderBy('requestTimestamp', 'desc')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LessonRequest[];
  } catch (error: any) {
    console.error("Error fetching lesson requests:", error);
    toast({ title: "Data Fetch Error", description: `Could not fetch requests: ${error.message}`, variant: "destructive" });
    return [];
  }
};

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

export const fetchRescheduleRequests = async (): Promise<RescheduleRequest[]> => {
  if (!db) return [];
  try {
    const snapshot = await getDocs(query(collection(db, 'rescheduleRequests'), orderBy('requestTimestamp', 'desc')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as RescheduleRequest[];
  } catch (error: any) {
    console.error("Error fetching reschedule requests:", error);
    toast({ title: "Data Fetch Error", description: `Could not fetch reschedule requests: ${error.message}`, variant: "destructive" });
    return [];
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

export const fetchAllFeedback = async (): Promise<Feedback[]> => {
  if (!db) return [];
  try {
    const snapshot = await getDocs(query(collection(db, 'feedback'), orderBy('submissionDate', 'desc')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Feedback[];
  } catch (error: any) {
    console.error("Error fetching all feedback:", error);
    toast({ title: "Data Fetch Error", description: `Could not fetch feedback: ${error.message}`, variant: "destructive" });
    return [];
  }
};

export const fetchCustomerLessonProgress = async (): Promise<LessonProgressData[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, 'users'), where('approvalStatus', '==', 'Approved'));
    const snapshot = await getDocs(q);
    const users = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as UserProfile))
        .filter(u => u.assignedTrainerName);

    return users.map(c => ({ studentId: c.uniqueId, studentName: c.name, trainerName: c.assignedTrainerName!, subscriptionPlan: c.subscriptionPlan, totalLessons: c.totalLessons || 0, completedLessons: c.completedLessons || 0, remainingLessons: (c.totalLessons || 0) - (c.completedLessons || 0), })).sort((a, b) => a.remainingLessons - b.remainingLessons);
  } catch (error: any) {
    console.error("Error fetching lesson progress:", error);
    toast({ title: "Data Fetch Error", description: `Could not fetch progress: ${error.message}`, variant: "destructive" });
    return [];
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

export const fetchAllReferrals = async (): Promise<Referral[]> => {
  if (!db) return [];
  try {
    const referralsSnapshot = await getDocs(query(collection(db, 'referrals'), orderBy('timestamp', 'desc')));
    const referrals = referralsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Referral[]);
    const refereeIds = [...new Set(referrals.map(r => r.refereeId).filter(Boolean))];

    if (refereeIds.length === 0) return referrals;

    const usersSnapshot = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', refereeIds)));
    const usersById = new Map(usersSnapshot.docs.map(doc => [doc.id, doc.data() as UserProfile]));

    return referrals.map(ref => {
      const referee = usersById.get(ref.refereeId);
      return { ...ref, refereeUniqueId: referee?.uniqueId, refereeSubscriptionPlan: referee?.subscriptionPlan, refereeApprovalStatus: referee?.approvalStatus, };
    });
  } catch (error: any) {
    console.error("Error fetching all referrals:", error);
    toast({ title: "Data Fetch Error", description: `Could not fetch referrals: ${error.message}`, variant: "destructive" });
    return [];
  }
};

export const fetchReferralsByUserId = async (userId: string): Promise<Referral[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, 'referrals'), where('referrerId', '==', userId), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Referral[];
  } catch (error: any) {
    console.error("Error fetching user referrals:", error);
    toast({ title: "Data Fetch Error", description: `Could not fetch your referrals: ${error.message}`, variant: "destructive" });
    return [];
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

export const fetchCourses = async (): Promise<Course[]> => {
  if (!db) return [];
  try {
    const snapshot = await getDocs(query(collection(db, 'courses')));
    if (snapshot.empty) return [];
    return reAssignCourseIcons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Course[]);
  } catch (error: any) {
    console.error("Error fetching courses:", error);
    toast({ title: "Data Fetch Error", description: `Could not fetch courses: ${error.message}`, variant: "destructive" });
    return [];
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

export const fetchQuizSets = async (): Promise<QuizSet[]> => {
  if (!db) return [];
  try {
    const snapshot = await getDocs(query(collection(db, 'quizSets')));
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as QuizSet[];
  } catch(error: any) {
    console.error("Error fetching quiz sets:", error);
    toast({ title: "Data Fetch Error", description: `Could not fetch quizzes: ${error.message}`, variant: "destructive" });
    return [];
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
                  options: { en: data.options_en.split('\\n').filter(o => o.trim() !== ''), hi: data.options_hi.split('\\n').filter(o => o.trim() !== '') },
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

export const fetchFaqs = async (): Promise<FaqItem[]> => {
  if (!db) return [];
  try {
    const snapshot = await getDocs(query(collection(db, 'faqs')));
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FaqItem[];
  } catch(error: any) {
    console.error("Error fetching FAQs:", error);
    toast({ title: "Data Fetch Error", description: `Could not fetch FAQs: ${error.message}`, variant: "destructive" });
    return [];
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

export const fetchBlogPosts = async (): Promise<BlogPost[]> => {
  if (!db) return [];
  try {
    const snapshot = await getDocs(query(collection(db, 'blogPosts'), orderBy('date', 'desc')));
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => doc.data() as BlogPost);
  } catch(error: any) {
    console.error("Error fetching blog posts:", error);
    toast({ title: "Data Fetch Error", description: `Could not fetch blog posts: ${error.message}`, variant: "destructive" });
    return [];
  }
};

export const addBlogPost = async (data: BlogPostFormValues): Promise<BlogPost | null> => {
  if (!db) return null;
  const { imageFile, ...restOfData } = data;
  const newImageSrc = imageFile ? `https://placehold.co/1200x800.png?text=New` : data.imageSrc;
  const newPost: BlogPost = { ...restOfData, imageSrc: newImageSrc || 'https://placehold.co/1200x800.png' };

  try {
    const q = query(collection(db, 'blogPosts'), where('slug', '==', newPost.slug));
    const existing = await getDocs(q);
    if (!existing.empty) { throw new Error("A blog post with this slug already exists."); }
    // Firestore doesn't have an auto-incrementing ID, and we're using slug as the key for lookup
    // so we set the document ID to be the slug for easy retrieval.
    await setDoc(doc(db, 'blogPosts', newPost.slug), newPost);
    return newPost;
  } catch(error: any) {
    console.error("Error adding blog post:", error);
    toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    return null;
  }
};

export const fetchBlogPostBySlug = async (slug: string): Promise<BlogPost | null> => {
  if (!db) return null;
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

export const fetchSiteBanners = async (): Promise<SiteBanner[]> => {
  if (!db) return [];
  try {
    const snapshot = await getDocs(query(collection(db, 'siteBanners')));
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SiteBanner[];
  } catch (error: any) {
    console.error("Error fetching site banners:", error);
    toast({ title: "Data Fetch Error", description: `Could not fetch banners: ${error.message}`, variant: "destructive" });
    return [];
  }
};

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

export const fetchPromotionalPosters = async (): Promise<PromotionalPoster[]> => {
  if (!db) return [];
  try {
    const snapshot = await getDocs(query(collection(db, 'promotionalPosters')));
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PromotionalPoster[];
  } catch (error: any) {
    console.error("Error fetching promotional posters:", error);
    toast({ title: "Data Fetch Error", description: `Could not fetch posters: ${error.message}`, variant: "destructive" });
    return [];
  }
};

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
    
