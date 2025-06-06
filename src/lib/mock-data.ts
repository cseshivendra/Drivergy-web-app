
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

export const mockCustomers: UserProfile[] = indianNames.slice(0, 15).map((name, index) => ({
  id: `c${index + 1}`,
  uniqueId: `CU2025${100 + index + 1}`,
  name: name,
  contact: `${name.split(' ')[0].toLowerCase()}.${name.split(' ').pop()?.toLowerCase()}@example.com`,
  location: getRandomLocation(),
  subscriptionPlan: ['Premium', 'Basic', 'Gold'][index % 3],
  registrationTimestamp: generateRandomDate(1, 50)
}));

export const mockInstructors: UserProfile[] = indianNames.slice(15, 30).map((name, index) => ({
  id: `i${index + 1}`,
  uniqueId: `TR2025${100 + index + 1}`,
  name: name,
  contact: `${name.split(' ')[0].toLowerCase()}.${name.split(' ').pop()?.toLowerCase()}@example.com`,
  location: getRandomLocation(),
  subscriptionPlan: ['Gold', 'Premium', 'Basic'][index % 3], // This will be overridden for new trainers to "Trainer"
  registrationTimestamp: generateRandomDate(3, 60)
}));


export const mockTwoWheelerRequests: LessonRequest[] = [
  { id: 'r1', customerName: mockCustomers[0]?.name || "Customer 1", vehicleType: 'Two-Wheeler', status: 'Pending', requestTimestamp: generateRandomDate(0, 5) },
  { id: 'r2', customerName: mockCustomers[1]?.name || "Customer 2", vehicleType: 'Two-Wheeler', status: 'Active', requestTimestamp: generateRandomDate(1, 7) },
  { id: 'r6', customerName: mockCustomers[4]?.name || "Customer 5", vehicleType: 'Two-Wheeler', status: 'Pending', requestTimestamp: generateRandomDate(0, 2) },
  { id: 'r8', customerName: mockCustomers[6]?.name || "Customer 7", vehicleType: 'Two-Wheeler', status: 'Completed', requestTimestamp: generateRandomDate(3, 15) },
];

export const mockFourWheelerRequests: LessonRequest[] = [
  { id: 'r3', customerName: mockCustomers[2]?.name || "Customer 3", vehicleType: 'Four-Wheeler', status: 'Pending', requestTimestamp: generateRandomDate(0, 3) },
  { id: 'r4', customerName: mockCustomers[3]?.name || "Customer 4", vehicleType: 'Four-Wheeler', status: 'Completed', requestTimestamp: generateRandomDate(2, 10) },
  { id: 'r5', customerName: mockCustomers[0]?.name || "Customer 1", vehicleType: 'Four-Wheeler', status: 'Active', requestTimestamp: generateRandomDate(1, 4) },
  { id: 'r7', customerName: mockCustomers[5]?.name || "Customer 6", vehicleType: 'Four-Wheeler', status: 'Completed', requestTimestamp: generateRandomDate(3, 12) },
  { id: 'r9', customerName: mockCustomers[7]?.name || "Customer 8", vehicleType: 'Four-Wheeler', status: 'Pending', requestTimestamp: generateRandomDate(0, 1) },
];


export const mockSummaryData: SummaryData = {
  totalCustomers: mockCustomers.length, 
  totalInstructors: mockInstructors.length,
  activeSubscriptions: Math.floor((mockCustomers.length + mockInstructors.length) * 0.75), 
  pendingRequests: mockTwoWheelerRequests.filter(r => r.status === 'Pending').length + mockFourWheelerRequests.filter(r => r.status === 'Pending').length,
  totalEarnings: 155000, 
  totalCertifiedTrainers: Math.floor(mockCustomers.length * 0.3), 
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
  const newIdSuffix = mockCustomers.length + 1;
  const newUser: UserProfile = {
    id: `c${newIdSuffix}`,
    uniqueId: `CU${202500 + newIdSuffix}`,
    name: data.name,
    contact: data.email, // Assuming email is the primary contact for UserProfile
    location: data.location,
    subscriptionPlan: data.subscriptionPlan,
    registrationTimestamp: format(new Date(), 'MMM dd, yyyy HH:mm'),
  };
  mockCustomers.push(newUser);
  mockSummaryData.totalCustomers += 1;
  // Potentially update activeSubscriptions if new customer implies an active one
  // For simplicity, we might re-calculate activeSubscriptions in fetchSummaryData or increment it here
  mockSummaryData.activeSubscriptions +=1; 
  return newUser;
};

export const addTrainer = (data: TrainerRegistrationFormValues): UserProfile => {
  const newIdSuffix = mockInstructors.length + 1;
  const newTrainer: UserProfile = {
    id: `i${newIdSuffix}`,
    uniqueId: `TR${202500 + newIdSuffix}`,
    name: data.name,
    contact: data.email, // Assuming email is the primary contact
    location: data.location,
    subscriptionPlan: "Trainer", // Trainers don't have customer subscription plans
    registrationTimestamp: format(new Date(), 'MMM dd, yyyy HH:mm'),
  };
  mockInstructors.push(newTrainer);
  mockSummaryData.totalInstructors += 1;
  return newTrainer;
};


export const fetchCustomers = async (location?: string, subscription?: string, searchTerm?: string): Promise<UserProfile[]> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  
  let results = mockCustomers;

  if (location && location.trim() !== '') {
    results = results.filter(c => c.location.toLowerCase() === location.toLowerCase().trim());
  }
  if (subscription) {
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
  return results;
};

export const fetchInstructors = async (location?: string, subscription?: string, searchTerm?: string): Promise<UserProfile[]> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  
  let results = mockInstructors;

  if (location && location.trim() !== '') {
    results = results.filter(i => i.location.toLowerCase() === location.toLowerCase().trim());
  }
  if (subscription) {
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
  return results;
};

export const fetchRequests = async (vehicleType: VehicleType): Promise<LessonRequest[]> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  
  if (vehicleType === 'Two-Wheeler') {
    return mockTwoWheelerRequests;
  }
  if (vehicleType === 'Four-Wheeler') {
     return mockFourWheelerRequests;
  }
  return [];
};

export const fetchSummaryData = async (): Promise<SummaryData> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  // Ensure summary data reflects current state of mock arrays
  const currentPendingRequests = mockTwoWheelerRequests.filter(r => r.status === 'Pending').length + 
                                 mockFourWheelerRequests.filter(r => r.status === 'Pending').length;
  const currentActiveSubscriptions = mockCustomers.filter(c => c.subscriptionPlan !== 'N/A' && c.subscriptionPlan !== 'Trainer').length * 0.85 + mockInstructors.length * 0.1;


  const updatedSummaryData: SummaryData = {
    ...mockSummaryData, // Preserve existing values like totalEarnings
    totalCustomers: mockCustomers.length,
    totalInstructors: mockInstructors.length,
    activeSubscriptions: Math.floor(currentActiveSubscriptions), // Recalculate or use the stored value
    pendingRequests: currentPendingRequests,
  };
  return updatedSummaryData;
};

export const fetchCourses = async (): Promise<Course[]> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  return mockCourses;
};
