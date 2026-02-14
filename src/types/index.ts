
import { z } from 'zod';
import type { LucideIcon } from 'lucide-react';

// =================================================================
// CONSTANTS & ENUMS
// =================================================================

export const Locations = ['New Delhi', 'Gurugram', 'Noida', 'Faridabad', 'Ghaziabad', 'Bangalore', 'Mumbai'] as const;
export const SubscriptionPlans = ['Basic', 'Gold', 'Premium', 'Custom Module'] as const;
export const VehiclePreferenceOptions = ['Two-Wheeler', 'Four-Wheeler', 'Both'] as const;
export const SpecializationOptions = ['Car', 'Motorcycle', 'Commercial'] as const;
export const TrainerVehicleTypeOptions = ['Car (Manual)', 'Car (Automatic)', 'Motorcycle', 'Scooter'] as const;
export const FuelTypeOptions = ['Petrol', 'Diesel', 'CNG', 'Electric'] as const;
export const GenderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'] as const;
export const DLStatusOptions = ['New Learner', 'Already Have DL'] as const;
export const PhotoIdTypeOptions = ['Aadhaar Card', 'PAN Card', 'Passport', 'Voter ID'] as const;
export const TrainerPreferenceOptions = ['Male', 'Female', 'Any'] as const;
export const ApprovalStatusOptions = ['Pending', 'Approved', 'Rejected', 'In Progress', 'On Hold'] as const;
export const LessonRequestStatusOptions = ['Pending', 'Active', 'Completed'] as const;
export const PayoutStatusOptions = ['Pending', 'Paid', 'Withdraw to UPI'] as const;
export const RescheduleRequestStatusOptions = ['Pending', 'Approved', 'Rejected'] as const;
export const SkillStatusOptions = ['Not Started', 'Needs Practice', 'Proficient'] as const;
export const WithdrawalStatusOptions = ['Pending', 'Approved', 'Rejected', 'Completed'] as const;
export const SessionStatusOptions = ['Scheduled', 'Active', 'Completed', 'Cancelled', 'Abnormal End'] as const;
export const ComplaintStatusOptions = ['Pending', 'Resolved', 'Rejected'] as const;

export const IndianStates = ["Uttar Pradesh"] as const;

export const DistrictsByState = {
  "Uttar Pradesh": ["Prayagraj", "Kanpur", "Lucknow", "Varanasi"],
} as const;

// Wallet Config
export const WalletRedemptionConfig = {
    1: 0.50, // 50%
    2: 0.25, // 25%
    3: 0.10, // 10%
    default: 0,
} as const;

// =================================================================
// ZOD SCHEMAS & TYPES
// =================================================================

// Session Management
export const SessionStatusSchema = z.enum(SessionStatusOptions);
export type SessionStatus = z.infer<typeof SessionStatusSchema>;

export const DrivingSessionSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  trainerId: z.string(),
  trainerName: z.string(),
  status: SessionStatusSchema,
  scheduledDate: z.string(),
  startOtp: z.string().length(4),
  endOtp: z.string().length(4),
  startOtpExpiry: z.string(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  duration: z.number().optional(), // In minutes
  notes: z.string().optional(),
  createdAt: z.string(),
});
export type DrivingSession = z.infer<typeof DrivingSessionSchema>;

// Student Progress Tracking
export const SkillStatusSchema = z.enum(SkillStatusOptions);
export type SkillStatus = z.infer<typeof SkillStatusSchema>;

export const SkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: SkillStatusSchema,
});
export type Skill = z.infer<typeof SkillSchema>;

// Core User Profile
export const UserProfileSchema = z.object({
  id: z.string(),
  uniqueId: z.string(),
  name: z.string(),
  username: z.string().optional(),
  isAdmin: z.boolean().optional(),
  contact: z.string().email(),
  phone: z.string().optional(),
  location: z.string().optional(),
  subscriptionPlan: z.string(),
  registrationTimestamp: z.string(), // Stored as ISO string
  approvalStatus: z.string(),
  vehicleInfo: z.string().optional(),
  myReferralCode: z.string().optional(),
  photoURL: z.string().url().optional(),
  gender: z.string(),
  userRole: z.enum(['customer', 'trainer', 'admin']).optional(),
  purchaseCount: z.number().optional(), // Track for tiered wallet
  
  // Customer specific
  flatHouseNumber: z.string().optional(),
  street: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  dlStatus: z.string().optional(),
  dlNumber: z.string().optional(),
  dlTypeHeld: z.string().optional(),
  photoIdType: z.string().optional(),
  photoIdNumber: z.string().optional(),
  photoIdUrl: z.string().optional(),
  trainerPreference: z.string().optional(),
  vehiclePreference: z.string().optional(),
  assignedTrainerId: z.string().optional(),
  assignedTrainerName: z.string().optional(),
  assignedTrainerPhone: z.string().optional(),
  assignedTrainerVehicleDetails: z.string().optional(),
  upcomingLesson: z.string().optional(),
  subscriptionStartDate: z.string().optional(),
  totalLessons: z.number().optional(),
  completedLessons: z.number().optional(),
  attendance: z.string().optional(), // 'Present', 'Absent', 'Pending'
  feedbackSubmitted: z.boolean().optional(),
  totalReferralPoints: z.number().optional(),
  referralCode: z.string().optional(),
  skills: z.array(SkillSchema).optional(),
  lessonNotes: z.string().optional(),

  // Trainer specific
  specialization: z.string().optional(),
  drivingLicenseUrl: z.string().optional(),
  drivingLicenseNumber: z.string().optional(),
  expertise: z.string().optional(),
  yearsOfExperience: z.number().optional(),
  drivingSchoolName: z.string().optional(),
  ownerName: z.string().optional(),
  drivingSchoolCertificateNumber: z.string().optional(),
  upiId: z.string().optional(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type ApprovalStatusType = (typeof ApprovalStatusOptions)[number];


// Registration Forms
const requiredFileSchema = z
  .instanceof(File, { message: "File is required." })
  .refine((file) => file.size > 0, "File cannot be empty.")
  .refine((file) => file.size <= 5 * 1024 * 1024, `Max file size is 5MB.`);

const optionalFileSchema = z
  .any()
  .refine((file) => file === undefined || (file instanceof File && file.size <= 5 * 1024 * 1024), `Max file size is 5MB.`)
  .optional();


const passwordSchema = z.string()
  .min(8, { message: "Password must be at least 8 characters long." })
  .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
  .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
  .regex(/[0-9]/, { message: "Password must contain at least one number." })
  .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character." });

const baseRegistrationSchema = z.object({
  userRole: z.enum(['customer', 'trainer']),
  password: passwordSchema,
  confirmPassword: z.string(),
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  username: z.string().min(3, 'Username must be at least 3 characters.'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits.').max(13, 'Phone number is too long.'),
  gender: z.enum(GenderOptions, { required_error: "Gender is required." }),
});

export const CustomerRegistrationFormSchema = baseRegistrationSchema.extend({
  userRole: z.literal('customer'),
});
export type CustomerRegistrationFormValues = z.infer<typeof CustomerRegistrationFormSchema>;

export const TrainerRegistrationFormSchema = baseRegistrationSchema.extend({
    userRole: z.literal('trainer'),
    state: z.string().min(1, 'State is required.'),
    district: z.string().min(1, 'District is required.'),
    specialization: z.enum(SpecializationOptions, { required_error: "Specialization is required." }),
    trainerVehicleType: z.enum(TrainerVehicleTypeOptions, { required_error: "Vehicle type is required." }),
    fuelType: z.enum(FuelTypeOptions, { required_error: "Fuel type is required." }),
    vehicleNumber: z.string().min(1, 'Vehicle number is required.'),
    drivingLicenseNumber: z.string().min(1, 'License number is required.'),
    yearsOfExperience: z.coerce.number().min(1, 'Experience is required.'),
    drivingSchoolName: z.string().optional(),
    ownerName: z.string().optional(),
    drivingSchoolCertificateNumber: z.string().optional(),
});
export type TrainerRegistrationFormValues = z.infer<typeof TrainerRegistrationFormSchema>;


export const RegistrationFormSchema = z.discriminatedUnion('userRole', [
  CustomerRegistrationFormSchema,
  TrainerRegistrationFormSchema
]).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type RegistrationFormValues = z.infer<typeof RegistrationFormSchema>;


// This schema is for the second step of customer registration (during payment)
export const FullCustomerDetailsSchema = z.object({
    userId: z.string(), // Added userId to the schema
    subscriptionPlan: z.enum(SubscriptionPlans),
    vehiclePreference: z.enum(VehiclePreferenceOptions),
    trainerPreference: z.enum(TrainerPreferenceOptions),
    flatHouseNumber: z.string().min(1, 'This field is required.'),
    street: z.string().min(1, 'This field is required.'),
    district: z.string().min(1, 'District is required.'),
    state: z.string().min(1, 'State is required.'),
    pincode: z.string().length(6, 'Pincode must be 6 digits.'),
    dlStatus: z.enum(DLStatusOptions),
    dlNumber: z.string().optional(),
    dlTypeHeld: z.string().optional(),
    photoIdType: z.enum(PhotoIdTypeOptions),
    photoIdNumber: z.string().min(1, 'ID number is required.'),
    photoIdFile: requiredFileSchema,
    subscriptionStartDate: z.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
    }, z.date({required_error: "Please select a start date."})),
    referralCode: z.string().optional(),
}).refine((data) => {
    if (data.dlStatus === 'Already Have DL') {
        return !!data.dlNumber && !!data.dlTypeHeld;
    }
    return true;
}, {
    message: "DL Number and Type are required if you already have a license.",
    path: ['dlNumber'],
});
export type FullCustomerDetailsValues = z.infer<typeof FullCustomerDetailsSchema>;


// Profile Update Forms
export const UserProfileUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email(),
  phone: z.string(),
  location: z.string(),
  photo: optionalFileSchema,
  flatHouseNumber: z.string().optional(),
  street: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  pincode: z.string().optional(),
  upiId: z.string().optional(),
});
export type UserProfileUpdateValues = z.infer<typeof UserProfileUpdateSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: passwordSchema,
  confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "New passwords do not match.",
  path: ['confirmNewPassword'],
});
export type ChangePasswordValues = z.infer<typeof ChangePasswordSchema>;

// Other Schemas
export const ComplaintFormSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().optional(),
  subject: z.string().min(1, 'Subject is required.'),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
});
export type ComplaintFormValues = z.infer<typeof ComplaintFormSchema>;

export const CareerFormSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email(),
  phone: z.string().min(10, 'Please provide a valid phone number.'),
  position: z.string().min(1, 'Please select a position.'),
  resume: z.any().refine(files => files?.length === 1, "Resume is required."),
  coverLetter: z.string().optional(),
});
export type CareerFormValues = z.infer<typeof CareerFormSchema>;

export const FeedbackFormSchema = z.object({
  rating: z.number().min(1, "Please provide a rating.").max(5),
  comment: z.string().min(10, "Comment must be at least 10 characters.").max(500, "Comment is too long."),
});
export type FeedbackFormValues = z.infer<typeof FeedbackFormSchema>;

// AI Flow Schemas & Types
export const DrivingAnalysisInputSchema = z.object({
  sessionDescription: z.string().min(20, {
    message: "Please describe your session in at least 20 characters.",
  }),
});
export type DrivingAnalysisInput = z.infer<typeof DrivingAnalysisInputSchema>;

export const DrivingAnalysisOutputSchema = z.object({
  positiveReinforcement: z.string().describe("Positive and encouraging feedback based on the user's description."),
  constructiveTips: z.string().describe("Actionable tips and advice for areas where the user struggled or can improve."),
  safetyReminder: z.string().describe("A relevant, general road safety tip related to the context of the driving session."),
});
export type DrivingAnalysisOutput = z.infer<typeof DrivingAnalysisOutputSchema>;

export const CourseModuleSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().min(1, "Description is required."),
  duration: z.string().min(1, "Duration is required."),
  recordedLectureLink: z.string().url().optional().or(z.literal('')),
  videoFile: optionalFileSchema,
});
export type CourseModuleFormValues = z.infer<typeof CourseModuleSchema>;

export const QuizQuestionSchema = z.object({
  question_en: z.string().min(1, "English question is required."),
  question_hi: z.string().min(1, "Hindi question is required."),
  options_en: z.string().min(1, "English options are required."),
  options_hi: z.string().min(1, "Hindi options are required."),
  correctAnswer_en: z.string().min(1, "English correct answer is required."),
  correctAnswer_hi: z.string().min(1, "Hindi correct answer is required."),
});
export type QuizQuestionFormValues = z.infer<typeof QuizQuestionSchema>;

export const FaqSchema = z.object({
  question: z.string().min(1, "Question is required."),
  answer: z.string().min(1, "Answer is required."),
});
export type FaqFormValues = z.infer<typeof FaqSchema>;

export const BlogPostSchema = z.object({
  slug: z.string().min(1, "Slug is required.").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
  title: z.string().min(1, "Title is required."),
  category: z.string().min(1, "Category is required."),
  excerpt: z.string().min(1, "Excerpt is required."),
  content: z.string().min(1, "Content is required."),
  author: z.string().min(1, "Author is required."),
  date: z.string(),
  imageSrc: z.string().optional(),
  imageFile: optionalFileSchema,
  imageHint: z.string().optional(),
  tags: z.string().optional(),
});
export type BlogPostFormValues = z.infer<typeof BlogPostSchema>;

export const VisualContentSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().min(1, "Description is required."),
  imageSrc: z.string(),
  imageFile: optionalFileSchema,
  imageHint: z.string().optional(),
  href: z.string().optional(),
});
export type VisualContentFormValues = z.infer<typeof VisualContentSchema>;

export const StoreProductSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().min(1, "Description is required."),
  amazonId: z.string().min(1, "Amazon ID (ASIN) is required."),
  flipkartId: z.string().optional().or(z.literal('')),
  imageSrc: z.string().url("Valid image URL is required.").or(z.literal('')),
  imageHint: z.string().optional(),
});
export type StoreProductFormValues = z.infer<typeof StoreProductSchema>;


// Data structure types
export type VehicleType = 'Two-Wheeler' | 'Four-Wheeler' | 'Both';

export interface LessonRequest {
  id: string;
  customerId: string;
  customerName: string;
  vehicleType: VehicleType;
  status: 'Pending' | 'Active' | 'Completed';
  requestTimestamp: string;
}

export interface SummaryData {
  totalCustomers: number;
  totalInstructors: number;
  activeSubscriptions: number;
  pendingRequests: number;
  pendingRescheduleRequests: number;
  totalCertifiedTrainers: number;
  totalEarnings: number;
  pendingComplaints: number;
}

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
  totalEnrolled: number;
  totalCertified: number;
  image: string;
  modules: CourseModule[];
}

export interface RescheduleRequest {
    id: string;
    userId: string;
    customerName: string;
    trainerId: string;
    originalLessonDate: string;
    requestedRescheduleDate: string;
    status: RescheduleRequestStatusType;
    requestTimestamp: string;
}
export type RescheduleRequestStatusType = (typeof RescheduleRequestStatusOptions)[number];


export interface TrainerSummaryData {
  totalStudents: number;
  totalEarnings: number;
  upcomingLessons: number;
  rating: number;
  pendingRescheduleRequests: number;
}

export interface Feedback {
  id: string;
  customerId: string;
  customerName: string;
  trainerId: string;
  trainerName: string;
  rating: number;
  comment: string;
  submissionDate: string;
}

export interface LessonProgressData {
    studentId: string;
    studentName: string;
    trainerName: string;
    subscriptionPlan: string;
    totalLessons: number;
    completedLessons: number;
    remainingLessons: number;
}

export interface Referral {
    id: string;
    referrerId: string;
    referrerName: string;
    refereeId: string;
    refereeName: string;
    status: 'Successful' | 'Pending';
    pointsEarned: number;
    payoutStatus: PayoutStatusType;
    timestamp: string;
    // These are joined in from the User table for display
    refereeUniqueId?: string;
    refereeSubscriptionPlan?: string;
    refereeApprovalStatus?: ApprovalStatusType;
}
export type PayoutStatusType = (typeof PayoutStatusOptions)[number];

export interface Question {
  id: string;
  question: { en: string; hi: string };
  options: { en: string[]; hi: string[] };
  correctAnswer: { en: string; hi: string };
}
export interface QuizSet {
  id: string;
  title: string;
  questions: Question[];
}
export const availableLanguages = [{ code: 'en', name: 'English' }, { code: 'hi', name: 'Hindi' }];

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  imageSrc: string;
  imageHint?: string;
  tags?: string;
}

export interface JobOpening {
    id: string;
    title: string;
    location: string;
    type: 'Full-time' | 'Part-time' | 'Contract';
    description: string;
    requirements: string[];
}
export const JobOpenings: JobOpening[] = [
    {
        id: 'job-1',
        title: 'Senior Driving Instructor',
        location: 'Gurugram',
        type: 'Full-time',
        description: 'Lead a team of instructors and develop training curriculum.',
        requirements: ['5+ years of experience', 'Official Trainer Certification', 'Excellent communication skills'],
    },
    {
        id: 'job-2',
        title: 'Customer Support Executive',
        location: 'Remote',
        type: 'Full-time',
        description: 'Assist customers with queries and provide platform support.',
        requirements: ['1+ year in customer service', 'Proficiency in English and Hindi', 'Strong problem-solving skills'],
    },
    {
        id: 'job-3',
        title: 'Marketing Manager',
        location: 'Noida',
        type: 'Full-time',
        description: 'Plan and execute marketing campaigns to drive growth.',
        requirements: ['3+ years in digital marketing', 'Experience with social media ads', 'Strong analytical skills'],
    }
];

export interface SiteBanner {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  imageHint: string;
}

export interface PromotionalPoster {
  id: string;
  href: string;
  imageSrc: string;
  imageHint: string;
  title: string;
  description: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  href: string;
  isRead: boolean;
  timestamp: string; // ISO string
}


// New type for the consolidated admin dashboard data
export interface AdminDashboardData {
    summaryData: SummaryData;
    allUsers: UserProfile[];
    lessonRequests: LessonRequest[];
    rescheduleRequests: RescheduleRequest[];
    feedback: Feedback[];
    referrals: Referral[];
    lessonProgress: LessonProgressData[];
    courses: Course[];
    quizSets: QuizSet[];
    faqs: FaqItem[];
    blogPosts: BlogPost[];
    siteBanners: SiteBanner[];
    promotionalPosters: PromotionalPoster[];
    complaints: Complaint[];
    storeProducts: Product[];
}

// Add the DrivingLog types that were missed before
export const DrivingLogFormSchema = z.object({
  sessionDescription: z.string().min(20, {
    message: "Please describe your session in at least 20 characters.",
  }),
});
export type DrivingLogFormValues = z.infer<typeof DrivingLogFormSchema>;

// New Store/Product Types
export interface Product {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  imageHint: string;
  amazonId: string; // ASIN
  flipkartId: string; // FSN/LID
}

export interface PriceData {
    amazonPrice: number | null;
    flipkartPrice: number | null;
}

// =================================================================
// REVENUE MANAGEMENT TYPES
// =================================================================

export interface RevenueTransaction {
    id: string;
    orderId: string;
    studentId: string;
    studentName: string;
    trainerId?: string;
    trainerName?: string;
    planName: string;
    amount: number;
    commission: number; // 20%
    trainerShare: number; // 80%
    paymentMethod: string;
    status: string;
    timestamp: string;
}

export interface TrainerPayout {
    id: string;
    trainerId: string;
    trainerName: string;
    totalEarnings: number;
    pendingAmount: number;
    paidAmount: number;
    lastPayoutDate?: string;
    bankDetails?: string;
    upiId?: string;
    status: 'Pending' | 'Paid';
}

export interface RevenueSummaryData {
    totalRevenue: number;
    totalCommission: number;
    totalTrainerEarnings: number;
    pendingPayouts: number;
    monthlyRevenue: number;
}

export interface RevenueDashboardData {
    summary: RevenueSummaryData;
    transactions: RevenueTransaction[];
    payouts: TrainerPayout[];
    monthlyGrowth: { month: string; revenue: number; commission: number }[];
    trainerEarnings: { trainerName: string; earnings: number; commission: number }[];
}

// =================================================================
// TRAINER WALLET TYPES
// =================================================================

export interface TrainerWallet {
    id: string; // Matches trainerId
    trainerId: string;
    trainerName: string;
    balance: number; // Current withdrawable
    totalEarnings: number; // Lifetime gross
    totalWithdrawn: number; // Lifetime paid
    lastWithdrawalDate?: string;
    lastWithdrawalAmount?: number;
}

export interface WalletTransaction {
    id: string;
    trainerId: string;
    type: 'Credit' | 'Debit';
    amount: number;
    description: string;
    studentName?: string; // For credits
    planName?: string; // For credits
    withdrawalId?: string; // For debits
    status: 'Successful' | 'Pending' | 'Rejected';
    timestamp: string;
}

export interface WithdrawalRequest {
    id: string;
    trainerId: string;
    trainerName: string;
    amount: number;
    upiId: string;
    bankDetails?: string;
    reason?: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
    requestDate: string;
    processedDate?: string;
}

export const WithdrawalRequestSchema = z.object({
    amount: z.coerce.number().min(500, "Minimum withdrawal amount is ₹500."),
    upiId: z.string().min(3, "Valid UPI ID is required."),
    bankDetails: z.string().optional(),
    reason: z.string().optional(),
});
export type WithdrawalRequestValues = z.infer<typeof WithdrawalRequestSchema>;

// =================================================================
// CUSTOMER WALLET TYPES
// =================================================================

export interface CustomerWallet {
    id: string;
    userId: string;
    balance: number;
}

export interface CustomerWalletTransaction {
    id: string;
    userId: string;
    type: 'Credit' | 'Debit';
    amount: number;
    source: 'Signup Bonus' | 'Referral' | 'Purchase Discount' | 'Refund';
    orderId?: string;
    timestamp: string;
}

// =================================================================
// COMPLAINT TYPES
// =================================================================

export type ComplaintStatus = (typeof ComplaintStatusOptions)[number];

export interface Complaint {
    id: string;
    userId?: string;
    userName: string;
    userEmail: string;
    userPhone?: string;
    subject: string;
    message: string;
    status: ComplaintStatus;
    timestamp: string; // ISO string
}
