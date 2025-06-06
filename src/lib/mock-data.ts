
import type { UserProfile, LessonRequest, SummaryData, VehicleType, Course, CourseModule } from '@/types';
import { addDays, format } from 'date-fns';
import { Car, Bike, FileText } from 'lucide-react'; // For course icons

const generateRandomDate = (startOffsetDays: number, endOffsetDays: number): string => {
  const days = Math.floor(Math.random() * (endOffsetDays - startOffsetDays + 1)) + startOffsetDays;
  return format(addDays(new Date(), -days), 'MMM dd, yyyy HH:mm');
};

export const mockCustomers: UserProfile[] = [
  { id: 'c1', uniqueId: 'CU20251', name: 'Priya Sharma', contact: 'priya.sharma@example.com', location: 'Mumbai', subscriptionPlan: 'Premium', registrationTimestamp: generateRandomDate(1, 30) },
  { id: 'c2', uniqueId: 'CU20252', name: 'Rohan Patel', contact: 'rohan.patel@example.com', location: 'Delhi', subscriptionPlan: 'Basic', registrationTimestamp: generateRandomDate(5, 40) },
  { id: 'c3', uniqueId: 'CU20253', name: 'Aisha Khan', contact: 'aisha.khan@example.com', location: 'Bangalore', subscriptionPlan: 'Gold', registrationTimestamp: generateRandomDate(10, 50) },
  { id: 'c4', uniqueId: 'CU20254', name: 'Vikram Singh', contact: 'vikram.singh@example.com', location: 'Hyderabad', subscriptionPlan: 'Premium', registrationTimestamp: generateRandomDate(2, 25) },
  { id: 'c5', uniqueId: 'CU20255', name: 'Anjali Mehta', contact: 'anjali.mehta@example.com', location: 'Chennai', subscriptionPlan: 'Basic', registrationTimestamp: generateRandomDate(3, 20) },
  { id: 'c6', uniqueId: 'CU20256', name: 'Suresh Gupta', contact: 'suresh.gupta@example.com', location: 'Kolkata', subscriptionPlan: 'Gold', registrationTimestamp: generateRandomDate(8, 45) },
];

export const mockInstructors: UserProfile[] = [
  { id: 'i1', uniqueId: 'TR20251', name: 'Rajesh Kumar', contact: 'rajesh.kumar@example.com', location: 'Mumbai', subscriptionPlan: 'Gold', registrationTimestamp: generateRandomDate(3, 35) },
  { id: 'i2', uniqueId: 'TR20252', name: 'Sunita Reddy', contact: 'sunita.reddy@example.com', location: 'Delhi', subscriptionPlan: 'Premium', registrationTimestamp: generateRandomDate(7, 45) },
  { id: 'i3', uniqueId: 'TR20253', name: 'Amit Joshi', contact: 'amit.joshi@example.com', location: 'Bangalore', subscriptionPlan: 'Basic', registrationTimestamp: generateRandomDate(12, 55) },
  { id: 'i4', uniqueId: 'TR20254', name: 'Deepika Nair', contact: 'deepika.nair@example.com', location: 'Hyderabad', subscriptionPlan: 'Gold', registrationTimestamp: generateRandomDate(6, 30) },
];

export const mockTwoWheelerRequests: LessonRequest[] = [
  { id: 'r1', customerName: 'Priya Sharma', vehicleType: 'Two-Wheeler', status: 'Pending', requestTimestamp: generateRandomDate(0, 5) },
  { id: 'r2', customerName: 'Rohan Patel', vehicleType: 'Two-Wheeler', status: 'Active', requestTimestamp: generateRandomDate(1, 7) },
  { id: 'r6', customerName: 'Anjali Mehta', vehicleType: 'Two-Wheeler', status: 'Pending', requestTimestamp: generateRandomDate(0, 2) },
];

export const mockFourWheelerRequests: LessonRequest[] = [
  { id: 'r3', customerName: 'Aisha Khan', vehicleType: 'Four-Wheeler', status: 'Pending', requestTimestamp: generateRandomDate(0, 3) },
  { id: 'r4', customerName: 'Vikram Singh', vehicleType: 'Four-Wheeler', status: 'Completed', requestTimestamp: generateRandomDate(2, 10) },
  { id: 'r5', customerName: 'Priya Sharma', vehicleType: 'Four-Wheeler', status: 'Active', requestTimestamp: generateRandomDate(1, 4) },
  { id: 'r7', customerName: 'Suresh Gupta', vehicleType: 'Four-Wheeler', status: 'Completed', requestTimestamp: generateRandomDate(3, 12) },
];

export const mockSummaryData: SummaryData = {
  totalCustomers: 95, // Updated to reflect more customers
  totalInstructors: 18, // Updated to reflect more instructors
  activeSubscriptions: 78,
  pendingRequests: 18,
  totalEarnings: 15500,
  totalCertifiedTrainers: 12, // Assuming this is about customers getting certified in a course
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
  
  let results = mockCustomers;

  if (location && location.trim() !== '') {
    results = results.filter(c => c.location.toLowerCase().includes(location.toLowerCase().trim()));
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
  
  let results = mockInstructors;

  if (location && location.trim() !== '') {
    results = results.filter(i => i.location.toLowerCase().includes(location.toLowerCase().trim()));
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
  
  // This function's purpose to find and return the customer's actual name is less critical
  // now that we've directly assigned Indian names in mockRequests.
  // However, keeping it in case of future changes or if names were to be dynamically pulled.
  const findCustomerName = (nameInRequest: string): string => {
    const customer = mockCustomers.find(c => c.name === nameInRequest);
    return customer ? customer.name : nameInRequest; 
  };

  if (vehicleType === 'Two-Wheeler') {
    return mockTwoWheelerRequests.map(req => ({
      ...req,
      customerName: findCustomerName(req.customerName) // Ensures consistency if names change
    }));
  }
  if (vehicleType === 'Four-Wheeler') {
     return mockFourWheelerRequests.map(req => ({
      ...req,
      customerName: findCustomerName(req.customerName) // Ensures consistency
    }));
  }
  return [];
};

export const fetchSummaryData = async (): Promise<SummaryData> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  // Update summary data to be more consistent with increased mock users
  const updatedSummaryData: SummaryData = {
    totalCustomers: mockCustomers.length,
    totalInstructors: mockInstructors.length,
    activeSubscriptions: Math.floor((mockCustomers.length + mockInstructors.length) * 0.8), // approx 80% active
    pendingRequests: mockTwoWheelerRequests.filter(r => r.status === 'Pending').length + 
                     mockFourWheelerRequests.filter(r => r.status === 'Pending').length,
    totalEarnings: mockSummaryData.totalEarnings, // Keep original or recalculate based on subscriptions
    totalCertifiedTrainers: mockSummaryData.totalCertifiedTrainers, // This refers to customers certified in courses
  };
  return updatedSummaryData;
};

export const fetchCourses = async (): Promise<Course[]> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  return mockCourses;
};

