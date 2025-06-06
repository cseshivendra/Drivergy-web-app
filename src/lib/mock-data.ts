import type { UserProfile, LessonRequest, SummaryData, VehicleType } from '@/types';
import { addDays, format } from 'date-fns';

const generateRandomDate = (startOffsetDays: number, endOffsetDays: number): string => {
  const days = Math.floor(Math.random() * (endOffsetDays - startOffsetDays + 1)) + startOffsetDays;
  return format(addDays(new Date(), -days), 'MMM dd, yyyy HH:mm');
};

export const mockCustomers: UserProfile[] = [
  { id: 'c1', name: 'Alice Wonderland', contact: 'alice@example.com', location: 'New York', subscriptionPlan: 'Premium', registrationTimestamp: generateRandomDate(1, 30) },
  { id: 'c2', name: 'Bob The Builder', contact: 'bob@example.com', location: 'Los Angeles', subscriptionPlan: 'Basic', registrationTimestamp: generateRandomDate(5, 40) },
  { id: 'c3', name: 'Charlie Brown', contact: 'charlie@example.com', location: 'New York', subscriptionPlan: 'Gold', registrationTimestamp: generateRandomDate(10, 50) },
  { id: 'c4', name: 'Diana Prince', contact: 'diana@example.com', location: 'Chicago', subscriptionPlan: 'Premium', registrationTimestamp: generateRandomDate(2, 25) },
];

export const mockInstructors: UserProfile[] = [
  { id: 'i1', name: 'Indiana Jones', contact: 'indy@example.com', location: 'Chicago', subscriptionPlan: 'Gold', registrationTimestamp: generateRandomDate(3, 35) },
  { id: 'i2', name: 'James Bond', contact: '007@example.com', location: 'Los Angeles', subscriptionPlan: 'Premium', registrationTimestamp: generateRandomDate(7, 45) },
  { id: 'i3', name: 'Kara Danvers', contact: 'kara@example.com', location: 'New York', subscriptionPlan: 'Basic', registrationTimestamp: generateRandomDate(12, 55) },
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
};

// Placeholder API functions
const ARTIFICIAL_DELAY = 500;

export const fetchCustomers = async (location?: string, subscription?: string): Promise<UserProfile[]> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  console.log(`Fetching customers with location: ${location}, subscription: ${subscription}`);
  return mockCustomers.filter(c => 
    (!location || c.location === location) && 
    (!subscription || c.subscriptionPlan === subscription)
  );
};

export const fetchInstructors = async (location?: string, subscription?: string): Promise<UserProfile[]> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  console.log(`Fetching instructors with location: ${location}, subscription: ${subscription}`);
  return mockInstructors.filter(i => 
    (!location || i.location === location) &&
    (!subscription || i.subscriptionPlan === subscription)
  );
};

export const fetchRequests = async (vehicleType: VehicleType): Promise<LessonRequest[]> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  console.log(`Fetching requests for vehicle type: ${vehicleType}`);
  if (vehicleType === 'Two-Wheeler') return mockTwoWheelerRequests;
  if (vehicleType === 'Four-Wheeler') return mockFourWheelerRequests;
  return [];
};

export const fetchSummaryData = async (): Promise<SummaryData> => {
  await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY));
  return mockSummaryData;
};
