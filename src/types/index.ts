
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
  id:string;
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
export const SpecializationOptions = ["Two-Wheeler", "Car", "Three-Wheeler", "Defensive Driving"] as const;
export const TrainerVehicleTypeOptions = ["Scooter", "Motorcycle", "Car (Manual)", "Car (Automatic)", "Three-Wheeler"] as const;
export const FuelTypeOptions = ["Petrol", "Diesel", "Electric", "CNG", "LPG", "Hybrid"] as const;
export const GenderOptions = ["Male", "Female", "Other", "Prefer not to say"] as const;
export const DLStatusOptions = ["New Learner", "Already Have DL"] as const;

// Simplified base types for file inputs, environment-agnostic at definition time
const fileField = z.any(); // For fields that are mandatory files (actual check in superRefine)
const optionalFileField = z.any().optional(); // For fields that are optional files (actual check in superRefine)

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const ACCEPTED_FILE_TYPES_STRING = "PDF, JPG, PNG";


const BaseRegistrationSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(100),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }).max(15).optional().or(z.literal('')),
  location: z.string().min(1, { message: "Please select a location." }),
  gender: z.enum(GenderOptions, { required_error: "Please select a gender." }),
});

const CustomerRegistrationSchema = BaseRegistrationSchema.extend({
  userRole: z.literal('customer'),
  subscriptionPlan: z.string().min(1, { message: "Please select a subscription plan." }),
  vehiclePreference: z.enum(VehiclePreferenceOptions, { required_error: "Vehicle preference is required for customers." }),
  dlStatus: z.enum(DLStatusOptions, { required_error: "Please select your Driving License status."}),
  dlNumber: z.string().optional(),
  dlTypeHeld: z.string().optional(),
  dlFileCopy: optionalFileField,
}).refine(data => {
  if (data.dlStatus === "Already Have DL") {
    return !!data.dlNumber && data.dlNumber.trim() !== "";
  }
  return true;
}, {
  message: "DL Number is required if you have a DL.",
  path: ["dlNumber"],
}).refine(data => {
  if (data.dlStatus === "Already Have DL") {
    return !!data.dlTypeHeld && data.dlTypeHeld.trim() !== "";
  }
  return true;
}, {
  message: "Type of DL Held is required if you have a DL.",
  path: ["dlTypeHeld"],
}).refine(data => { // Conditional requirement for dlFileCopy
  if (data.dlStatus === "Already Have DL") {
    return data.dlFileCopy && typeof data.dlFileCopy.length === 'number' && data.dlFileCopy.length > 0 && data.dlFileCopy[0];
  }
  return true;
}, {
  message: "DL File Copy is required if you have a DL.",
  path: ["dlFileCopy"],
}).superRefine((data, ctx) => { // Detailed validation for dlFileCopy if present
  if (data.dlStatus === "Already Have DL" && data.dlFileCopy && typeof data.dlFileCopy.length === 'number' && data.dlFileCopy.length > 0 && data.dlFileCopy[0]) {
    const file = data.dlFileCopy[0];
    if (file.size > MAX_FILE_SIZE_BYTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `DL File size should be less than ${MAX_FILE_SIZE_MB}MB.`,
        path: ["dlFileCopy"],
      });
    }
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid DL File type. Only ${ACCEPTED_FILE_TYPES_STRING} are allowed.`,
        path: ["dlFileCopy"],
      });
    }
  }
});

const TrainerRegistrationSchema = BaseRegistrationSchema.extend({
  userRole: z.literal('trainer'),
  yearsOfExperience: z.coerce.number().int().min(0, "Years of experience cannot be negative.").max(50, "Years of experience seems too high."),
  specialization: z.enum(SpecializationOptions, { required_error: "Please select a specialization." }),
  trainerVehicleType: z.enum(TrainerVehicleTypeOptions, { required_error: "Please select vehicle type." }),
  fuelType: z.enum(FuelTypeOptions, { required_error: "Please select fuel type."}),
  vehicleNumber: z.string().min(1, { message: "Vehicle number is required." }).max(20, { message: "Vehicle number seems too long."}),
  trainerCertificateNumber: z.string().min(1, { message: "Trainer certificate number is required." }).max(50),
  trainerCertificateFile: fileField,
  aadhaarCardNumber: z.string()
    .min(12, { message: "Aadhaar number must be 12 digits." })
    .max(12, { message: "Aadhaar number must be 12 digits." })
    .regex(/^\d{12}$/, { message: "Invalid Aadhaar number format (must be 12 digits)." }),
  aadhaarCardFile: fileField,
  drivingLicenseNumber: z.string().min(1, { message: "Driving license number is required." }).max(50),
  drivingLicenseFile: fileField,
}).superRefine((data, ctx) => {
  const validateFileField = (fileData: any, fieldName: string, fieldLabel: string) => {
    if (!(fileData && typeof fileData.length === 'number' && fileData.length > 0 && fileData[0])) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${fieldLabel} is required.`,
        path: [fieldName],
      });
      return; // Stop further validation for this file if not present
    }
    const file = fileData[0];
    if (file.size > MAX_FILE_SIZE_BYTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${fieldLabel} size should be less than ${MAX_FILE_SIZE_MB}MB.`,
        path: [fieldName],
      });
    }
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid ${fieldLabel} type. Only ${ACCEPTED_FILE_TYPES_STRING} are allowed.`,
        path: [fieldName],
      });
    }
  };

  validateFileField(data.trainerCertificateFile, "trainerCertificateFile", "Trainer Certificate");
  validateFileField(data.aadhaarCardFile, "aadhaarCardFile", "Aadhaar Card");
  validateFileField(data.drivingLicenseFile, "drivingLicenseFile", "Driving License");
});


export const RegistrationFormSchema = z.discriminatedUnion("userRole", [
  CustomerRegistrationSchema,
  TrainerRegistrationSchema,
]);

export type RegistrationFormValues = z.infer<typeof RegistrationFormSchema>;
export type CustomerRegistrationFormValues = z.infer<typeof CustomerRegistrationSchema>;
export type TrainerRegistrationFormValues = z.infer<typeof TrainerRegistrationSchema>;

