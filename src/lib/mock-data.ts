
import type { UserProfile, LessonRequest, SummaryData, VehicleType, Course, CourseModule, CustomerRegistrationFormValues, TrainerRegistrationFormValues, ApprovalStatusType } from '@/types';
import { addDays, format } from 'date-fns';
import { Car, Bike, FileText } from 'lucide-react'; // For course icons
import { Locations } from '@/types'; // Import Locations for consistent use

const ARTIFICIAL_DELAY = 300; 

// Initialize empty arrays for dynamic data
export let mockCustomers: UserProfile[] = []; 
export let mockInstructors: UserProfile[] = []; 
export let mockTwoWheelerRequests: LessonRequest[] = []; 
export let mockFourWheelerRequests: LessonRequest[] = []; 

export const mockSummaryData: SummaryData = {
  totalCustomers: 0, 
  totalInstructors: 0,
  activeSubscriptions: 0, 
  pendingRequests: 0,
  totalEarnings: 0, 
  totalCertifiedTrainers: 0, 
};

const generateRandomDate = (startOffsetDays: number, endOffsetDays: number): string => {
  const days = Math.floor(Math.random() * (endOffsetDays - startOffsetDays + 1)) + startOffsetDays;
  return format(addDays(new Date(), -days), 'MMM dd, yyyy HH:mm');
};

// --- User Management ---
export const addCustomer = (data: CustomerRegistrationFormValues): UserProfile => {
  console.log('[mock-data] addCustomer called with:', JSON.parse(JSON.stringify(data)));
  const newIdSuffix = mockCustomers.length + mockInstructors.length + 1; // Ensure unique ID across types for simplicity
  const newUser: UserProfile = {
    id: `u${newIdSuffix}`,
    uniqueId: `CU${202500 + newIdSuffix}`,
    name: data.name,
    contact: data.email, 
    location: data.location,
    subscriptionPlan: data.subscriptionPlan,
    registrationTimestamp: format(new Date(), 'MMM dd, yyyy HH:mm'),
    vehicleInfo: data.vehiclePreference,
    approvalStatus: 'Pending', // Default approval status
  };
  mockCustomers.push(newUser);
  console.log('[mock-data] Customer added. Current mockCustomers:', JSON.parse(JSON.stringify(mockCustomers)));
  
  mockSummaryData.totalCustomers = mockCustomers.length; 
  mockSummaryData.activeSubscriptions = Math.floor(mockCustomers.filter(c => c.subscriptionPlan !== 'N/A' && c.approvalStatus === 'Approved').length * 0.85 + mockInstructors.filter(i => i.approvalStatus === 'Approved').length * 0.1);

  // Automatically create a lesson request for the new customer
  const vehicleTypeForRequest = data.vehiclePreference === 'Both' 
    ? (Math.random() < 0.5 ? 'Two-Wheeler' : 'Four-Wheeler') 
    : data.vehiclePreference;
  
  const newRequestIdSuffix = mockTwoWheelerRequests.length + mockFourWheelerRequests.length + 1;
  const newRequest: LessonRequest = {
    id: `r_auto_${newRequestIdSuffix}`,
    customerName: newUser.name, // Link request to the new customer
    vehicleType: vehicleTypeForRequest as 'Two-Wheeler' | 'Four-Wheeler',
    status: 'Pending',
    requestTimestamp: format(new Date(), 'MMM dd, yyyy HH:mm'),
  };

  if (newRequest.vehicleType === 'Two-Wheeler') {
    mockTwoWheelerRequests.push(newRequest);
  } else {
    mockFourWheelerRequests.push(newRequest);
  }
  mockSummaryData.pendingRequests = (mockSummaryData.pendingRequests || 0) + 1;
  console.log(`[mock-data] Automatically added lesson request for ${newUser.name}:`, JSON.parse(JSON.stringify(newRequest)));

  return newUser;
};

export const addTrainer = (data: TrainerRegistrationFormValues): UserProfile => {
  console.log('[mock-data] addTrainer called with:', JSON.parse(JSON.stringify(data)));
  const newIdSuffix = mockCustomers.length + mockInstructors.length + 1;
  const newTrainer: UserProfile = {
    id: `u${newIdSuffix}`,
    uniqueId: `TR${202500 + newIdSuffix}`,
    name: data.name,
    contact: data.email, 
    location: data.location,
    subscriptionPlan: "Trainer", 
    registrationTimestamp: format(new Date(), 'MMM dd, yyyy HH:mm'),
    vehicleInfo: data.trainerVehicleType,
    approvalStatus: 'Pending', // Default approval status
  };
  mockInstructors.push(newTrainer);
  console.log('[mock-data] Trainer added. Current mockInstructors:', JSON.parse(JSON.stringify(mockInstructors)));
  mockSummaryData.totalInstructors = mockInstructors.length; 
  return newTrainer;
};

export const updateUserApprovalStatus = async (userId: string, newStatus: ApprovalStatusType): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY / 2)); // Shorter delay for quick actions
  let userFound = false;
  
  const customerIndex = mockCustomers.findIndex(c => c.id === userId);
  if (customerIndex !== -1) {
    mockCustomers[customerIndex].approvalStatus = newStatus;
    userFound = true;
    if (newStatus === 'Approved') {
        mockSummaryData.activeSubscriptions = Math.floor(mockCustomers.filter(c => c.subscriptionPlan !== 'N/A' && c.approvalStatus === 'Approved').length * 0.85 + mockInstructors.filter(i => i.approvalStatus === 'Approved').length * 0.1);
    }
    console.log(`[mock-data] Updated customer ${userId} to status ${newStatus}. mockCustomers:`, JSON.parse(JSON.stringify(mockCustomers)));
  } else {
    const instructorIndex = mockInstructors.findIndex(i => i.id === userId);
    if (instructorIndex !== -1) {
      mockInstructors[instructorIndex].approvalStatus = newStatus;
      userFound = true;
       if (newStatus === 'Approved') {
        mockSummaryData.totalCertifiedTrainers = (mockSummaryData.totalCertifiedTrainers || 0) + 1; // Assuming 'certified' means approved
      }
      console.log(`[mock-data] Updated instructor ${userId} to status ${newStatus}. mockInstructors:`, JSON.parse(JSON.stringify(mockInstructors)));
    }
  }
  
  if (!userFound) {
    console.error(`[mock-data] User with ID ${userId} not found for status update.`);
  }
  return userFound;
};


export const fetchCustomers = async (location?: string, subscription?: string, searchTerm?: string): Promise<UserProfile[]> => {
  console.log(`[mock-data] fetchCustomers called with: location='${location}', subscription='${subscription}', searchTerm='${searchTerm}'`);
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  
  // For "New Customers" table, primarily show 'Pending'
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
  console.log('[mock-data] fetchCustomers (pending) results:', JSON.parse(JSON.stringify(results)));
  return results;
};

export const fetchInstructors = async (location?: string, subscription?: string, searchTerm?: string): Promise<UserProfile[]> => {
  console.log(`[mock-data] fetchInstructors called with: location='${location}', subscription='${subscription}', searchTerm='${searchTerm}'`);
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  
  // For "New Instructors" table, primarily show 'Pending'
  let results = mockInstructors.filter(i => i.approvalStatus === 'Pending');
  console.log('[mock-data] current PENDING mockInstructors before further filters:', JSON.parse(JSON.stringify(results)));

  if (location && location.trim() !== '' && location !== 'all') {
    results = results.filter(i => i.location.toLowerCase() === location.toLowerCase().trim());
  }
   // Trainers have a fixed "Trainer" subscription plan, so filtering by other plans might not be relevant here
   // unless we intend to filter them out if 'Trainer' isn't selected.
  if (subscription && subscription !== 'all' && subscription !== 'Trainer') { 
    results = []; // If filtering by a plan that's not 'Trainer', show no instructors.
  } else if (subscription === 'Trainer' || !subscription || subscription === 'all' ) {
    // If 'Trainer' is selected, or no subscription filter, or 'all plans', proceed.
  }


  if (searchTerm && searchTerm.trim() !== '') {
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    results = results.filter(i =>
      i.uniqueId.toLowerCase().includes(lowerSearchTerm) ||
      i.name.toLowerCase().includes(lowerSearchTerm) ||
      i.contact.toLowerCase().includes(lowerSearchTerm)
    );
  }
  console.log('[mock-data] fetchInstructors (pending) results:', JSON.parse(JSON.stringify(results)));
  return results;
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

// Legacy fetchRequests, might be deprecated if fetchAllLessonRequests is primary
export const fetchRequests = async (vehicleType: VehicleType, searchTerm?: string): Promise<LessonRequest[]> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  console.log(`[mock-data] fetchRequests called for ${vehicleType} with searchTerm: '${searchTerm}'`);
  
  let baseRequests: LessonRequest[] = [];
  if (vehicleType === 'Two-Wheeler') {
    baseRequests = mockTwoWheelerRequests;
  } else if (vehicleType === 'Four-Wheeler') {
     baseRequests = mockFourWheelerRequests;
  }

  if (searchTerm && searchTerm.trim() !== '') {
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    const filteredResults = baseRequests.filter(request =>
      request.customerName.toLowerCase().includes(lowerSearchTerm)
    );
    console.log(`[mock-data] fetchRequests for ${vehicleType} filtered by '${searchTerm}':`, JSON.parse(JSON.stringify(filteredResults)));
    return filteredResults;
  }
  
  console.log(`[mock-data] fetchRequests for ${vehicleType} (no search term):`, JSON.parse(JSON.stringify(baseRequests)));
  return baseRequests;
};


// --- Summary & Courses ---
export const fetchSummaryData = async (): Promise<SummaryData> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  
  const currentPendingRequests = mockTwoWheelerRequests.filter(r => r.status === 'Pending').length + 
                                 mockFourWheelerRequests.filter(r => r.status === 'Pending').length;
  
  const currentActiveSubscriptions = mockCustomers.filter(c => c.approvalStatus === 'Approved' && c.subscriptionPlan !== 'N/A' && c.subscriptionPlan !== 'Trainer').length;
  // Assuming trainers also contribute to a form of "active subscription" count or active user base
  const activeTrainers = mockInstructors.filter(i => i.approvalStatus === 'Approved').length;


  const updatedSummaryData: SummaryData = {
    ...mockSummaryData, 
    totalCustomers: mockCustomers.length, // Total registered, not just approved
    totalInstructors: mockInstructors.length, // Total registered, not just approved
    activeSubscriptions: currentActiveSubscriptions + activeTrainers, 
    pendingRequests: currentPendingRequests,
    totalCertifiedTrainers: mockInstructors.filter(i => i.approvalStatus === 'Approved').length + mockCustomers.filter(c => c.approvalStatus === 'Approved').length, // Example: count approved users as "certified" for this metric
  };
  
  Object.assign(mockSummaryData, updatedSummaryData);
  console.log('[mock-data] fetchSummaryData returning:', JSON.parse(JSON.stringify(updatedSummaryData)));
  return updatedSummaryData;
};

const carDrivingModules: CourseModule[] = [
  { id: 'cdm1', title: 'Introduction to Car Controls', description: 'Understanding the steering wheel, pedals, and gears.', duration: '45 mins', recordedLectureLink: '#' },
  { id: 'cdm2', title: 'Basic Maneuvers: Starting and Stopping', description: 'Smoothly starting, stopping, and basic parking.', duration: '60 mins', recordedLectureLink: '#' },
];

const twoWheelerModules: CourseModule[] = [
  { id: 'twm1', title: 'Understanding Your Two-Wheeler', description: 'Controls, balance, and safety gear.', duration: '40 mins', recordedLectureLink: '#' },
];

const rtoExamModules: CourseModule[] = [
  { id: 'rtom1', title: 'Understanding RTO Rules & Regulations', description: 'Key traffic laws and penalties.', duration: '60 mins', recordedLectureLink: '#' },
];
export const mockCourses: Course[] = [
  { 
    id: 'course1', 
    title: 'Car Driving Mastery', 
    description: 'Comprehensive car driving lessons from basic controls to advanced road skills and safety.', 
    icon: Car,
    totalEnrolled: 0, totalCertified: 0, modules: carDrivingModules, image: 'https://placehold.co/600x400.png',
  },
  { 
    id: 'course2', 
    title: 'Two-Wheeler Pro Rider', 
    description: 'Learn to ride two-wheelers confidently, covering balance, traffic navigation, and safety.',
    icon: Bike,
    totalEnrolled: 0, totalCertified: 0, modules: twoWheelerModules, image: 'https://placehold.co/600x400.png',
  },
  { 
    id: 'course3', 
    title: 'RTO Exam Success Guide', 
    description: 'Ace your RTO driving test with our detailed course on rules, signs, and mock tests.',
    icon: FileText,
    totalEnrolled: 0, totalCertified: 0, modules: rtoExamModules, image: 'https://placehold.co/600x400.png',
  },
];

export const fetchCourses = async (): Promise<Course[]> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  // Update course stats based on current (approved) user data for a more dynamic feel
  const approvedCustomers = mockCustomers.filter(c => c.approvalStatus === 'Approved').length;
  mockCourses[0].totalEnrolled = Math.floor(approvedCustomers * 0.6); // 60% of approved customers enroll in car mastery
  mockCourses[0].totalCertified = Math.floor(mockCourses[0].totalEnrolled * 0.8); // 80% of enrolled get certified
  
  mockCourses[1].totalEnrolled = Math.floor(approvedCustomers * 0.4); // 40% for two-wheeler
  mockCourses[1].totalCertified = Math.floor(mockCourses[1].totalEnrolled * 0.7);

  mockCourses[2].totalEnrolled = approvedCustomers; // All approved customers might check RTO guide
  mockCourses[2].totalCertified = Math.floor(mockCourses[2].totalEnrolled * 0.9);
  return mockCourses;
};

// Initialize summary data based on empty arrays
mockSummaryData.totalCustomers = mockCustomers.length;
mockSummaryData.totalInstructors = mockInstructors.length;
mockSummaryData.activeSubscriptions = 0;
mockSummaryData.pendingRequests = mockTwoWheelerRequests.filter(r => r.status === 'Pending').length + mockFourWheelerRequests.filter(r => r.status === 'Pending').length;
mockSummaryData.totalEarnings = 0; // Assuming earnings come from approved/active subscriptions
mockSummaryData.totalCertifiedTrainers = 0;

console.log('[mock-data] Initial mockCustomers:', JSON.parse(JSON.stringify(mockCustomers)));
console.log('[mock-data] Initial mockInstructors:', JSON.parse(JSON.stringify(mockInstructors)));
console.log('[mock-data] Initial mockTwoWheelerRequests:', JSON.parse(JSON.stringify(mockTwoWheelerRequests)));
console.log('[mock-data] Initial mockFourWheelerRequests:', JSON.parse(JSON.stringify(mockFourWheelerRequests)));
console.log('[mock-data] Initial mockSummaryData:', JSON.parse(JSON.stringify(mockSummaryData)));
