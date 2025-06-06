export interface UserProfile {
  id: string;
  name: string;
  contact: string;
  location: string;
  subscriptionPlan: string;
  registrationTimestamp: string;
}

export interface LessonRequest {
  id: string;
  customerName: string; 
  vehicleType: 'Two-Wheeler' | 'Four-Wheeler';
  status: 'Pending' | 'Active' | 'Completed';
  requestTimestamp: string;
}

export interface SummaryData {
  totalCustomers: number;
  totalInstructors: number;
  activeSubscriptions: number; // Simplified: total active, not by location initially
  pendingRequests: number;
}

export type VehicleType = 'Two-Wheeler' | 'Four-Wheeler';

export const Locations = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"];
export const SubscriptionPlans = ["Basic", "Premium", "Gold"];
