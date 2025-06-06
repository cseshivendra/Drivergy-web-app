
import { z } from 'zod';

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
  activeSubscriptions: number; 
  pendingRequests: number;
  totalEarnings: number;
  totalCertifiedTrainers: number; 
}

export type VehicleType = 'Two-Wheeler' | 'Four-Wheeler';

export const Locations = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Surat", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Allahabad", "Ranchi", "Howrah", "Coimbatore", "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kota", "Guwahati", "Chandigarh"];
export const SubscriptionPlans = ["Basic", "Premium", "Gold"];

// Schema for Contact Us / Complaint Form
export const ComplaintFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(100),
  email: z.string().email({ message: "Please enter a valid email address." }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters." }).max(150),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }).max(2000),
});

export type ComplaintFormValues = z.infer<typeof ComplaintFormSchema>;

// Course Management Types
export interface CourseModule {
  id: string;
  title: string;
  description: string;
  duration: string; // e.g., "45 mins"
  recordedLectureLink?: string; // URL or identifier
}

export interface Course {
  id: string;
  title: string;
  description: string;
  icon?: React.ElementType; // Optional Lucide icon for the course
  totalEnrolled: number;
  totalCertified: number;
  modules: CourseModule[];
  image?: string; // Optional image URL for the course card
}
