
import { z } from 'zod';

export interface UserProfile {
  id: string;
  uniqueId: string;
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

export const Locations = [
  // Tier 1 Cities
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad",
  // Tier 2 Cities
  "Jaipur", "Surat", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", 
  "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", 
  "Faridabad", "Meerut", "Rajkot", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", 
  "Amritsar", "Allahabad", "Ranchi", "Howrah", "Coimbatore", "Jabalpur", "Gwalior", 
  "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kota", "Guwahati", "Chandigarh"
];
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
  duration: string; 
  recordedLectureLink?: string; 
}

export interface Course {
  id: string;
  title: string;
  description: string;
  icon?: React.ElementType; 
  totalEnrolled: number;
  totalCertified: number;
  modules: CourseModule[];
  image?: string; 
}

// Registration Form Types
export const VehiclePreferenceOptions = ["Two-Wheeler", "Four-Wheeler", "Both"] as const;

export const RegistrationFormSchema = z.object({
  userRole: z.enum(['customer', 'trainer']),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(100),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }).max(15).optional().or(z.literal('')),
  location: z.string().min(1, { message: "Please select a location." }),
  subscriptionPlan: z.string().min(1, { message: "Please select a subscription plan." }),
  // Customer specific
  vehiclePreference: z.enum(VehiclePreferenceOptions).optional(),
  // Trainer specific
  yearsOfExperience: z.coerce.number().int().min(0, "Years of experience cannot be negative").max(50, "Years of experience seems too high").optional(),
  specialization: z.string().max(100, "Specialization too long").optional().or(z.literal('')),
}).refine(data => {
  if (data.userRole === 'customer' && !data.vehiclePreference) {
    return false;
  }
  return true;
}, {
  message: "Vehicle preference is required for customers.",
  path: ["vehiclePreference"], 
}).refine(data => {
    if (data.userRole === 'trainer' && (data.yearsOfExperience === undefined || data.yearsOfExperience === null)) {
        return false;
    }
    return true;
}, {
    message: "Years of experience is required for trainers.",
    path: ["yearsOfExperience"],
});


export type RegistrationFormValues = z.infer<typeof RegistrationFormSchema>;
