
import { z } from 'zod';
import type React from 'react';

export const ApprovalStatusOptions = ["Pending", "Approved", "Rejected"] as const;
export type ApprovalStatusType = typeof ApprovalStatusOptions[number];

export const TrainerPreferenceOptions = ["Male", "Female", "Any"] as const;

export interface UserProfile {
  id: string;
  uniqueId: string;
  name: string;
  contact: string;
  location: string;
  subscriptionPlan: string;
  registrationTimestamp: string;
  vehicleInfo?: string;
  approvalStatus: ApprovalStatusType; // Added field
  // Customer specific details that might be useful on profile:
  dlStatus?: string;
  dlNumber?: string;
  photoIdType?: string;
  photoIdNumber?: string;
  trainerPreference?: typeof TrainerPreferenceOptions[number];
}

export const LessonRequestStatusOptions = ["Pending", "Active", "Completed"] as const;
export interface LessonRequest {
  id:string;
  customerName: string;
  vehicleType: 'Two-Wheeler' | 'Four-Wheeler';
  status: typeof LessonRequestStatusOptions[number];
  requestTimestamp: string;
}

export interface SummaryData {
  totalCustomers: number;
  totalInstructors: number;
  activeSubscriptions: number;
  pendingRequests: number;
  totalEarnings: number;
  totalCertifiedTrainers: number; // This might relate to 'Approved' trainers/customers
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
export const SubscriptionPlans = ["Basic", "Premium", "Gold"]; // "Trainer" is a role, not typically a plan customers choose.

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
export const SpecializationOptions = ["Two-Wheeler", "Car", "Three-Wheeler", "Defensive Driving"] as const;
export const TrainerVehicleTypeOptions = ["Scooter", "Motorcycle", "Car (Manual)", "Car (Automatic)", "Three-Wheeler"] as const;
export const FuelTypeOptions = ["Petrol", "Diesel", "Electric", "CNG", "LPG", "Hybrid"] as const;
export const GenderOptions = ["Male", "Female", "Other", "Prefer not to say"] as const;
export const DLStatusOptions = ["New Learner", "Already Have DL"] as const;
export const PhotoIdTypeOptions = ["Aadhaar Card", "PAN Card", "Voter ID", "Passport", "Driving License"] as const;

// Use z.any() for file fields to avoid server-side issues during initial schema parsing
const fileField = z.any(); 
const optionalFileField = z.any().optional();

const BaseRegistrationSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(100),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().optional(),
  location: z.string().min(1, { message: "Please select a location." }),
  gender: z.enum(GenderOptions, { required_error: "Please select a gender." }),
});

const CustomerRegistrationSchema = BaseRegistrationSchema.extend({
  userRole: z.literal('customer'),
  subscriptionPlan: z.enum(SubscriptionPlans, { required_error: "Please select a subscription plan." }),
  vehiclePreference: z.enum(VehiclePreferenceOptions, { required_error: "Vehicle preference is required for customers." }),
  trainerPreference: z.enum(TrainerPreferenceOptions, { required_error: "Please select your trainer preference."}),
  dlStatus: z.enum(DLStatusOptions, { required_error: "Please select your Driving License status."}),
  dlNumber: z.string().optional(),
  dlTypeHeld: z.string().optional(),
  dlFileCopy: optionalFileField,
  photoIdType: z.enum(PhotoIdTypeOptions, { required_error: "Please select a Photo ID type." }),
  photoIdNumber: z.string().min(1, { message: "Photo ID number is required." }),
  photoIdFile: fileField.refine(val => val && val.length > 0, "Photo ID document is required."),
});

const TrainerRegistrationSchema = BaseRegistrationSchema.extend({
  userRole: z.literal('trainer'),
  yearsOfExperience: z.coerce.number().int().min(0, "Years of experience cannot be negative.").max(50, "Years of experience seems too high.").optional(),
  specialization: z.enum(SpecializationOptions, { required_error: "Please select a specialization." }),
  trainerVehicleType: z.enum(TrainerVehicleTypeOptions, { required_error: "Please select vehicle type." }),
  fuelType: z.enum(FuelTypeOptions, { required_error: "Please select fuel type."}),
  vehicleNumber: z.string().min(1, { message: "Vehicle number is required." }).max(20, { message: "Vehicle number seems too long."}),
  trainerCertificateNumber: z.string().min(1, { message: "Trainer certificate number is required." }).max(50),
  trainerCertificateFile: fileField.refine(val => val && val.length > 0, "Trainer certificate is required."),
  aadhaarCardNumber: z.string()
    .min(12, { message: "Aadhaar number must be 12 digits." })
    .max(12, { message: "Aadhaar number must be 12 digits." })
    .regex(/^\d{12}$/, { message: "Invalid Aadhaar number format (must be 12 digits)." }),
  aadhaarCardFile: fileField.refine(val => val && val.length > 0, "Aadhaar card copy is required."),
  drivingLicenseNumber: z.string().min(1, { message: "Driving license number is required." }).max(50),
  drivingLicenseFile: fileField.refine(val => val && val.length > 0, "Driving license copy is required."),
});


export const RegistrationFormSchema = z.discriminatedUnion("userRole", [
 CustomerRegistrationSchema,
 TrainerRegistrationSchema,
]);

export type RegistrationFormValues = z.infer<typeof RegistrationFormSchema>;
export type CustomerRegistrationFormValues = z.infer<typeof CustomerRegistrationSchema>;
export type TrainerRegistrationFormValues = z.infer<typeof TrainerRegistrationSchema>;

