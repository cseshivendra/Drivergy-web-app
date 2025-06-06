
import type { UserProfile, LessonRequest, SummaryData, VehicleType, Course, CourseModule } from '@/types';
import { addDays, format } from 'date-fns';
import { Car, Bike, FileText } from 'lucide-react'; // For course icons

const generateRandomDate = (startOffsetDays: number, endOffsetDays: number): string => {
  const days = Math.floor(Math.random() * (endOffsetDays - startOffsetDays + 1)) + startOffsetDays;
  return format(addDays(new Date(), -days), 'MMM dd, yyyy HH:mm');
};

export const mockCustomers: UserProfile[] = [
  { id: 'c1', uniqueId: 'CU20251', name: 'Alice Wonderland', contact: 'alice@example.com', location: 'New York', subscriptionPlan: 'Premium', registrationTimestamp: generateRandomDate(1, 30) },
  { id: 'c2', uniqueId: 'CU20252', name: 'Bob The Builder', contact: 'bob@example.com', location: 'Los Angeles', subscriptionPlan: 'Basic', registrationTimestamp: generateRandomDate(5, 40) },
  { id: 'c3', uniqueId: 'CU20253', name: 'Charlie Brown', contact: 'charlie@example.com', location: 'New York', subscriptionPlan: 'Gold', registrationTimestamp: generateRandomDate(10, 50) },
  { id: 'c4', uniqueId: 'CU20254', name: 'Diana Prince', contact: 'diana@example.com', location: 'Chicago', subscriptionPlan: 'Premium', registrationTimestamp: generateRandomDate(2, 25) },
];

export const mockInstructors: UserProfile[] = [
  { id: 'i1', uniqueId: 'TR20251', name: 'Indiana Jones', contact: 'indy@example.com', location: 'Chicago', subscriptionPlan: 'Gold', registrationTimestamp: generateRandomDate(3, 35) },
  { id: 'i2', uniqueId: 'TR20252', name: 'James Bond', contact: '007@example.com', location: 'Los Angeles', subscriptionPlan: 'Premium', registrationTimestamp: generateRandomDate(7, 45) },
  { id: 'i3', uniqueId: 'TR20253', name: 'Kara Danvers', contact: 'kara@example.com', location: 'New York', subscriptionPlan: 'Basic', registrationTimestamp: generateRandomDate(12, 55) },
];

export const mockTwoWheelerRequests: LessonRequest[] = [
  { id: 'r1', customerName: 'Alice Wonderland', vehicleType: 'Two-Wheeler', status: 'Pending', requestTimestamp: generateRandomDate(0, 5) },
  { id: 'r2', customerName: 'Bob The Builder', vehicleType: 'Two-Wheeler', status: 'Active', requestTimestamp: generateRandomDate(1, 7) },
];

export const mockFourWheelerRequests: LessonRequest[] = [
  { id: 'r3', customerName: 'Charlie Brown', vehicleType: 'Four-Wheeler', status: 'Pending', requestTimestamp: generateRandomDate(0, 3) },
  { id: 'r4', customerName: 'Diana Prince', vehicleType: 'Four-Wheeler', status: 'Completed', requestTimestamp: generateRandomDate(2, 10) },
  { id: 'r5', customerName: 'Alice Wonderland', vehicleType: 'Four-Wheeler', status: 'Active', requestTimestamp: generateRandomDate(1, 4) },
];

export const mockSummaryData: SummaryData = {
  totalCustomers: 78,
  totalInstructors: 12,
  activeSubscriptions: 65,
  pendingRequests: 15,
  totalEarnings: 12500,
  totalCertifiedTrainers: 9,
};

// Mock Course Data
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


// Placeholder API functions
const ARTIFICIAL_DELAY = 300; // Reduced delay for quicker feedback

export const fetchCustomers = async (location?: string, subscription?: string, searchTerm?: string): Promise<UserProfile[]> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  // console.log(`Fetching customers with location: ${location}, subscription: ${subscription}, searchTerm: ${searchTerm}`);
  
  let results = mockCustomers;

  if (location) {
    // Location filter from FilterControls should be exact match for the selected city
    results = results.filter(c => c.location.toLowerCase() === location.toLowerCase());
  }
  if (subscription) {
    results = results.filter(c => c.subscriptionPlan === subscription);
  }
  
  if (searchTerm && searchTerm.trim() !== '') {
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    results = results.filter(c =>
      c.uniqueId.toLowerCase().includes(lowerSearchTerm) ||
      c.name.toLowerCase().includes(lowerSearchTerm) ||
      c.contact.toLowerCase().includes(lowerSearchTerm) // contact is email
    );
  }
  return results;
};

export const fetchInstructors = async (location?: string, subscription?: string, searchTerm?: string): Promise<UserProfile[]> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  // console.log(`Fetching instructors with location: ${location}, subscription: ${subscription}, searchTerm: ${searchTerm}`);
  
  let results = mockInstructors;

  if (location) {
    results = results.filter(i => i.location.toLowerCase() === location.toLowerCase());
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
  // console.log(`Fetching requests for vehicle type: ${vehicleType}`);
  
  const findCustomerName = (nameInRequest: string): string => {
    const customer = mockCustomers.find(c => c.name === nameInRequest); // Match by simple name
    return customer ? customer.name : nameInRequest; 
  };

  if (vehicleType === 'Two-Wheeler') {
    return mockTwoWheelerRequests.map(req => ({
      ...req,
      customerName: findCustomerName(req.customerName)
    }));
  }
  if (vehicleType === 'Four-Wheeler') {
     return mockFourWheelerRequests.map(req => ({
      ...req,
      customerName: findCustomerName(req.customerName)
    }));
  }
  return [];
};

export const fetchSummaryData = async (): Promise<SummaryData> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  return mockSummaryData;
};

export const fetchCourses = async (): Promise<Course[]> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  return mockCourses;
};
