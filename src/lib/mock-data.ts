
import type { UserProfile, LessonRequest, SummaryData, VehicleType, Course, CourseModule, CustomerRegistrationFormValues, TrainerRegistrationFormValues, ApprovalStatusType, RescheduleRequest, RescheduleRequestStatusType } from '@/types';
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
        // Ensure arrays are always returned as arrays, even if localStorage had `null` or malformed data.
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
};

// Initialize from localStorage or with defaults (empty arrays)
export let mockCustomers: UserProfile[] = getItemFromLocalStorage<UserProfile[]>(LOCAL_STORAGE_KEYS.CUSTOMERS, []);
export let mockInstructors: UserProfile[] = getItemFromLocalStorage<UserProfile[]>(LOCAL_STORAGE_KEYS.INSTRUCTORS, []);
export let mockTwoWheelerRequests: LessonRequest[] = getItemFromLocalStorage<LessonRequest[]>(LOCAL_STORAGE_KEYS.TWO_WHEELER_REQUESTS, []);
export let mockFourWheelerRequests: LessonRequest[] = getItemFromLocalStorage<LessonRequest[]>(LOCAL_STORAGE_KEYS.FOUR_WHEELER_REQUESTS, []);
export let mockRescheduleRequests: RescheduleRequest[] = getItemFromLocalStorage<RescheduleRequest[]>(LOCAL_STORAGE_KEYS.RESCHEDULE_REQUESTS, []);
export let mockCourses: Course[] = getItemFromLocalStorage<Course[]>(LOCAL_STORAGE_KEYS.COURSES, []);


// Filter out "Sneha Patel (Sample)" data after loading from localStorage or initializing
mockCustomers = mockCustomers.filter(customer => customer.name !== "Shivendra Singh");


const generateRandomDate = (startOffsetDays: number, endOffsetDays: number): string => {
  const days = Math.floor(Math.random() * (endOffsetDays - startOffsetDays + 1)) + startOffsetDays;
  return format(addDays(new Date(), -days), 'MMM dd, yyyy HH:mm');
};

const sampleCustomer: UserProfile = {
  id: 'sample-customer-uid',
  uniqueId: 'CU987654',
  name: 'Shivendra Singh',
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
};

// --- Initial Data Seeding (if localStorage is empty) ---
if (typeof window !== 'undefined') {
  // Ensure the sample customer always exists for the login functionality
  if (!mockCustomers.some(c => c.id === 'sample-customer-uid')) {
    mockCustomers.unshift(sampleCustomer);
    console.log('[mock-data] Sample customer was missing and has been re-seeded.');
  }
  
  if (!window.localStorage.getItem(LOCAL_STORAGE_KEYS.INSTRUCTORS) && mockInstructors.length === 0) {
      // Instructors start empty
  }
  if (!window.localStorage.getItem(LOCAL_STORAGE_KEYS.COURSES) && mockCourses.length === 0) {
    mockCourses = [
        {
            id: 'course1',
            title: 'Comprehensive Car Program',
            description: 'From basics to advanced maneuvers, this course prepares you for confident city and highway driving.',
            icon: Car, // Will be hydrated later
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
            icon: Bike, // Will be hydrated later
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
            icon: FileText, // Will be hydrated later
            totalEnrolled: 210,
            totalCertified: 195,
            image: 'https://placehold.co/600x400.png',
            modules: [
            { id: 'c3m1', title: 'Theory and Signals', description: 'Covering all traffic signs and rules.', duration: '3 hours', recordedLectureLink: '#' },
            { id: 'c3m2', title: 'Practical Test Simulation', description: 'Simulating the official test environment.', duration: '2 hours', recordedLectureLink: '#' },
            ],
        },
    ];
    console.log('[mock-data] Seeded initial course data as localStorage was empty.');
  }

  if (mockTwoWheelerRequests.length === 0 && mockFourWheelerRequests.length === 0 && 
      !window.localStorage.getItem(LOCAL_STORAGE_KEYS.TWO_WHEELER_REQUESTS) &&
      !window.localStorage.getItem(LOCAL_STORAGE_KEYS.FOUR_WHEELER_REQUESTS)) {
    console.log('[mock-data] Lesson request arrays are initially empty (no data in localStorage and no default samples seeded by the script).');
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
  const coursesToSave = mockCourses.map(c => ({ ...c, icon: undefined }));
  setItemInLocalStorage(LOCAL_STORAGE_KEYS.COURSES, coursesToSave); 
  console.log('[mock-data] All data saved to localStorage. Icons are stripped before saving courses.');
};


// --- User Management ---
export const addCustomer = (data: CustomerRegistrationFormValues): UserProfile => {
  console.log('[mock-data] addCustomer called with:', JSON.parse(JSON.stringify(data)));
  const newIdSuffix = mockCustomers.length + mockInstructors.length + 1 + Date.now(); 
  const newId = `u${newIdSuffix}`;
  const newUser: UserProfile = {
    id: newId,
    uniqueId: `CU${202500 + newIdSuffix}`,
    name: data.name,
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
  };
  mockCustomers.push(newUser);
  console.log('[mock-data] Customer added. Current mockCustomers:', JSON.parse(JSON.stringify(mockCustomers)));
  
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
  console.log(`[mock-data] Automatically added lesson request for ${newUser.name}:`, JSON.parse(JSON.stringify(newRequest)));
  
  if (data.referralCodeApplied) {
    console.log(`[mock-data] Customer ${newUser.name} used referral code: ${data.referralCodeApplied}`);
  }

  saveDataToLocalStorage();
  return newUser;
};

export const addTrainer = (data: TrainerRegistrationFormValues): UserProfile => {
  console.log('[mock-data] addTrainer called with:', JSON.parse(JSON.stringify(data)));
  const newIdSuffix = mockCustomers.length + mockInstructors.length + 1 + Date.now();
  const newId = `u${newIdSuffix}`;
  const newTrainer: UserProfile = {
    id: newId,
    uniqueId: `TR${202500 + newIdSuffix}`,
    name: data.name,
    contact: data.email, 
    location: data.location,
    subscriptionPlan: "Trainer", 
    registrationTimestamp: format(new Date(), 'MMM dd, yyyy HH:mm'),
    vehicleInfo: data.trainerVehicleType,
    approvalStatus: 'Pending',
    myReferralCode: `${data.name.split(' ')[0].toUpperCase()}${newId.slice(-4)}`,
  };
  mockInstructors.push(newTrainer);
  console.log('[mock-data] Trainer added. Current mockInstructors:', JSON.parse(JSON.stringify(mockInstructors)));
  mockSummaryData.totalInstructors = mockInstructors.length; 
  saveDataToLocalStorage();
  return newTrainer;
};

export const updateUserApprovalStatus = async (userId: string, userName: string, newStatus: ApprovalStatusType): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY / 2)); 
  let userFound = false;
  
  const customerIndex = mockCustomers.findIndex(c => c.id === userId);
  if (customerIndex !== -1) {
    mockCustomers[customerIndex].approvalStatus = newStatus;
    userFound = true;
    console.log(`[mock-data] Updated customer ${userId} to status ${newStatus}. mockCustomers:`, JSON.parse(JSON.stringify(mockCustomers)));
  } else {
    const instructorIndex = mockInstructors.findIndex(i => i.id === userId);
    if (instructorIndex !== -1) {
      mockInstructors[instructorIndex].approvalStatus = newStatus;
      userFound = true;
      console.log(`[mock-data] Updated instructor ${userId} to status ${newStatus}. mockInstructors:`, JSON.parse(JSON.stringify(mockInstructors)));
    }
  }
  
  if (userFound) {
    mockSummaryData.activeSubscriptions = mockCustomers.filter(c => c.approvalStatus === 'Approved' && c.subscriptionPlan !== 'N/A' && c.subscriptionPlan !== 'Trainer').length + mockInstructors.filter(i => i.approvalStatus === 'Approved').length;
    mockSummaryData.totalCertifiedTrainers = mockInstructors.filter(i => i.approvalStatus === 'Approved').length + mockCustomers.filter(c => c.approvalStatus === 'Approved').length;
    saveDataToLocalStorage();
  } else {
    console.error(`[mock-data] User with ID ${userId} not found for status update.`);
  }
  return userFound;
};


export const fetchCustomers = async (location?: string, subscription?: string, searchTerm?: string): Promise<UserProfile[]> => {
  console.log(`[mock-data] fetchCustomers called with: location='${location}', subscription='${subscription}', searchTerm='${searchTerm}'`);
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  
  let results = mockCustomers.filter(c => c.approvalStatus === 'Pending');
  console.log('[mock-data] current PENDING mockCustomers before further filters:', JSON.parse(JSON.stringify(results)));

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
  console.log('[mock-data] fetchCustomers (pending) results:', JSON.parse(JSON.stringify(results)));
  return results;
};

export const fetchInstructors = async (location?: string, subscription?: string, searchTerm?: string): Promise<UserProfile[]> => {
  console.log(`[mock-data] fetchInstructors called with: location='${location}', subscription='${subscription}', searchTerm='${searchTerm}'`);
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  
  let results = mockInstructors.filter(i => i.approvalStatus === 'Pending');
  console.log('[mock-data] current PENDING mockInstructors before further filters:', JSON.parse(JSON.stringify(results)));

  if (location && location.trim() !== '' && location !== 'all') {
    results = results.filter(i => i.location.toLowerCase() === location.toLowerCase().trim());
  }
  if (subscription && subscription !== 'all' && subscription !== 'Trainer') { 
    results = []; 
  } else if (subscription === 'Trainer' || !subscription || subscription === 'all' ) {
    // No change
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
  console.log('[mock-data] fetchInstructors (pending) results:', JSON.parse(JSON.stringify(results)));
  return results;
};

export const fetchUserById = async (userId: string): Promise<UserProfile | null> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY / 3));
  const allUsers = [...mockCustomers, ...mockInstructors];
  const user = allUsers.find(u => u.id === userId);
  console.log(`[mock-data] fetchUserById for ID '${userId}':`, JSON.parse(JSON.stringify(user)));
  return user || null;
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
  console.log(`[mock-data] fetchAllLessonRequests with searchTerm: '${searchTerm}':`, JSON.parse(JSON.stringify(allRequests)));
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
        // For simulation, let's request a date 2 days after the original
        requestedRescheduleDate: format(addDays(originalDate, 2), 'MMM dd, yyyy, h:mm a'),
        status: 'Pending',
        requestTimestamp: format(new Date(), 'MMM dd, yyyy, h:mm a'),
    };
    mockRescheduleRequests.unshift(newRequest); // Add to the top
    mockSummaryData.pendingRescheduleRequests = mockRescheduleRequests.filter(r => r.status === 'Pending').length;
    saveDataToLocalStorage();
    console.log('[mock-data] Added reschedule request:', JSON.parse(JSON.stringify(newRequest)));
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
    console.log(`[mock-data] fetchRescheduleRequests returning ${results.length} items.`);
    return results;
};

export const updateRescheduleRequestStatus = async (requestId: string, newStatus: RescheduleRequestStatusType): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY / 2));
    const requestIndex = mockRescheduleRequests.findIndex(req => req.id === requestId);
    if (requestIndex !== -1) {
        mockRescheduleRequests[requestIndex].status = newStatus;
        
        // If approved, find the customer and update their "upcoming lesson"
        if (newStatus === 'Approved') {
            const customerId = mockRescheduleRequests[requestIndex].userId;
            const customerIndex = mockCustomers.findIndex(c => c.id === customerId);
            if (customerIndex !== -1) {
                mockCustomers[customerIndex].upcomingLesson = mockRescheduleRequests[requestIndex].requestedRescheduleDate;
                 console.log(`[mock-data] Updated upcoming lesson for customer ${customerId} to ${mockRescheduleRequests[requestIndex].requestedRescheduleDate}`);
            }
        }
        
        mockSummaryData.pendingRescheduleRequests = mockRescheduleRequests.filter(r => r.status === 'Pending').length;
        saveDataToLocalStorage();
        console.log(`[mock-data] Updated reschedule request ${requestId} to status ${newStatus}.`);
        return true;
    }
    console.error(`[mock-data] Reschedule request with ID ${requestId} not found.`);
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
  console.log('[mock-data] fetchSummaryData returning:', JSON.parse(JSON.stringify(mockSummaryData)));
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


console.log('[mock-data] Final initial mockCustomers:', JSON.parse(JSON.stringify(mockCustomers)));
console.log('[mock-data] Final initial mockInstructors:', JSON.parse(JSON.stringify(mockInstructors)));
console.log('[mock-data] Final initial mockTwoWheelerRequests:', JSON.parse(JSON.stringify(mockTwoWheelerRequests)));
console.log('[mock-data] Final initial mockFourWheelerRequests:', JSON.parse(JSON.stringify(mockFourWheelerRequests)));
console.log('[mock-data] Final initial mockSummaryData:', JSON.parse(JSON.stringify(mockSummaryData)));

const loggableCourses = mockCourses.map(c => {
    const iconName = c.icon ? (c.icon as any).displayName || (c.icon as any).name || 'UnknownIcon' : undefined;
    return {...c, icon: iconName};
});
console.log('[mock-data] Final initial mockCourses (icons represented by name):', JSON.parse(JSON.stringify(loggableCourses)));

saveDataToLocalStorage();
