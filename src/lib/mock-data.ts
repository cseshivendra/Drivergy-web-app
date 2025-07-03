
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  increment,
  writeBatch
} from "firebase/firestore";
import { db } from '@/lib/firebase';
import type { UserProfile, LessonRequest, SummaryData, VehicleType, Course, CourseModule, CustomerRegistrationFormValues, TrainerRegistrationFormValues, ApprovalStatusType, RescheduleRequest, RescheduleRequestStatusType, UserProfileUpdateValues, TrainerSummaryData, Feedback, LessonProgressData } from '@/types';
import { addDays, format, isPast } from 'date-fns';
import { Car, Bike, FileText } from 'lucide-react';

const reAssignCourseIcons = (coursesToHydrate: Course[]): Course[] => {
  return coursesToHydrate.map(course => {
    const needsReassignment = !course.icon || typeof course.icon !== 'function' || (typeof course.icon === 'object' && Object.keys(course.icon).length === 0) ;
    let newIcon = course.icon;

    if (course.id === 'course1' && needsReassignment) newIcon = Car;
    else if (course.id === 'course2' && needsReassignment) newIcon = Bike;
    else if (course.id === 'course3' && needsReassignment) newIcon = FileText;
    
    return { ...course, icon: newIcon };
  });
};

// --- User Management ---
export const authenticateUserByCredentials = async (username: string, password: string): Promise<UserProfile | null> => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username), where("password", "==", password), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        console.log(`[firestore] Authentication failed for username: ${username}`);
        return null;
    }
    
    const userDoc = querySnapshot.docs[0];
    console.log(`[firestore] Authenticated user: ${userDoc.data().name}`);
    return userDoc.data() as UserProfile;
}

export const updateUserProfile = async (userId: string, data: UserProfileUpdateValues): Promise<UserProfile | null> => {
  const userRef = doc(db, "users", userId);
  
  const updateData: Partial<UserProfile> = {
    name: data.name,
    contact: data.email,
    phone: data.phone,
    location: data.location,
  };

  if (data.photo) {
    updateData.photoURL = `https://placehold.co/100x100.png?text=${data.name.charAt(0)}&v=${Date.now()}`;
  }
  
  await updateDoc(userRef, updateData);
  
  const updatedDoc = await getDoc(userRef);
  return updatedDoc.exists() ? updatedDoc.data() as UserProfile : null;
};

export const changeUserPassword = async (userId: string, currentPassword: string, newPassword: string): Promise<boolean> => {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && userSnap.data().password === currentPassword) {
        await updateDoc(userRef, { password: newPassword });
        return true;
    }

    return false;
}

export const addCustomer = async (data: CustomerRegistrationFormValues): Promise<UserProfile> => {
  const newUserRef = doc(collection(db, "users"));
  const newIdSuffix = newUserRef.id.slice(-6);

  const getLessonsForPlan = (plan: string): number => {
    switch (plan) {
      case 'Premium': return 20;
      case 'Gold': return 15;
      case 'Basic': return 10;
      default: return 0;
    }
  };

  const newUser: UserProfile = {
    id: newUserRef.id,
    uniqueId: `CU${newIdSuffix.toUpperCase()}`,
    name: data.name,
    username: data.username,
    password: data.password,
    contact: data.email,
    phone: data.phone,
    location: data.location,
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
    photoIdType: data.photoIdType,
    photoIdNumber: data.photoIdNumber,
    trainerPreference: data.trainerPreference,
    myReferralCode: `${data.name.split(' ')[0].toUpperCase()}${newIdSuffix}`,
    attendance: 'Pending',
    photoURL: `https://placehold.co/100x100.png?text=${data.name.charAt(0)}`,
    subscriptionStartDate: format(data.subscriptionStartDate, 'MMM dd, yyyy'),
    totalLessons: getLessonsForPlan(data.subscriptionPlan),
    completedLessons: 0,
  };

  const batch = writeBatch(db);
  batch.set(newUserRef, newUser);

  const newRequestRef = doc(collection(db, "lessonRequests"));
  const newRequest: Omit<LessonRequest, 'id'> = {
    customerId: newUser.id,
    customerName: newUser.name,
    vehicleType: data.vehiclePreference as VehicleType,
    status: 'Pending',
    requestTimestamp: new Date().toISOString(),
  };
  batch.set(newRequestRef, newRequest);
  
  await batch.commit();
  
  return newUser;
};

export const addTrainer = async (data: TrainerRegistrationFormValues): Promise<UserProfile> => {
  const newTrainerRef = doc(collection(db, "users"));
  const newIdSuffix = newTrainerRef.id.slice(-6);
  
  const newTrainer: UserProfile = {
    id: newTrainerRef.id,
    uniqueId: `TR${newIdSuffix.toUpperCase()}`,
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
    myReferralCode: `${data.name.split(' ')[0].toUpperCase()}${newIdSuffix}`,
    photoURL: `https://placehold.co/100x100.png?text=${data.name.charAt(0)}`,
    specialization: data.specialization,
    yearsOfExperience: data.yearsOfExperience
  };
  
  await setDoc(newTrainerRef, newTrainer);
  return newTrainer;
};

export const updateUserApprovalStatus = async (userId: string, newStatus: ApprovalStatusType): Promise<boolean> => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { approvalStatus: newStatus });
  return true;
};

export const fetchAllUsers = async (): Promise<UserProfile[]> => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("registrationTimestamp", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as UserProfile);
};

export const fetchUserById = async (userId: string): Promise<UserProfile | null> => {
  const userRef = doc(db, "users", userId);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    const user = docSnap.data() as UserProfile;
    if (user.uniqueId.startsWith('CU') && user.assignedTrainerId && !user.assignedTrainerName) {
      const trainerSnap = await getDoc(doc(db, "users", user.assignedTrainerId));
      if (trainerSnap.exists()) {
        user.assignedTrainerName = trainerSnap.data().name;
      }
    }
    return user;
  } else {
    console.log(`[firestore] No user found with ID: ${userId}`);
    return null;
  }
};

export const fetchApprovedInstructors = async (filters: { location?: string; gender?: string } = {}): Promise<UserProfile[]> => {
  let q = query(collection(db, "users"), where("approvalStatus", "==", "Approved"), where("uniqueId", ">=", "TR"), where("uniqueId", "<", "TR\uffff"));

  if (filters.location && filters.location !== 'all') {
    q = query(q, where("location", "==", filters.location));
  }
  if (filters.gender && filters.gender !== 'all') {
    q = query(q, where("gender", "==", filters.gender));
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as UserProfile);
};

export const assignTrainerToCustomer = async (customerId: string, trainerId: string): Promise<boolean> => {
    const customerRef = doc(db, "users", customerId);
    const trainerSnap = await getDoc(doc(db, "users", trainerId));

    if (trainerSnap.exists()) {
        const trainer = trainerSnap.data();
        await updateDoc(customerRef, {
            approvalStatus: 'In Progress',
            assignedTrainerId: trainer.id,
            assignedTrainerName: trainer.name,
        });
        return true;
    }
    return false;
};

// --- Lesson Request Management ---
export const fetchAllLessonRequests = async (searchTerm?: string): Promise<LessonRequest[]> => {
    let q = query(collection(db, "lessonRequests"), orderBy("requestTimestamp", "desc"));
    const querySnapshot = await getDocs(q);
    let allRequests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LessonRequest));
    
    if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        allRequests = allRequests.filter(request => request.customerName.toLowerCase().includes(lowerSearchTerm));
    }
    return allRequests;
};

// --- Reschedule Request Management ---
export const addRescheduleRequest = async (userId: string, customerName: string, originalDate: Date, newDate: Date): Promise<RescheduleRequest> => {
    const newRequestRef = doc(collection(db, "rescheduleRequests"));
    const newRequest: Omit<RescheduleRequest, 'id'> = {
        userId,
        customerName,
        originalLessonDate: format(originalDate, 'MMM dd, yyyy, h:mm a'),
        requestedRescheduleDate: format(newDate, 'MMM dd, yyyy, h:mm a'),
        status: 'Pending',
        requestTimestamp: new Date().toISOString(),
    };
    await setDoc(newRequestRef, newRequest);
    return { id: newRequestRef.id, ...newRequest };
};

export const fetchRescheduleRequests = async (searchTerm?: string): Promise<RescheduleRequest[]> => {
    let q = query(collection(db, "rescheduleRequests"), orderBy("requestTimestamp", "desc"));
    const querySnapshot = await getDocs(q);
    let results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RescheduleRequest));

    if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        results = results.filter(req =>
            req.customerName.toLowerCase().includes(lowerSearchTerm) ||
            req.id.toLowerCase().includes(lowerSearchTerm)
        );
    }
    return results;
};

export const updateRescheduleRequestStatus = async (requestId: string, newStatus: RescheduleRequestStatusType): Promise<boolean> => {
    const requestRef = doc(db, "rescheduleRequests", requestId);
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) return false;

    const batch = writeBatch(db);
    batch.update(requestRef, { status: newStatus });

    if (newStatus === 'Approved') {
        const requestData = requestSnap.data() as RescheduleRequest;
        const customerRef = doc(db, "users", requestData.userId);
        batch.update(customerRef, { upcomingLesson: requestData.requestedRescheduleDate });
    }
    
    await batch.commit();
    return true;
};


// --- Summary & Courses ---
export const fetchSummaryData = async (): Promise<SummaryData> => {
    const usersRef = collection(db, "users");
    
    const customerQuery = query(usersRef, where("uniqueId", ">=", "CU"), where("uniqueId", "<", "CU\uffff"));
    const instructorQuery = query(usersRef, where("uniqueId", ">=", "TR"), where("uniqueId", "<", "TR\uffff"));
    const activeSubsQuery = query(usersRef, where("approvalStatus", "==", "Approved"));
    const pendingLessonRequestsQuery = query(collection(db, "lessonRequests"), where("status", "==", "Pending"));
    const pendingRescheduleQuery = query(collection(db, "rescheduleRequests"), where("status", "==", "Pending"));

    const [
      customerSnap, 
      instructorSnap, 
      activeSubsSnap, 
      pendingLessonRequestsSnap,
      pendingRescheduleSnap
    ] = await Promise.all([
      getDocs(customerQuery),
      getDocs(instructorQuery),
      getDocs(activeSubsQuery),
      getDocs(pendingLessonRequestsQuery),
      getDocs(pendingRescheduleQuery)
    ]);
    
    const totalEarnings = activeSubsSnap.size * 500;

    return {
        totalCustomers: customerSnap.size,
        totalInstructors: instructorSnap.size,
        activeSubscriptions: activeSubsSnap.size,
        pendingRequests: pendingLessonRequestsSnap.size,
        pendingRescheduleRequests: pendingRescheduleSnap.size,
        totalCertifiedTrainers: activeSubsSnap.size,
        totalEarnings: totalEarnings,
    };
};

// Course data can remain static for now as it's not managed in the DB yet
export let mockCourses: Course[] = [
    {
        id: 'course1',
        title: 'Comprehensive Car Program',
        description: 'From basics to advanced maneuvers, this course prepares you for confident city and highway driving.',
        icon: Car,
        totalEnrolled: 125,
        totalCertified: 98,
        image: 'https://placehold.co/600x400.png',
        modules: [
          { id: 'c1m1', title: 'Vehicle Controls & Basics', description: 'Understanding the car and its functions.', duration: '2 hours', recordedLectureLink: '#' },
          { id: 'c1m2', title: 'Parking & Reversing', description: 'Master parallel, perpendicular, and angle parking.', duration: '3 hours', recordedLectureLink: '#' },
          { id: 'c1m3', title: 'On-Road Traffic Navigation', description: 'Real-world driving in moderate traffic.', duration: '5 hours', recordedLectureLink: '#' },
        ],
    },
    {
        id: 'course2',
        title: 'Motorcycle Rider Course',
        description: 'Learn to ride a two-wheeler safely, covering balance, traffic rules, and emergency braking.',
        icon: Bike,
        totalEnrolled: 88,
        totalCertified: 71,
        image: 'https://placehold.co/600x400.png',
        modules: [
          { id: 'c2m1', title: 'Balancing and Control', description: 'Getting comfortable on the bike.', duration: '2 hours', recordedLectureLink: '#' },
          { id: 'c2m2', title: 'Safety and Gear', description: 'Importance of helmets and safety gear.', duration: '1 hour', recordedLectureLink: '#' },
        ],
    },
    {
        id: 'course3',
        title: 'RTO Test Preparation',
        description: 'A specialized course to help you ace the official RTO driving test and get your license.',
        icon: FileText,
        totalEnrolled: 210,
        totalCertified: 195,
        image: 'https://placehold.co/600x400.png',
        modules: [
          { id: 'c3m1', title: 'Theory and Signals', description: 'Covering all traffic signs and rules.', duration: '3 hours', recordedLectureLink: '#' },
          { id: 'c3m2', title: 'Practical Test Simulation', description: 'Simulating the official test environment.', duration: '2 hours', recordedLectureLink: '#' },
        ],
    },
];

export const fetchCourses = async (): Promise<Course[]> => {
  return reAssignCourseIcons(mockCourses);
};

// --- Trainer Specific Functions ---

export const fetchPendingAssignments = async (trainerId: string): Promise<UserProfile[]> => {
    const q = query(collection(db, "users"), where("assignedTrainerId", "==", trainerId), where("approvalStatus", "==", "In Progress"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as UserProfile);
};

export const updateAssignmentStatusByTrainer = async (customerId: string, newStatus: 'Approved' | 'Rejected'): Promise<boolean> => {
    const customerRef = doc(db, "users", customerId);
    const batch = writeBatch(db);

    if (newStatus === 'Approved') {
        const firstLessonDate = addDays(new Date(), Math.floor(Math.random() * 5) + 2);
        firstLessonDate.setHours(9, 0, 0, 0);

        batch.update(customerRef, {
            approvalStatus: 'Approved',
            upcomingLesson: format(firstLessonDate, 'MMM dd, yyyy, h:mm a'),
        });
        
        const customerSnap = await getDoc(customerRef);
        const customerData = customerSnap.data();

        const reqQuery = query(collection(db, "lessonRequests"), where("customerId", "==", customerId), where("status", "==", "Pending"), limit(1));
        const reqSnap = await getDocs(reqQuery);
        if (!reqSnap.empty) {
            const reqRef = reqSnap.docs[0].ref;
            batch.update(reqRef, { status: 'Active' });
        }

    } else { // Rejected
        batch.update(customerRef, {
            approvalStatus: 'Pending', // Back to admin queue
            assignedTrainerId: "", // Use empty string to clear field
            assignedTrainerName: "",
        });
    }

    await batch.commit();
    return true;
};

export const fetchAssignedCustomers = async (trainerId: string): Promise<UserProfile[]> => {
  const q = query(collection(db, "users"), where("assignedTrainerId", "==", trainerId), where("approvalStatus", "==", "Approved"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as UserProfile);
};

export const fetchTrainerSummary = async (trainerId: string): Promise<TrainerSummaryData> => {
    const assignedCustomersQuery = query(collection(db, "users"), where("assignedTrainerId", "==", trainerId), where("approvalStatus", "==", "Approved"));
    const feedbackQuery = query(collection(db, "feedback"), where("trainerId", "==", trainerId));
    
    const [assignedCustomersSnap, feedbackSnap] = await Promise.all([
      getDocs(assignedCustomersQuery),
      getDocs(feedbackQuery)
    ]);
    
    let avgRating = 4.8;
    if (!feedbackSnap.empty) {
        const totalRating = feedbackSnap.docs.reduce((acc, doc) => acc + doc.data().rating, 0);
        avgRating = parseFloat((totalRating / feedbackSnap.size).toFixed(1));
    }
    
    const summary: TrainerSummaryData = {
        totalStudents: assignedCustomersSnap.size,
        totalEarnings: assignedCustomersSnap.size * 2000,
        upcomingLessons: assignedCustomersSnap.docs.filter(doc => doc.data().upcomingLesson && new Date(doc.data().upcomingLesson) > new Date()).length,
        rating: avgRating
    };
    return summary;
}

export const updateUserAttendance = async (studentId: string, status: 'Present' | 'Absent'): Promise<boolean> => {
    const studentRef = doc(db, "users", studentId);
    const studentSnap = await getDoc(studentRef);

    if (studentSnap.exists()) {
        const student = studentSnap.data() as UserProfile;
        const updates: Partial<UserProfile> = { attendance: status };
        
        if (status === 'Present' && student.attendance !== 'Present' && (student.completedLessons ?? 0) < (student.totalLessons ?? 0)) {
            updates.completedLessons = increment(1);
        }
        
        await updateDoc(studentRef, updates);
        return true;
    }
    return false;
};

// --- Feedback Management ---

export const addFeedback = async (customerId: string, customerName: string, trainerId: string, trainerName: string, rating: number, comment: string): Promise<boolean> => {
  const newFeedbackRef = doc(collection(db, "feedback"));
  const newFeedback: Omit<Feedback, 'id'> = {
    customerId,
    customerName,
    trainerId,
    trainerName,
    rating,
    comment,
    submissionDate: new Date().toISOString(),
  };

  const customerRef = doc(db, "users", customerId);
  const batch = writeBatch(db);
  batch.set(newFeedbackRef, newFeedback);
  batch.update(customerRef, { feedbackSubmitted: true });
  await batch.commit();
  
  return true;
};

export const fetchAllFeedback = async (): Promise<Feedback[]> => {
    const q = query(collection(db, "feedback"), orderBy("submissionDate", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback));
};

export const fetchCustomerLessonProgress = async (): Promise<LessonProgressData[]> => {
  const q = query(collection(db, "users"), where("approvalStatus", "==", "Approved"), where("assignedTrainerName", "!=", null));
  const querySnapshot = await getDocs(q);

  const progressData: LessonProgressData[] = querySnapshot.docs.map(doc => {
    const c = doc.data() as UserProfile;
    return {
      studentId: c.uniqueId,
      studentName: c.name,
      trainerName: c.assignedTrainerName!,
      subscriptionPlan: c.subscriptionPlan,
      totalLessons: c.totalLessons || 0,
      completedLessons: c.completedLessons || 0,
      remainingLessons: (c.totalLessons || 0) - (c.completedLessons || 0),
    };
  });
  return progressData.sort((a, b) => a.remainingLessons - b.remainingLessons);
};

export const updateSubscriptionStartDate = async (customerId: string, newDate: Date): Promise<UserProfile | null> => {
  const customerRef = doc(db, "users", customerId);
  const firstLessonDate = addDays(newDate, 2);
  firstLessonDate.setHours(9, 0, 0, 0);

  await updateDoc(customerRef, {
    subscriptionStartDate: format(newDate, 'MMM dd, yyyy'),
    upcomingLesson: format(firstLessonDate, 'MMM dd, yyyy, h:mm a'),
  });

  const updatedDoc = await getDoc(customerRef);
  return updatedDoc.exists() ? updatedDoc.data() as UserProfile : null;
}
