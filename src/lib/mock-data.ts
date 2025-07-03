
'use client';

import type { UserProfile, LessonRequest, SummaryData, VehicleType, Course, CourseModule, CustomerRegistrationFormValues, TrainerRegistrationFormValues, ApprovalStatusType, RescheduleRequest, RescheduleRequestStatusType, UserProfileUpdateValues, TrainerSummaryData, Feedback, LessonProgressData } from '@/types';
import { addDays, format, isFuture, parse } from 'date-fns';
import { Car, Bike, FileText } from 'lucide-react';

// =================================================================
// MOCK DATABASE & LOCAL STORAGE PERSISTENCE
// =================================================================

interface MockDatabase {
  users: UserProfile[];
  lessonRequests: LessonRequest[];
  rescheduleRequests: RescheduleRequest[];
  feedback: Feedback[];
  courses: Course[];
}

let MOCK_DB: MockDatabase = {
  users: [],
  lessonRequests: [],
  rescheduleRequests: [],
  feedback: [],
  courses: [
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
  ],
};

const reAssignCourseIcons = (coursesToHydrate: Course[]): Course[] => {
  return coursesToHydrate.map(course => {
    let newIcon = course.icon;
    if (course.id === 'course1') newIcon = Car;
    else if (course.id === 'course2') newIcon = Bike;
    else if (course.id === 'course3') newIcon = FileText;
    return { ...course, icon: newIcon };
  });
};

const saveData = () => {
  if (typeof window !== 'undefined') {
    // We remove the icon functions before saving to avoid non-serializable data errors
    const serializableDb = {
        ...MOCK_DB,
        courses: MOCK_DB.courses.map(({ icon, ...rest }) => rest)
    };
    localStorage.setItem('drivergyMockDb', JSON.stringify(serializableDb));
  }
};

const loadData = () => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('drivergyMockDb');
    if (data) {
      const parsedDb = JSON.parse(data);
      // After loading, we re-assign the icon functions based on ID
      parsedDb.courses = reAssignCourseIcons(parsedDb.courses || []);
      MOCK_DB = { ...MOCK_DB, ...parsedDb };
    }
  }
};

// Load data from localStorage when the app starts
loadData();


// =================================================================
// USER MANAGEMENT
// =================================================================

export const authenticateUserByCredentials = async (username: string, password: string): Promise<UserProfile | null> => {
  const user = MOCK_DB.users.find(u => u.username === username && u.password === password);
  return user ? { ...user } : null;
};

export const updateUserProfile = async (userId: string, data: UserProfileUpdateValues): Promise<UserProfile | null> => {
  const userIndex = MOCK_DB.users.findIndex(u => u.id === userId);
  if (userIndex === -1) return null;

  const updatedUser: UserProfile = {
    ...MOCK_DB.users[userIndex],
    name: data.name,
    contact: data.email,
    phone: data.phone,
    location: data.location,
    photoURL: data.photo ? `https://placehold.co/100x100.png?text=${data.name.charAt(0)}&v=${Date.now()}` : MOCK_DB.users[userIndex].photoURL,
  };
  MOCK_DB.users[userIndex] = updatedUser;
  saveData();
  return { ...updatedUser };
};

export const changeUserPassword = async (userId: string, currentPassword: string, newPassword: string): Promise<boolean> => {
  const userIndex = MOCK_DB.users.findIndex(u => u.id === userId);
  if (userIndex !== -1 && MOCK_DB.users[userIndex].password === currentPassword) {
    MOCK_DB.users[userIndex].password = newPassword;
    saveData();
    return true;
  }
  return false;
};

const generateId = () => `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const addCustomer = async (data: CustomerRegistrationFormValues): Promise<UserProfile> => {
  const newId = generateId();
  const getLessonsForPlan = (plan: string): number => ({ Premium: 20, Gold: 15, Basic: 10 }[plan] || 0);

  const newUser: UserProfile = {
    id: newId,
    uniqueId: `CU${newId.slice(-6).toUpperCase()}`,
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
    myReferralCode: `${data.name.split(' ')[0].toUpperCase()}${newId.slice(-4)}`,
    attendance: 'Pending',
    photoURL: `https://placehold.co/100x100.png?text=${data.name.charAt(0)}`,
    subscriptionStartDate: format(data.subscriptionStartDate, 'MMM dd, yyyy'),
    totalLessons: getLessonsForPlan(data.subscriptionPlan),
    completedLessons: 0,
  };
  MOCK_DB.users.push(newUser);
  
  const newRequest: LessonRequest = {
    id: generateId(),
    customerId: newUser.id,
    customerName: newUser.name,
    vehicleType: data.vehiclePreference as VehicleType,
    status: 'Pending',
    requestTimestamp: new Date().toISOString(),
  };
  MOCK_DB.lessonRequests.push(newRequest);
  
  saveData();
  return { ...newUser };
};

export const addTrainer = async (data: TrainerRegistrationFormValues): Promise<UserProfile> => {
  const newId = generateId();
  const newTrainer: UserProfile = {
    id: newId,
    uniqueId: `TR${newId.slice(-6).toUpperCase()}`,
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
    myReferralCode: `${data.name.split(' ')[0].toUpperCase()}${newId.slice(-4)}`,
    photoURL: `https://placehold.co/100x100.png?text=${data.name.charAt(0)}`,
    specialization: data.specialization,
    yearsOfExperience: data.yearsOfExperience,
  };
  MOCK_DB.users.push(newTrainer);
  saveData();
  return { ...newTrainer };
};

export const updateUserApprovalStatus = async (userId: string, newStatus: ApprovalStatusType): Promise<boolean> => {
  const userIndex = MOCK_DB.users.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    MOCK_DB.users[userIndex].approvalStatus = newStatus;
    saveData();
    return true;
  }
  return false;
};

export const fetchAllUsers = async (): Promise<UserProfile[]> => [...MOCK_DB.users].sort((a,b) => new Date(b.registrationTimestamp).getTime() - new Date(a.registrationTimestamp).getTime());

export const fetchUserById = async (userId: string): Promise<UserProfile | null> => MOCK_DB.users.find(u => u.id === userId) || null;

export const fetchApprovedInstructors = async (filters: { location?: string; gender?: string } = {}): Promise<UserProfile[]> => {
  return MOCK_DB.users.filter(u =>
    u.uniqueId.startsWith('TR') &&
    u.approvalStatus === 'Approved' &&
    (!filters.location || u.location === filters.location) &&
    (!filters.gender || u.gender === filters.gender)
  );
};

export const assignTrainerToCustomer = async (customerId: string, trainerId: string): Promise<boolean> => {
  const customerIndex = MOCK_DB.users.findIndex(u => u.id === customerId);
  const trainer = MOCK_DB.users.find(u => u.id === trainerId);

  if (customerIndex !== -1 && trainer) {
    MOCK_DB.users[customerIndex].approvalStatus = 'In Progress';
    MOCK_DB.users[customerIndex].assignedTrainerId = trainer.id;
    MOCK_DB.users[customerIndex].assignedTrainerName = trainer.name;
    saveData();
    return true;
  }
  return false;
};

// =================================================================
// REQUEST MANAGEMENT
// =================================================================

export const fetchAllLessonRequests = async (): Promise<LessonRequest[]> => [...MOCK_DB.lessonRequests].sort((a,b) => new Date(b.requestTimestamp).getTime() - new Date(a.requestTimestamp).getTime());

export const addRescheduleRequest = async (userId: string, customerName: string, originalDate: Date, newDate: Date): Promise<RescheduleRequest> => {
  const newRequest: RescheduleRequest = {
    id: generateId(),
    userId,
    customerName,
    originalLessonDate: format(originalDate, 'MMM dd, yyyy, h:mm a'),
    requestedRescheduleDate: format(newDate, 'MMM dd, yyyy, h:mm a'),
    status: 'Pending',
    requestTimestamp: new Date().toISOString(),
  };
  MOCK_DB.rescheduleRequests.push(newRequest);
  saveData();
  return newRequest;
};

export const fetchRescheduleRequests = async (): Promise<RescheduleRequest[]> => [...MOCK_DB.rescheduleRequests].sort((a,b) => new Date(b.requestTimestamp).getTime() - new Date(a.requestTimestamp).getTime());

export const updateRescheduleRequestStatus = async (requestId: string, newStatus: RescheduleRequestStatusType): Promise<boolean> => {
  const requestIndex = MOCK_DB.rescheduleRequests.findIndex(r => r.id === requestId);
  if (requestIndex === -1) return false;

  MOCK_DB.rescheduleRequests[requestIndex].status = newStatus;

  if (newStatus === 'Approved') {
    const requestData = MOCK_DB.rescheduleRequests[requestIndex];
    const customerIndex = MOCK_DB.users.findIndex(u => u.id === requestData.userId);
    if (customerIndex !== -1) {
      MOCK_DB.users[customerIndex].upcomingLesson = requestData.requestedRescheduleDate;
    }
  }
  saveData();
  return true;
};

// =================================================================
// SUMMARY & DASHBOARD DATA
// =================================================================

export const fetchSummaryData = async (): Promise<SummaryData> => {
  const totalCustomers = MOCK_DB.users.filter(u => u.uniqueId.startsWith('CU')).length;
  const totalInstructors = MOCK_DB.users.filter(u => u.uniqueId.startsWith('TR')).length;
  const activeSubscriptions = MOCK_DB.users.filter(u => u.approvalStatus === 'Approved').length;
  const pendingRequests = MOCK_DB.lessonRequests.filter(r => r.status === 'Pending').length;
  const pendingRescheduleRequests = MOCK_DB.rescheduleRequests.filter(r => r.status === 'Pending').length;
  const totalCertifiedTrainers = MOCK_DB.users.filter(u => u.uniqueId.startsWith('TR') && u.approvalStatus === 'Approved').length;
  
  const totalEarnings = MOCK_DB.users
    .filter(u => u.approvalStatus === 'Approved' && u.subscriptionPlan !== 'Trainer')
    .reduce((acc, user) => {
      if (user.subscriptionPlan === 'Premium') return acc + 9999;
      if (user.subscriptionPlan === 'Gold') return acc + 7499;
      if (user.subscriptionPlan === 'Basic') return acc + 3999;
      return acc;
    }, 0);

  return { totalCustomers, totalInstructors, activeSubscriptions, pendingRequests, pendingRescheduleRequests, totalEarnings, totalCertifiedTrainers };
};

export const fetchCourses = async (): Promise<Course[]> => [...MOCK_DB.courses];

// =================================================================
// TRAINER SPECIFIC FUNCTIONS
// =================================================================

export const fetchAllTrainerStudents = async (trainerId: string): Promise<UserProfile[]> => MOCK_DB.users.filter(u => u.assignedTrainerId === trainerId);

export const fetchTrainerFeedback = async (trainerId: string): Promise<Feedback[]> => MOCK_DB.feedback.filter(f => f.trainerId === trainerId);

export const updateAssignmentStatusByTrainer = async (customerId: string, newStatus: 'Approved' | 'Rejected'): Promise<boolean> => {
  const customerIndex = MOCK_DB.users.findIndex(u => u.id === customerId);
  if (customerIndex === -1) return false;

  MOCK_DB.users[customerIndex].approvalStatus = newStatus;

  if (newStatus === 'Approved') {
    const user = MOCK_DB.users[customerIndex];
    const startDate = parse(user.subscriptionStartDate!, 'MMM dd, yyyy', new Date());
    const firstLessonDate = addDays(startDate, 2);
    firstLessonDate.setHours(9, 0, 0, 0);
    
    MOCK_DB.users[customerIndex].upcomingLesson = format(firstLessonDate, 'MMM dd, yyyy, h:mm a');
    
    const reqIndex = MOCK_DB.lessonRequests.findIndex(r => r.customerId === customerId && r.status === 'Pending');
    if (reqIndex !== -1) {
      MOCK_DB.lessonRequests[reqIndex].status = 'Active';
    }
  } else { // Rejected
    MOCK_DB.users[customerIndex].assignedTrainerId = undefined;
    MOCK_DB.users[customerIndex].assignedTrainerName = undefined;
  }
  saveData();
  return true;
};

export const updateUserAttendance = async (studentId: string, status: 'Present' | 'Absent'): Promise<boolean> => {
    const studentIndex = MOCK_DB.users.findIndex(u => u.id === studentId);
    if (studentIndex === -1) return false;

    const student = MOCK_DB.users[studentIndex];
    const alreadyPresent = student.attendance === 'Present';

    student.attendance = status;

    if (status === 'Present' && !alreadyPresent) {
      student.completedLessons = (student.completedLessons || 0) + 1;
    }
    
    MOCK_DB.users[studentIndex] = student;
    saveData();
    return true;
};

// =================================================================
// FEEDBACK & MISC
// =================================================================

export const addFeedback = async (customerId: string, customerName: string, trainerId: string, trainerName: string, rating: number, comment: string): Promise<boolean> => {
  const newFeedback: Feedback = {
    id: generateId(),
    customerId,
    customerName,
    trainerId,
    trainerName,
    rating,
    comment,
    submissionDate: new Date().toISOString(),
  };
  MOCK_DB.feedback.push(newFeedback);

  const customerIndex = MOCK_DB.users.findIndex(u => u.id === customerId);
  if (customerIndex !== -1) {
    MOCK_DB.users[customerIndex].feedbackSubmitted = true;
  }
  
  saveData();
  return true;
};

export const fetchAllFeedback = async (): Promise<Feedback[]> => [...MOCK_DB.feedback].sort((a,b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());

export const fetchCustomerLessonProgress = async (): Promise<LessonProgressData[]> => {
  return MOCK_DB.users
    .filter(u => u.approvalStatus === 'Approved' && u.assignedTrainerName)
    .map(c => ({
      studentId: c.uniqueId,
      studentName: c.name,
      trainerName: c.assignedTrainerName!,
      subscriptionPlan: c.subscriptionPlan,
      totalLessons: c.totalLessons || 0,
      completedLessons: c.completedLessons || 0,
      remainingLessons: (c.totalLessons || 0) - (c.completedLessons || 0),
    }))
    .sort((a, b) => a.remainingLessons - b.remainingLessons);
};

export const updateSubscriptionStartDate = async (customerId: string, newDate: Date): Promise<UserProfile | null> => {
  const customerIndex = MOCK_DB.users.findIndex(u => u.id === customerId);
  if (customerIndex === -1) return null;

  const firstLessonDate = addDays(newDate, 2);
  firstLessonDate.setHours(9, 0, 0, 0);

  MOCK_DB.users[customerIndex].subscriptionStartDate = format(newDate, 'MMM dd, yyyy');
  MOCK_DB.users[customerIndex].upcomingLesson = format(firstLessonDate, 'MMM dd, yyyy, h:mm a');
  
  saveData();
  return { ...MOCK_DB.users[customerIndex] };
}
