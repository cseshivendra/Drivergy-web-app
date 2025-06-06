
import type { UserProfile, LessonRequest, SummaryData, VehicleType, Course, CourseModule, CustomerRegistrationFormValues, TrainerRegistrationFormValues } from '@/types';
import { addDays, format } from 'date-fns';
import { Car, Bike, FileText } from 'lucide-react'; // For course icons
import { Locations } from '@/types'; // Import Locations for consistent use

const generateRandomDate = (startOffsetDays: number, endOffsetDays: number): string => {
  const days = Math.floor(Math.random() * (endOffsetDays - startOffsetDays + 1)) + startOffsetDays;
  return format(addDays(new Date(), -days), 'MMM dd, yyyy HH:mm');
};

const indianNames = [
  "Aarav Sharma", "Vivaan Singh", "Aditya Patel", "Vihaan Kumar", "Arjun Reddy", 
  "Sai Gupta", "Reyansh Mishra", "Krishna Yadav", "Ishaan Ali", "Ananya Roy",
  "Diya Verma", "Saanvi Pillai", "Aadhya Menon", "Myra Desai", "Pari Joshi",
  "Riya Agarwal", "Siya Das", "Advika Nair", "Ishita Iyer", "Prisha Srinivasan",
  "Rohan Mehra", "Aryan Shah", "Kabir Jain", "Dhruv Bhatnagar", "Shaurya Chauhan",
  "Deepak Kumar", "Prakash Singh", "Sachin Patel", "Kavita Sharma", "Neha Gupta",
  "Amit Trivedi", "Priya Kulkarni", "Rajesh Khanna", "Sunita Rao", "Vikram Rathore"
];

const getRandomLocation = () => Locations[Math.floor(Math.random() * Locations.length)];

export const mockCustomers: UserProfile[] = []; 

export const mockInstructors: UserProfile[] = []; 


export const mockTwoWheelerRequests: LessonRequest[] = []; 

export const mockFourWheelerRequests: LessonRequest[] = []; 


export const mockSummaryData: SummaryData = {
  totalCustomers: 0, 
  totalInstructors: 0,
  activeSubscriptions: 0, 
  pendingRequests: 0,
  totalEarnings: 0, 
  totalCertifiedTrainers: 0, 
};

const carDrivingModules: CourseModule[] = [
  { id: 'cdm1', title: 'Introduction to Car Controls', description: 'Understanding the steering wheel, pedals, and gears.', duration: '45 mins', recordedLectureLink: '#' },
  { id: 'cdm2', title: 'Basic Maneuvers: Starting and Stopping', description: 'Smoothly starting, stopping, and basic parking.', duration: '60 mins', recordedLectureLink: '#' },
  { id: 'cdm3', title: 'Navigating Traffic & Road Signs', description: 'Understanding road signs and safe navigation in light traffic.', duration: '75 mins', recordedLectureLink: '#' },
  { id: 'cdm4', title: 'Advanced Parking Techniques', description: 'Parallel parking, reverse parking, and bay parking.', duration: '60 mins', recordedLectureLink: '#' },
];

const twoWheelerModules: CourseModule[] = [
  { id: 'twm1', title: 'Understanding Your Two-Wheeler', description: 'Controls, balance, and safety gear.', duration: '40 mins', recordedLectureLink: '#' },
  { id: 'twm2', title: 'Basic Riding Skills', description: 'Starting, stopping, and slow-speed maneuvering.', duration: '50 mins', recordedLectureLink: '#' },
  { id: 'twm3', title: 'Road Awareness for Riders', description: 'Defensive riding and anticipating hazards.', duration: '60 mins', recordedLectureLink: '#' },
];

const rtoExamModules: CourseModule[] = [
  { id: 'rtom1', title: 'Understanding RTO Rules & Regulations', description: 'Key traffic laws and penalties.', duration: '60 mins', recordedLectureLink: '#' },
  { id: 'rtom2', title: 'Road Signs and Markings Mastery', description: 'Comprehensive guide to all road signs.', duration: '70 mins', recordedLectureLink: '#' },
  { id: 'rtom3', title: 'Mock RTO Test Practice', description: 'Simulated test environment with Q&A.', duration: '90 mins', recordedLectureLink: '#' },
];

export const mockCourses: Course[] = [
  { 
    id: 'course1', 
    title: 'Car Driving Mastery', 
    description: 'Comprehensive car driving lessons from basic controls to advanced road skills and safety.', 
    icon: Car,
    totalEnrolled: 125, 
    totalCertified: 88, 
    modules: carDrivingModules,
    image: 'https://placehold.co/600x400.png',
    
  },
  { 
    id: 'course2', 
    title: 'Two-Wheeler Pro Rider', 
    description: 'Learn to ride two-wheelers confidently, covering balance, traffic navigation, and safety.',
    icon: Bike,
    totalEnrolled: 92, 
    totalCertified: 65, 
    modules: twoWheelerModules,
    image: 'https://placehold.co/600x400.png',
    
  },
  { 
    id: 'course3', 
    title: 'RTO Exam Success Guide', 
    description: 'Ace your RTO driving test with our detailed course on rules, signs, and mock tests.',
    icon: FileText,
    totalEnrolled: 210, 
    totalCertified: 195, 
    modules: rtoExamModules,
    image: 'https://placehold.co/600x400.png',
    
  },
];


const ARTIFICIAL_DELAY = 300; 

export const addCustomer = (data: CustomerRegistrationFormValues): UserProfile => {
  console.log('[mock-data] addCustomer called with:', JSON.parse(JSON.stringify(data)));
  const newIdSuffix = mockCustomers.length + 1;
  const newUser: UserProfile = {
    id: `c${newIdSuffix}`,
    uniqueId: `CU${202500 + newIdSuffix}`,
    name: data.name,
    contact: data.email, 
    location: data.location,
    subscriptionPlan: data.subscriptionPlan,
    registrationTimestamp: format(new Date(), 'MMM dd, yyyy HH:mm'),
  };
  mockCustomers.push(newUser);
  console.log('[mock-data] Customer added. Current mockCustomers:', JSON.parse(JSON.stringify(mockCustomers)));
  mockSummaryData.totalCustomers = mockCustomers.length; 
  mockSummaryData.activeSubscriptions = Math.floor(mockCustomers.filter(c => c.subscriptionPlan !== 'N/A' && c.subscriptionPlan !== 'Trainer').length * 0.85 + mockInstructors.length * 0.1);
  return newUser;
};

export const addTrainer = (data: TrainerRegistrationFormValues): UserProfile => {
  console.log('[mock-data] addTrainer called with:', JSON.parse(JSON.stringify(data)));
  const newIdSuffix = mockInstructors.length + 1;
  const newTrainer: UserProfile = {
    id: `i${newIdSuffix}`,
    uniqueId: `TR${202500 + newIdSuffix}`,
    name: data.name,
    contact: data.email, 
    location: data.location,
    subscriptionPlan: "Trainer", 
    registrationTimestamp: format(new Date(), 'MMM dd, yyyy HH:mm'),
  };
  mockInstructors.push(newTrainer);
  console.log('[mock-data] Trainer added. Current mockInstructors:', JSON.parse(JSON.stringify(mockInstructors)));
  mockSummaryData.totalInstructors = mockInstructors.length; 
  return newTrainer;
};


export const fetchCustomers = async (location?: string, subscription?: string, searchTerm?: string): Promise<UserProfile[]> => {
  console.log(`[mock-data] fetchCustomers called with: location='${location}', subscription='${subscription}', searchTerm='${searchTerm}'`);
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  
  let results = mockCustomers;
  console.log('[mock-data] current mockCustomers before filter:', JSON.parse(JSON.stringify(results)));


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
  console.log('[mock-data] fetchCustomers results:', JSON.parse(JSON.stringify(results)));
  return results;
};

export const fetchInstructors = async (location?: string, subscription?: string, searchTerm?: string): Promise<UserProfile[]> => {
  console.log(`[mock-data] fetchInstructors called with: location='${location}', subscription='${subscription}', searchTerm='${searchTerm}'`);
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  
  let results = mockInstructors;
  console.log('[mock-data] current mockInstructors before filter:', JSON.parse(JSON.stringify(results)));

  if (location && location.trim() !== '' && location !== 'all') {
    results = results.filter(i => i.location.toLowerCase() === location.toLowerCase().trim());
  }
  if (subscription && subscription !== 'all') { 
    results = results.filter(i => i.subscriptionPlan === subscription);
  }

  if (searchTerm && searchTerm.trim() !== '') {
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    results = results.filter(i =>
      i.uniqueId.toLowerCase().includes(lowerSearchTerm) ||
      i.name.toLowerCase().includes(lowerSearchTerm) ||
      i.contact.toLowerCase().includes(lowerSearchTerm)
    );
  }
  console.log('[mock-data] fetchInstructors results:', JSON.parse(JSON.stringify(results)));
  return results;
};

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

export const fetchSummaryData = async (): Promise<SummaryData> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  
  const currentPendingRequests = mockTwoWheelerRequests.filter(r => r.status === 'Pending').length + 
                                 mockFourWheelerRequests.filter(r => r.status === 'Pending').length;
  const currentActiveSubscriptions = mockCustomers.filter(c => c.subscriptionPlan !== 'N/A' && c.subscriptionPlan !== 'Trainer').length * 0.85 + mockInstructors.length * 0.1;


  const updatedSummaryData: SummaryData = {
    ...mockSummaryData, 
    totalCustomers: mockCustomers.length,
    totalInstructors: mockInstructors.length,
    activeSubscriptions: Math.floor(currentActiveSubscriptions), 
    pendingRequests: currentPendingRequests,
  };
  
  Object.assign(mockSummaryData, updatedSummaryData);
  console.log('[mock-data] fetchSummaryData returning:', JSON.parse(JSON.stringify(updatedSummaryData)));
  return updatedSummaryData;
};

export const fetchCourses = async (): Promise<Course[]> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  return mockCourses;
};


mockSummaryData.totalCustomers = mockCustomers.length;
mockSummaryData.totalInstructors = mockInstructors.length;
mockSummaryData.activeSubscriptions = 0;
mockSummaryData.pendingRequests = 0;
mockSummaryData.totalCertifiedTrainers = 0;

console.log('[mock-data] Initial mockCustomers:', JSON.parse(JSON.stringify(mockCustomers)));
console.log('[mock-data] Initial mockInstructors:', JSON.parse(JSON.stringify(mockInstructors)));
console.log('[mock-data] Initial mockSummaryData:', JSON.parse(JSON.stringify(mockSummaryData)));

