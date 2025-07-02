
import type { UserProfile, LessonRequest, SummaryData, VehicleType, Course, CourseModule, CustomerRegistrationFormValues, TrainerRegistrationFormValues, ApprovalStatusType, RescheduleRequest, RescheduleRequestStatusType, UserProfileUpdateValues, TrainerSummaryData, Feedback } from '@/types';
import { addDays, format, subDays } from 'date-fns';
import { Car, Bike, FileText } from 'lucide-react'; // For course icons
import { Locations, TrainerPreferenceOptions } from '@/types'; // Import Locations for consistent use

const ARTIFICIAL_DELAY = 300; 

// --- LocalStorage Persistence ---

const getItemFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window !== 'undefined') {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsedItem = JSON.parse(item);
        if (Array.isArray(defaultValue) && !Array.isArray(parsedItem)) {
          console.warn(`localStorage item for key "${key}" was not an array, returning default.`);
          return defaultValue;
        }
        return parsedItem;
      }
      return defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  }
  return defaultValue;
};

const setItemInLocalStorage = <T>(key: string, value: T): void => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }
};

const LOCAL_STORAGE_KEYS = {
  CUSTOMERS: 'drivergyMockCustomers_v1', 
  INSTRUCTORS: 'drivergyMockInstructors_v1',
  TWO_WHEELER_REQUESTS: 'drivergyMockTwoWheelerRequests_v1',
  FOUR_WHEELER_REQUESTS: 'drivergyMockFourWheelerRequests_v1',
  RESCHEDULE_REQUESTS: 'drivergyMockRescheduleRequests_v1',
  SUMMARY_DATA: 'drivergyMockSummaryData_v1',
  COURSES: 'drivergyMockCourses_v1',
  FEEDBACK: 'drivergyMockFeedback_v1',
};

// Initialize from localStorage or with defaults (empty arrays)
export let mockCustomers: UserProfile[] = getItemFromLocalStorage<UserProfile[]>(LOCAL_STORAGE_KEYS.CUSTOMERS, []);
export let mockInstructors: UserProfile[] = getItemFromLocalStorage<UserProfile[]>(LOCAL_STORAGE_KEYS.INSTRUCTORS, []);
export let mockTwoWheelerRequests: LessonRequest[] = getItemFromLocalStorage<LessonRequest[]>(LOCAL_STORAGE_KEYS.TWO_WHEELER_REQUESTS, []);
export let mockFourWheelerRequests: LessonRequest[] = getItemFromLocalStorage<LessonRequest[]>(LOCAL_STORAGE_KEYS.FOUR_WHEELER_REQUESTS, []);
export let mockRescheduleRequests: RescheduleRequest[] = getItemFromLocalStorage<RescheduleRequest[]>(LOCAL_STORAGE_KEYS.RESCHEDULE_REQUESTS, []);
export let mockCourses: Course[] = getItemFromLocalStorage<Course[]>(LOCAL_STORAGE_KEYS.COURSES, []);
export let mockFeedback: Feedback[] = getItemFromLocalStorage<Feedback[]>(LOCAL_STORAGE_KEYS.FEEDBACK, []);

const generateRandomDate = (startOffsetDays: number, endOffsetDays: number): string => {
  const days = Math.floor(Math.random() * (endOffsetDays - startOffsetDays + 1)) + startOffsetDays;
  return format(addDays(new Date(), -days), 'MMM dd, yyyy HH:mm');
};

const sampleCustomer: UserProfile = {
  id: 'sample-customer-uid',
  uniqueId: 'CU987654',
  name: 'Shivendra Singh',
  username: 'shivendra',
  password: 'password123',
  contact: 'shivendra.singh@example.com',
  phone: '9123456789',
  location: 'Delhi',
  subscriptionPlan: 'Premium',
  registrationTimestamp: format(subDays(new Date(), 5), 'MMM dd, yyyy HH:mm'),
  vehicleInfo: 'Four-Wheeler',
  approvalStatus: 'Approved',
  flatHouseNumber: 'B-42',
  street: 'Main Street',
  district: 'New Delhi',
  state: 'Delhi',
  pincode: '110001',
  dlStatus: 'Already Have DL',
  dlNumber: 'DL01A1234567',
  photoIdType: 'Aadhaar Card',
  photoIdNumber: '123456789012',
  trainerPreference: 'Any',
  myReferralCode: 'SHIVENDRA2024',
  attendance: 'Pending',
};

const sampleTrainer: UserProfile = {
  id: 'sample-trainer-uid',
  uniqueId: 'TR123456',
  name: 'Rajesh Kumar',
  username: 'rajesh.trainer',
  password: 'password123',
  contact: 'rajesh.k@example.com',
  location: 'Mumbai',
  subscriptionPlan: 'Trainer',
  registrationTimestamp: format(subDays(new Date(), 30), 'MMM dd, yyyy HH:mm'),
  vehicleInfo: 'Car (Manual)',
  approvalStatus: 'Approved',
  myReferralCode: 'RAJESHPRO',
  specialization: 'Car',
  yearsOfExperience: 8,
};

// --- Initial Data Seeding (if localStorage is empty) ---
if (typeof window !== 'undefined') {
  // Ensure the sample customer always exists
  const sampleCustomerExists = mockCustomers.some(c => c.id === 'sample-customer-uid');
  if (!sampleCustomerExists) {
    mockCustomers.push(sampleCustomer);
  } else {
    const index = mockCustomers.findIndex(c => c.id === 'sample-customer-uid');
    mockCustomers[index] = { ...mockCustomers[index], ...sampleCustomer };
  }

  // Ensure the sample trainer always exists
  const sampleTrainerExists = mockInstructors.some(i => i.id === 'sample-trainer-uid');
  if (!sampleTrainerExists) {
      mockInstructors.push(sampleTrainer);
  } else {
    const index = mockInstructors.findIndex(i => i.id === 'sample-trainer-uid');
    mockInstructors[index] = { ...mockInstructors[index], ...sampleTrainer };
  }

  // Assign sample trainer to sample customer
  const sampleCustomerIndex = mockCustomers.findIndex(c => c.id === 'sample-customer-uid');
  if (sampleCustomerIndex !== -1) {
    if (!mockCustomers[sampleCustomerIndex].assignedTrainerId) {
      mockCustomers[sampleCustomerIndex].assignedTrainerId = sampleTrainer.id;
      mockCustomers[sampleCustomerIndex].assignedTrainerName = sampleTrainer.name;
    }
  }

  if (!window.localStorage.getItem(LOCAL_STORAGE_KEYS.COURSES) && mockCourses.length === 0) {
    mockCourses = [
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
  }
}

const calculatedInitialSummary: SummaryData = {
  totalCustomers: mockCustomers.length,
  totalInstructors: mockInstructors.length,
  activeSubscriptions: mockCustomers.filter(c => c.approvalStatus === 'Approved' && c.subscriptionPlan !== 'N/A' && c.subscriptionPlan !== 'Trainer').length + mockInstructors.filter(i => i.approvalStatus === 'Approved').length,
  pendingRequests: mockTwoWheelerRequests.filter(r => r.status === 'Pending').length + mockFourWheelerRequests.filter(r => r.status === 'Pending').length,
  pendingRescheduleRequests: mockRescheduleRequests.filter(r => r.status === 'Pending').length,
  totalEarnings: (mockCustomers.filter(c => c.approvalStatus === 'Approved').length + mockInstructors.filter(i => i.approvalStatus === 'Approved').length) * 500, 
  totalCertifiedTrainers: mockInstructors.filter(i => i.approvalStatus === 'Approved').length + mockCustomers.filter(c => c.approvalStatus === 'Approved').length,
};

export let mockSummaryData: SummaryData = getItemFromLocalStorage<SummaryData>(LOCAL_STORAGE_KEYS.SUMMARY_DATA, calculatedInitialSummary);
mockSummaryData.totalCustomers = mockCustomers.length;
mockSummaryData.totalInstructors = mockInstructors.length;
mockSummaryData.pendingRequests = mockTwoWheelerRequests.filter(r => r.status === 'Pending').length + mockFourWheelerRequests.filter(r => r.status === 'Pending').length;
mockSummaryData.pendingRescheduleRequests = mockRescheduleRequests.filter(r => r.status === 'Pending').length;


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

mockCourses = reAssignCourseIcons(mockCourses);


const saveDataToLocalStorage = () => {
  setItemInLocalStorage(LOCAL_STORAGE_KEYS.CUSTOMERS, mockCustomers);
  setItemInLocalStorage(LOCAL_STORAGE_KEYS.INSTRUCTORS, mockInstructors);
  setItemInLocalStorage(LOCAL_STORAGE_KEYS.TWO_WHEELER_REQUESTS, mockTwoWheelerRequests);
  setItemInLocalStorage(LOCAL_STORAGE_KEYS.FOUR_WHEELER_REQUESTS, mockFourWheelerRequests);
  setItemInLocalStorage(LOCAL_STORAGE_KEYS.RESCHEDULE_REQUESTS, mockRescheduleRequests);
  setItemInLocalStorage(LOCAL_STORAGE_KEYS.SUMMARY_DATA, mockSummaryData);
  setItemInLocalStorage(LOCAL_STORAGE_KEYS.FEEDBACK, mockFeedback);
  const coursesToSave = mockCourses.map(c => ({ ...c, icon: undefined }));
  setItemInLocalStorage(LOCAL_STORAGE_KEYS.COURSES, coursesToSave); 
};


// --- User Management ---
export const authenticateUserByCredentials = async (username: string, password: string): Promise<UserProfile | null> => {
    await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
    const allUsers = [...mockCustomers, ...mockInstructors];
    const user = allUsers.find(u => u.username === username && u.password === password);
    if (user) {
        console.log(`[mock-data] Authenticated user: ${user.name}`);
        return user;
    }
    console.log(`[mock-data] Authentication failed for username: ${username}`);
    return null;
}

export const updateUserProfile = async (userId: string, data: UserProfileUpdateValues): Promise<UserProfile | null> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  
  const customerIndex = mockCustomers.findIndex(c => c.id === userId);
  if (customerIndex !== -1) {
    mockCustomers[customerIndex] = {
      ...mockCustomers[customerIndex],
      name: data.name,
      contact: data.email,
      phone: data.phone,
      location: data.location,
    };
    saveDataToLocalStorage();
    return mockCustomers[customerIndex];
  }

  const instructorIndex = mockInstructors.findIndex(i => i.id === userId);
  if (instructorIndex !== -1) {
     mockInstructors[instructorIndex] = {
      ...mockInstructors[instructorIndex],
      name: data.name,
      contact: data.email,
      phone: data.phone,
      location: data.location,
    };
    saveDataToLocalStorage();
    return mockInstructors[instructorIndex];
  }

  return null;
};

export const changeUserPassword = async (userId: string, currentPassword: string, newPassword: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
    
    const customerIndex = mockCustomers.findIndex(c => c.id === userId);
    if (customerIndex !== -1 && mockCustomers[customerIndex].password === currentPassword) {
        mockCustomers[customerIndex].password = newPassword;
        saveDataToLocalStorage();
        return true;
    }

    const instructorIndex = mockInstructors.findIndex(i => i.id === userId);
    if (instructorIndex !== -1 && mockInstructors[instructorIndex].password === currentPassword) {
        mockInstructors[instructorIndex].password = newPassword;
        saveDataToLocalStorage();
        return true;
    }

    return false;
}

export const addCustomer = (data: CustomerRegistrationFormValues): UserProfile => {
  const newIdSuffix = mockCustomers.length + mockInstructors.length + 1 + Date.now(); 
  const newId = `u${newIdSuffix}`;
  const newUser: UserProfile = {
    id: newId,
    uniqueId: `CU${202500 + newIdSuffix}`,
    name: data.name,
    username: data.username,
    password: data.password,
    contact: data.email, 
    phone: data.phone,
    location: data.location,
    flatHouseNumber: data.flatHouseNumber,
    street: data.street,
    district: data.district,
    state: data.state,
    pincode: data.pincode,
    subscriptionPlan: data.subscriptionPlan,
    registrationTimestamp: format(new Date(), 'MMM dd, yyyy HH:mm'),
    vehicleInfo: data.vehiclePreference,
    approvalStatus: 'Pending', 
    dlStatus: data.dlStatus,
    dlNumber: data.dlNumber,
    photoIdType: data.photoIdType,
    photoIdNumber: data.photoIdNumber,
    trainerPreference: data.trainerPreference,
    myReferralCode: `${data.name.split(' ')[0].toUpperCase()}${newId.slice(-4)}`,
    attendance: 'Pending',
  };
  mockCustomers.push(newUser);
  
  mockSummaryData.totalCustomers = mockCustomers.length; 
  
  const vehicleTypeForRequest = data.vehiclePreference === 'Both' 
    ? (Math.random() < 0.5 ? 'Two-Wheeler' : 'Four-Wheeler') 
    : data.vehiclePreference;
  
  const newRequestIdSuffix = mockTwoWheelerRequests.length + mockFourWheelerRequests.length + 1 + Date.now();
  const newRequest: LessonRequest = {
    id: `r_auto_${newRequestIdSuffix}`,
    customerName: newUser.name,
    vehicleType: vehicleTypeForRequest as 'Two-Wheeler' | 'Four-Wheeler',
    status: 'Pending',
    requestTimestamp: format(new Date(), 'MMM dd, yyyy HH:mm'),
  };

  if (newRequest.vehicleType === 'Two-Wheeler') {
    mockTwoWheelerRequests.push(newRequest);
  } else {
    mockFourWheelerRequests.push(newRequest);
  }
  mockTwoWheelerRequests.sort((a, b) => new Date(b.requestTimestamp).getTime() - new Date(a.requestTimestamp).getTime());
  mockFourWheelerRequests.sort((a, b) => new Date(b.requestTimestamp).getTime() - new Date(a.requestTimestamp).getTime());

  mockSummaryData.pendingRequests = mockTwoWheelerRequests.filter(r => r.status === 'Pending').length + mockFourWheelerRequests.filter(r => r.status === 'Pending').length;
  
  saveDataToLocalStorage();
  return newUser;
};

export const addTrainer = (data: TrainerRegistrationFormValues): UserProfile => {
  const newIdSuffix = mockCustomers.length + mockInstructors.length + 1 + Date.now();
  const newId = `u${newIdSuffix}`;
  const newTrainer: UserProfile = {
    id: newId,
    uniqueId: `TR${202500 + newIdSuffix}`,
    name: data.name,
    username: data.username,
    password: data.password,
    contact: data.email, 
    location: data.location,
    subscriptionPlan: "Trainer", 
    registrationTimestamp: format(new Date(), 'MMM dd, yyyy HH:mm'),
    vehicleInfo: data.trainerVehicleType,
    approvalStatus: 'Pending',
    myReferralCode: `${data.name.split(' ')[0].toUpperCase()}${newId.slice(-4)}`,
  };
  mockInstructors.push(newTrainer);
  mockSummaryData.totalInstructors = mockInstructors.length; 
  saveDataToLocalStorage();
  return newTrainer;
};

export const updateUserApprovalStatus = async (userId: string, newStatus: ApprovalStatusType): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY / 2));
  let userFound = false;
  
  const customerIndex = mockCustomers.findIndex(c => c.id === userId);
  if (customerIndex !== -1) {
    mockCustomers[customerIndex].approvalStatus = newStatus;
    userFound = true;
    if (newStatus === 'Approved' && !mockCustomers[customerIndex].assignedTrainerId) {
        const approvedTrainers = mockInstructors.filter(i => i.approvalStatus === 'Approved');
        if (approvedTrainers.length > 0) {
            const randomTrainer = approvedTrainers[Math.floor(Math.random() * approvedTrainers.length)];
            mockCustomers[customerIndex].assignedTrainerId = randomTrainer.id;
            mockCustomers[customerIndex].assignedTrainerName = randomTrainer.name;
        }
    }
  } else {
    const instructorIndex = mockInstructors.findIndex(i => i.id === userId);
    if (instructorIndex !== -1) {
      mockInstructors[instructorIndex].approvalStatus = newStatus;
      userFound = true;
    }
  }
  
  if (userFound) {
    mockSummaryData.activeSubscriptions = mockCustomers.filter(c => c.approvalStatus === 'Approved' && c.subscriptionPlan !== 'N/A' && c.subscriptionPlan !== 'Trainer').length + mockInstructors.filter(i => i.approvalStatus === 'Approved').length;
    mockSummaryData.totalCertifiedTrainers = mockInstructors.filter(i => i.approvalStatus === 'Approved').length + mockCustomers.filter(c => c.approvalStatus === 'Approved').length;
    saveDataToLocalStorage();
  }
  return userFound;
};

export const fetchCustomers = async (location?: string, subscription?: string, searchTerm?: string): Promise<UserProfile[]> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  
  let results = mockCustomers.filter(c => c.approvalStatus === 'Pending');

  if (location && location.trim() !== '' && location !== 'all') {
    results = results.filter(c => c.location.toLowerCase() === location.toLowerCase().trim());
  }
  if (subscription && subscription !== 'all') {
    results = results.filter(c => c.subscriptionPlan === subscription);
  }
  
  if (searchTerm && searchTerm.trim() !== '') {
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    results = results.filter(c =>
      c.uniqueId.toLowerCase().includes(lowerSearchTerm) ||
      c.name.toLowerCase().includes(lowerSearchTerm) ||
      c.contact.toLowerCase().includes(lowerSearchTerm) 
    );
  }
  results.sort((a, b) => new Date(b.registrationTimestamp).getTime() - new Date(a.registrationTimestamp).getTime());
  return results;
};

export const fetchInstructors = async (location?: string, subscription?: string, searchTerm?: string): Promise<UserProfile[]> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  
  let results = mockInstructors.filter(i => i.approvalStatus === 'Pending' || i.approvalStatus === 'In Progress');

  if (location && location.trim() !== '' && location !== 'all') {
    results = results.filter(i => i.location.toLowerCase() === location.toLowerCase().trim());
  }
  if (subscription && subscription !== 'all' && subscription !== 'Trainer') { 
    results = []; 
  }

  if (searchTerm && searchTerm.trim() !== '') {
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    results = results.filter(i =>
      i.uniqueId.toLowerCase().includes(lowerSearchTerm) ||
      i.name.toLowerCase().includes(lowerSearchTerm) ||
      i.contact.toLowerCase().includes(lowerSearchTerm)
    );
  }
  results.sort((a, b) => new Date(b.registrationTimestamp).getTime() - new Date(a.registrationTimestamp).getTime());
  return results;
};

export const fetchUserById = async (userId: string): Promise<UserProfile | null> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY / 3));
  const allUsers = [...mockCustomers, ...mockInstructors];
  const user = allUsers.find(u => u.id === userId);
  
  if (user) {
    if (user.uniqueId.startsWith('CU') && user.assignedTrainerId && !user.assignedTrainerName) {
      const trainer = mockInstructors.find(i => i.id === user.assignedTrainerId);
      if (trainer) {
          user.assignedTrainerName = trainer.name;
      }
    }
    console.log(`[mock-data] fetchUserById for ID '${userId}':`, JSON.parse(JSON.stringify(user)));
  } else {
    console.log(`[mock-data] fetchUserById for ID '${userId}': User not found.`);
  }

  return user || null;
};

export const fetchApprovedInstructors = async (): Promise<UserProfile[]> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY / 2));
  return mockInstructors.filter(i => i.approvalStatus === 'Approved');
};

export const assignTrainerToCustomer = async (customerId: string, trainerId: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  const customerIndex = mockCustomers.findIndex(c => c.id === customerId);
  const trainer = mockInstructors.find(t => t.id === trainerId);

  if (customerIndex !== -1 && trainer) {
    const customer = mockCustomers[customerIndex];
    customer.approvalStatus = 'Approved';
    customer.assignedTrainerId = trainer.id;
    customer.assignedTrainerName = trainer.name;
    
    // Set a mock upcoming lesson date
    customer.upcomingLesson = format(addDays(new Date(), Math.floor(Math.random() * 5) + 2), 'MMM dd, yyyy, h:mm a');

    // Update summary data
    mockSummaryData.activeSubscriptions = mockCustomers.filter(c => c.approvalStatus === 'Approved').length + mockInstructors.filter(i => i.approvalStatus === 'Approved').length;
    const allRequests = [...mockTwoWheelerRequests, ...mockFourWheelerRequests];
    const requestIndex = allRequests.findIndex(r => r.customerName === customer.name && r.status === 'Pending');
    if (requestIndex !== -1) {
       allRequests[requestIndex].status = 'Active'; 
    }
    
    mockSummaryData.pendingRequests = mockTwoWheelerRequests.filter(r => r.status === 'Pending').length + mockFourWheelerRequests.filter(r => r.status === 'Pending').length;
    
    saveDataToLocalStorage();
    return true;
  }
  return false;
};

// --- Lesson Request Management ---
export const fetchAllLessonRequests = async (searchTerm?: string): Promise<LessonRequest[]> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  let allRequests = [...mockTwoWheelerRequests, ...mockFourWheelerRequests].sort((a, b) => {
    return new Date(b.requestTimestamp).getTime() - new Date(a.requestTimestamp).getTime();
  });
  
  if (searchTerm && searchTerm.trim() !== '') {
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    allRequests = allRequests.filter(request =>
      request.customerName.toLowerCase().includes(lowerSearchTerm)
    );
  }
  return allRequests;
};

// --- Reschedule Request Management ---
export const addRescheduleRequest = async (userId: string, customerName: string, originalDate: Date): Promise<RescheduleRequest> => {
    await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
    const newRequest: RescheduleRequest = {
        id: `resched-${Date.now()}`,
        userId,
        customerName,
        originalLessonDate: format(originalDate, 'MMM dd, yyyy, h:mm a'),
        requestedRescheduleDate: format(addDays(originalDate, 2), 'MMM dd, yyyy, h:mm a'),
        status: 'Pending',
        requestTimestamp: format(new Date(), 'MMM dd, yyyy HH:mm'),
    };
    mockRescheduleRequests.unshift(newRequest);
    mockSummaryData.pendingRescheduleRequests = mockRescheduleRequests.filter(r => r.status === 'Pending').length;
    saveDataToLocalStorage();
    return newRequest;
};

export const fetchRescheduleRequests = async (searchTerm?: string): Promise<RescheduleRequest[]> => {
    await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
    let results = [...mockRescheduleRequests];
    if (searchTerm && searchTerm.trim() !== '') {
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        results = results.filter(req =>
            req.customerName.toLowerCase().includes(lowerSearchTerm) ||
            req.id.toLowerCase().includes(lowerSearchTerm)
        );
    }
    results.sort((a, b) => new Date(b.requestTimestamp).getTime() - new Date(a.requestTimestamp).getTime());
    return results;
};

export const updateRescheduleRequestStatus = async (requestId: string, newStatus: RescheduleRequestStatusType): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY / 2));
    const requestIndex = mockRescheduleRequests.findIndex(req => req.id === requestId);
    if (requestIndex !== -1) {
        mockRescheduleRequests[requestIndex].status = newStatus;
        
        if (newStatus === 'Approved') {
            const customerId = mockRescheduleRequests[requestIndex].userId;
            const customerIndex = mockCustomers.findIndex(c => c.id === customerId);
            if (customerIndex !== -1) {
                mockCustomers[customerIndex].upcomingLesson = mockRescheduleRequests[requestIndex].requestedRescheduleDate;
            }
        }
        
        mockSummaryData.pendingRescheduleRequests = mockRescheduleRequests.filter(r => r.status === 'Pending').length;
        saveDataToLocalStorage();
        return true;
    }
    return false;
};


// --- Summary & Courses ---
export const fetchSummaryData = async (): Promise<SummaryData> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  
  const currentPendingLessonRequests = mockTwoWheelerRequests.filter(r => r.status === 'Pending').length + 
                                 mockFourWheelerRequests.filter(r => r.status === 'Pending').length;
  
  const currentActiveCustomerSubscriptions = mockCustomers.filter(c => c.approvalStatus === 'Approved' && c.subscriptionPlan !== 'N/A' && c.subscriptionPlan !== 'Trainer').length;
  const activeApprovedTrainers = mockInstructors.filter(i => i.approvalStatus === 'Approved').length;

  const updatedSummaryData: SummaryData = {
    totalCustomers: mockCustomers.length, 
    totalInstructors: mockInstructors.length, 
    activeSubscriptions: currentActiveCustomerSubscriptions + activeApprovedTrainers, 
    pendingRequests: currentPendingLessonRequests,
    pendingRescheduleRequests: mockRescheduleRequests.filter(r => r.status === 'Pending').length,
    totalCertifiedTrainers: mockInstructors.filter(i => i.approvalStatus === 'Approved').length + mockCustomers.filter(c => c.approvalStatus === 'Approved').length,
    totalEarnings: (currentActiveCustomerSubscriptions + activeApprovedTrainers) * 500, 
  };
  
  Object.assign(mockSummaryData, updatedSummaryData); 
  saveDataToLocalStorage(); 
  return mockSummaryData;
};


export const fetchCourses = async (): Promise<Course[]> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  
  const hydratedCourses = reAssignCourseIcons(mockCourses);
  
  const approvedCustomers = mockCustomers.filter(c => c.approvalStatus === 'Approved').length;
  
  const updatedCourses = hydratedCourses.map(course => {
    let newTotalEnrolled = course.totalEnrolled;
    let newTotalCertified = course.totalCertified;

    if (course.id === 'course1') { 
      newTotalEnrolled = Math.floor(approvedCustomers * 0.6); 
      newTotalCertified = Math.floor(newTotalEnrolled * 0.8); 
    } else if (course.id === 'course2') { 
      newTotalEnrolled = Math.floor(approvedCustomers * 0.4); 
      newTotalCertified = Math.floor(newTotalEnrolled * 0.7);
    } else if (course.id === 'course3') { 
      newTotalEnrolled = approvedCustomers; 
      newTotalCertified = Math.floor(newTotalEnrolled * 0.9);
    }
    return { ...course, totalEnrolled: newTotalEnrolled, totalCertified: newTotalCertified };
  });
  
  mockCourses = updatedCourses; 
  saveDataToLocalStorage(); 
  return [...mockCourses]; 
};

// --- Trainer Specific Functions ---

export const fetchAssignedCustomers = async (trainerId: string): Promise<UserProfile[]> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  const assigned = mockCustomers.filter(
    c => c.assignedTrainerId === trainerId && c.approvalStatus === 'Approved'
  );
  return assigned;
};

export const fetchTrainerSummary = async (trainerId: string): Promise<TrainerSummaryData> => {
    await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
    const assignedCustomers = mockCustomers.filter(c => c.assignedTrainerId === trainerId && c.approvalStatus === 'Approved');
    
    // Calculate average rating for the trainer
    const trainerFeedback = mockFeedback.filter(f => f.trainerId === trainerId);
    let avgRating = 4.8; // Default mock rating
    if (trainerFeedback.length > 0) {
        const totalRating = trainerFeedback.reduce((acc, curr) => acc + curr.rating, 0);
        avgRating = parseFloat((totalRating / trainerFeedback.length).toFixed(1));
    }
    
    const totalEarnings = assignedCustomers.length * 2000; // Mock earning per student
    
    const summary: TrainerSummaryData = {
        totalStudents: assignedCustomers.length,
        totalEarnings: totalEarnings,
        upcomingLessons: assignedCustomers.filter(c => c.upcomingLesson && new Date(c.upcomingLesson) > new Date()).length,
        rating: avgRating
    };
    return summary;
}

export const updateUserAttendance = async (studentId: string, status: 'Present' | 'Absent'): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY / 2));
    const studentIndex = mockCustomers.findIndex(c => c.id === studentId);
    if (studentIndex !== -1) {
        mockCustomers[studentIndex].attendance = status;
        saveDataToLocalStorage();
        return true;
    }
    return false;
};

// --- Feedback Management ---

export const addFeedback = async (customerId: string, customerName: string, trainerId: string, trainerName: string, rating: number, comment: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  const newFeedback: Feedback = {
    id: `fb-${Date.now()}`,
    customerId,
    customerName,
    trainerId,
    trainerName,
    rating,
    comment,
    submissionDate: format(new Date(), 'MMM dd, yyyy HH:mm'),
  };
  mockFeedback.unshift(newFeedback);
  
  const customerIndex = mockCustomers.findIndex(c => c.id === customerId);
  if (customerIndex !== -1) {
    mockCustomers[customerIndex].feedbackSubmitted = true;
  }

  saveDataToLocalStorage();
  return true;
};

export const fetchAllFeedback = async (): Promise<Feedback[]> => {
    await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
    return [...mockFeedback].sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.requestTimestamp).getTime());
};


saveDataToLocalStorage();
