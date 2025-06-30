
import type { UserProfile, LessonRequest, SummaryData, VehicleType, Course, CourseModule, CustomerRegistrationFormValues, TrainerRegistrationFormValues, ApprovalStatusType } from '@/types';
import { addDays, format } from 'date-fns';
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
  SUMMARY_DATA: 'drivergyMockSummaryData_v1',
  COURSES: 'drivergyMockCourses_v1', 
};

// Initialize from localStorage or with defaults (empty arrays)
export let mockCustomers: UserProfile[] = getItemFromLocalStorage<UserProfile[]>(LOCAL_STORAGE_KEYS.CUSTOMERS, []);
export let mockInstructors: UserProfile[] = getItemFromLocalStorage<UserProfile[]>(LOCAL_STORAGE_KEYS.INSTRUCTORS, []);
export let mockTwoWheelerRequests: LessonRequest[] = getItemFromLocalStorage<LessonRequest[]>(LOCAL_STORAGE_KEYS.TWO_WHEELER_REQUESTS, []);
export let mockFourWheelerRequests: LessonRequest[] = getItemFromLocalStorage<LessonRequest[]>(LOCAL_STORAGE_KEYS.FOUR_WHEELER_REQUESTS, []);
export let mockCourses: Course[] = getItemFromLocalStorage<Course[]>(LOCAL_STORAGE_KEYS.COURSES, []);


// Filter out "Sneha Patel (Sample)" data after loading from localStorage or initializing
mockCustomers = mockCustomers.filter(customer => customer.name !== "Sneha Patel (Sample)");
mockInstructors = mockInstructors.filter(instructor => instructor.name !== "Sneha Patel (Sample)");
mockTwoWheelerRequests = mockTwoWheelerRequests.filter(request => request.customerName !== "Sneha Patel (Sample)");
mockFourWheelerRequests = mockFourWheelerRequests.filter(request => request.customerName !== "Sneha Patel (Sample)");


const generateRandomDate = (startOffsetDays: number, endOffsetDays: number): string => {
  const days = Math.floor(Math.random() * (endOffsetDays - startOffsetDays + 1)) + startOffsetDays;
  return format(addDays(new Date(), -days), 'MMM dd, yyyy HH:mm');
};

// --- Initial Data Seeding (if localStorage is empty) ---
if (typeof window !== 'undefined') {
  if (!window.localStorage.getItem(LOCAL_STORAGE_KEYS.CUSTOMERS) && mockCustomers.length === 0) {
      // Customers start empty
  }
  if (!window.localStorage.getItem(LOCAL_STORAGE_KEYS.INSTRUCTORS) && mockInstructors.length === 0) {
      // Instructors start empty
  }
  if (!window.localStorage.getItem(LOCAL_STORAGE_KEYS.COURSES) && mockCourses.length === 0) {
      // Courses start empty
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
  totalEarnings: (mockCustomers.filter(c => c.approvalStatus === 'Approved').length + mockInstructors.filter(i => i.approvalStatus === 'Approved').length) * 500, 
  totalCertifiedTrainers: mockInstructors.filter(i => i.approvalStatus === 'Approved').length + mockCustomers.filter(c => c.approvalStatus === 'Approved').length,
};

export let mockSummaryData: SummaryData = getItemFromLocalStorage<SummaryData>(LOCAL_STORAGE_KEYS.SUMMARY_DATA, calculatedInitialSummary);
mockSummaryData.totalCustomers = mockCustomers.length;
mockSummaryData.totalInstructors = mockInstructors.length;
mockSummaryData.pendingRequests = mockTwoWheelerRequests.filter(r => r.status === 'Pending').length + mockFourWheelerRequests.filter(r => r.status === 'Pending').length;


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
  setItemInLocalStorage(LOCAL_STORAGE_KEYS.SUMMARY_DATA, mockSummaryData);
  const coursesToSave = mockCourses.map(c => ({ ...c, icon: undefined }));
  setItemInLocalStorage(LOCAL_STORAGE_KEYS.COURSES, coursesToSave); 
  console.log('[mock-data] All data saved to localStorage. Icons are stripped before saving courses.');
};


// --- User Management ---
export const addCustomer = (data: CustomerRegistrationFormValues): UserProfile => {
  console.log('[mock-data] addCustomer called with:', JSON.parse(JSON.stringify(data)));
  const newIdSuffix = mockCustomers.length + mockInstructors.length + 1 + Date.now(); 
  const newUser: UserProfile = {
    id: `u${newIdSuffix}`,
    uniqueId: `CU${202500 + newIdSuffix}`,
    name: data.name,
    contact: data.email, 
    phone: data.phone,
    location: data.location,
    address: data.address,
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
  console.log(`[mock-data] Customer Photo ID Type: ${data.photoIdType}, Number: ${data.photoIdNumber}, File: ${data.photoIdFile?.[0]?.name || 'No file'}`);
  console.log(`[mock-data] Customer DL File: ${data.dlFileCopy?.[0]?.name || 'No file'}`);


  saveDataToLocalStorage();
  return newUser;
};

export const addTrainer = (data: TrainerRegistrationFormValues): UserProfile => {
  console.log('[mock-data] addTrainer called with:', JSON.parse(JSON.stringify(data)));
  const newIdSuffix = mockCustomers.length + mockInstructors.length + 1 + Date.now();
  const newTrainer: UserProfile = {
    id: `u${newIdSuffix}`,
    uniqueId: `TR${202500 + newIdSuffix}`,
    name: data.name,
    contact: data.email, 
    location: data.location,
    subscriptionPlan: "Trainer", 
    registrationTimestamp: format(new Date(), 'MMM dd, yyyy HH:mm'),
    vehicleInfo: data.trainerVehicleType,
    approvalStatus: 'Pending', 
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

// --- Summary & Courses ---
export const fetchSummaryData = async (): Promise<SummaryData> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  
  const currentPendingRequests = mockTwoWheelerRequests.filter(r => r.status === 'Pending').length + 
                                 mockFourWheelerRequests.filter(r => r.status === 'Pending').length;
  
  const currentActiveCustomerSubscriptions = mockCustomers.filter(c => c.approvalStatus === 'Approved' && c.subscriptionPlan !== 'N/A' && c.subscriptionPlan !== 'Trainer').length;
  const activeApprovedTrainers = mockInstructors.filter(i => i.approvalStatus === 'Approved').length;

  const updatedSummaryData: SummaryData = {
    totalCustomers: mockCustomers.length, 
    totalInstructors: mockInstructors.length, 
    activeSubscriptions: currentActiveCustomerSubscriptions + activeApprovedTrainers, 
    pendingRequests: currentPendingRequests,
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
