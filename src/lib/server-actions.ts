
'use server';

import { z } from 'zod';
import { RegistrationFormSchema, FullCustomerDetailsSchema, UserProfileUpdateValues, UserProfileUpdateSchema, ChangePasswordValues, ChangePasswordSchema, CourseModuleFormValues, CourseModuleSchema, QuizQuestionFormValues, QuizQuestionSchema, FaqFormValues, FaqSchema, BlogPostFormValues, BlogPostSchema, VisualContentFormValues, VisualContentSchema } from '@/types';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { adminAuth, adminDb } from './firebase/admin';
import type { ApprovalStatusType, UserProfile, CourseModule, QuizSet, Question, FaqItem, BlogPost, SiteBanner, PromotionalPoster, PayoutStatusType, RescheduleRequest, RescheduleRequestStatusType } from '@/types';
import { addDays, format, parse } from 'date-fns';
import { allUsers } from './mock-data';

const initializeCloudinary = async () => {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
        console.warn("Cloudinary environment variables not fully set. File uploads will fail.");
    }
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });
};

const uploadFileToCloudinary = async (fileBuffer: Buffer, folder: string): Promise<string> => {
    await initializeCloudinary();
    
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: folder, resource_type: "auto" },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    reject(new Error('File upload to Cloudinary failed.'));
                } else if (result) {
                    resolve(result.secure_url);
                } else {
                    reject(new Error('File upload failed: No result from Cloudinary.'));
                }
            }
        );
        streamifier.createReadStream(fileBuffer).pipe(stream);
    });
};

export async function registerUserAction(prevState: any, formData: FormData): Promise<{ success: boolean; error?: string }> {
    if (!adminAuth || !adminDb) {
        const errorMessage = "Firebase Admin SDK is not initialized on the server. Check server logs and environment variables.";
        console.error("registerUserAction:", errorMessage);
        return { success: false, error: errorMessage };
    }

    try {
        const data = Object.fromEntries(formData.entries());
        
        const files: { [key: string]: File | null } = {
            trainerCertificateFile: formData.get('trainerCertificateFile') as File | null,
            drivingLicenseFile: formData.get('drivingLicenseFile') as File | null,
            aadhaarCardFile: formData.get('aadhaarCardFile') as File | null,
        };
        
        const combinedData = { ...data, ...files };
        const validationResult = RegistrationFormSchema.safeParse(combinedData);

        if (!validationResult.success) {
            const errorMessages = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            console.error("Zod validation failed:", errorMessages);
            return { success: false, error: `Invalid form data: ${errorMessages}` };
        }

        const validatedData = validationResult.data;
        const { email, password, name, userRole } = validatedData;
        
        const existingUser = await adminAuth.getUserByEmail(email).catch(() => null);
        if (existingUser) {
            return { success: false, error: "A user is already registered with this email." };
        }
        
        const userRecord = await adminAuth.createUser({ email, password, displayName: name, emailVerified: true });
        const uid = userRecord.uid;

        const fileUrls: { [key: string]: string | null } = {};
        
        let newUserProfileData: UserProfile;

        if (userRole === 'trainer') {
            const trainerData = validatedData as z.infer<typeof import('@/types').TrainerRegistrationFormSchema>;
            const fileUploadPromises = [];
             if (trainerData.trainerCertificateFile && trainerData.trainerCertificateFile.size > 0) {
                fileUploadPromises.push(uploadFileToCloudinary(Buffer.from(await trainerData.trainerCertificateFile.arrayBuffer()), `user_documents`).then(url => { fileUrls['trainerCertificateUrl'] = url; }));
            }
             if (trainerData.drivingLicenseFile && trainerData.drivingLicenseFile.size > 0) {
                fileUploadPromises.push(uploadFileToCloudinary(Buffer.from(await trainerData.drivingLicenseFile.arrayBuffer()), `user_documents`).then(url => { fileUrls['drivingLicenseUrl'] = url; }));
            }
             if (trainerData.aadhaarCardFile && trainerData.aadhaarCardFile.size > 0) {
                fileUploadPromises.push(uploadFileToCloudinary(Buffer.from(await trainerData.aadhaarCardFile.arrayBuffer()), `user_documents`).then(url => { fileUrls['aadhaarCardUrl'] = url; }));
            }
            await Promise.all(fileUploadPromises);

            newUserProfileData = {
                id: uid,
                uniqueId: `TR-${uid.slice(-6).toUpperCase()}`,
                name: trainerData.name,
                username: trainerData.username,
                contact: trainerData.email,
                phone: trainerData.phone,
                gender: trainerData.gender,
                location: trainerData.location,
                subscriptionPlan: "Trainer",
                registrationTimestamp: format(new Date(), 'MMM dd, yyyy'),
                approvalStatus: 'Pending' as ApprovalStatusType,
                photoURL: `https://placehold.co/100x100.png?text=${trainerData.name.charAt(0)}`,
                myReferralCode: `${trainerData.name.split(' ')[0].toUpperCase()}${uid.slice(-4)}`,
                vehicleInfo: trainerData.trainerVehicleType,
                specialization: trainerData.specialization,
                yearsOfExperience: Number(trainerData.yearsOfExperience),
                trainerCertificateUrl: fileUrls.trainerCertificateUrl || '',
                drivingLicenseUrl: fileUrls.drivingLicenseUrl || '',
                aadhaarCardUrl: fileUrls.aadhaarCardUrl || '',
            };
        } else {
             const customerData = validatedData as z.infer<typeof import('@/types').CustomerRegistrationFormSchema>;
             newUserProfileData = {
                id: uid,
                uniqueId: `CU-${uid.slice(-6).toUpperCase()}`,
                name: customerData.name,
                username: customerData.username,
                contact: customerData.email,
                phone: customerData.phone,
                gender: customerData.gender,
                location: 'TBD',
                subscriptionPlan: "None",
                registrationTimestamp: format(new Date(), 'MMM dd, yyyy'),
                approvalStatus: 'Pending',
                photoURL: `https://placehold.co/100x100.png?text=${customerData.name.charAt(0)}`,
                myReferralCode: `${customerData.name.split(' ')[0].toUpperCase()}${uid.slice(-4)}`,
                trainerPreference: customerData.trainerPreference || 'Any',
            };
        }

        allUsers.push(newUserProfileData);
        return { success: true };

    } catch (error: any) {
        console.error("Error in registerUserAction:", error);
        if (error.code === 'auth/email-already-exists') {
             return { success: false, error: 'A user is already registered with this email.' };
        }
        const errorMessage = error.message || "An unexpected server error occurred.";
        return { success: false, error: errorMessage };
    }
}

export async function verifyAdminCredentials({ username, password }: { username: string, password?: string }): Promise<{ isAdmin: boolean, error?: string }> {
    if (!adminDb) return { isAdmin: false, error: 'Firebase Admin not initialized.' };

    if (username.toLowerCase() !== 'admin' || !password) {
        return { isAdmin: false };
    }
    
    // In a mock environment, we check against hardcoded credentials
    if (username.toLowerCase() === 'admin' && password === 'admin') {
        return { isAdmin: true };
    } else {
        return { isAdmin: false, error: 'Invalid admin credentials.' };
    }
}


export async function sendPasswordResetLink(email: string): Promise<{ success: boolean; error?: string }> {
    console.log(`A password reset link would be sent to ${email} if email services were configured.`);
    return { success: true };
}

interface UpdateStatusArgs {
    userId: string;
    newStatus: ApprovalStatusType;
}

export async function updateUserApprovalStatus({ userId, newStatus }: UpdateStatusArgs): Promise<{ success: boolean; error?: string }> {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
      return { success: false, error: 'User not found in mock data.' };
    }
    user.approvalStatus = newStatus;
    console.log(`Mock: Updated status for ${user.name} to ${newStatus}`);
    return { success: true };
}

export const completeCustomerProfileAction = async (userId: string, formData: FormData): Promise<{ success: boolean, error?: string }> => {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
      return { success: false, error: 'User not found in mock data.' };
    }

    try {
        const data = Object.fromEntries(formData.entries());
        
        const file = formData.get('photoIdFile') as File | null;
        if (!file || file.size === 0) {
             return { success: false, error: 'Photo ID file is required.' };
        }

        const validationResult = FullCustomerDetailsSchema.safeParse({ ...data, photoIdFile: file });
         if (!validationResult.success) {
            const errorMessages = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            return { success: false, error: `Invalid form data: ${errorMessages}` };
        }
        
        const validatedData = validationResult.data;
        const photoIdUrl = "https://placehold.co/file-mock.pdf";

        const getLessonsForPlan = (plan: string): number => ({ Premium: 20, Gold: 15, Basic: 10 }[plan] || 0);

        Object.assign(user, {
            subscriptionPlan: validatedData.subscriptionPlan,
            vehiclePreference: validatedData.vehiclePreference,
            trainerPreference: validatedData.trainerPreference,
            flatHouseNumber: validatedData.flatHouseNumber,
            street: validatedData.street,
            district: validatedData.district,
            state: validatedData.state,
            pincode: validatedData.pincode,
            location: validatedData.district,
            dlStatus: validatedData.dlStatus,
            dlNumber: validatedData.dlNumber || '',
            dlTypeHeld: validatedData.dlTypeHeld || '',
            photoIdType: validatedData.photoIdType,
            photoIdNumber: validatedData.photoIdNumber,
            photoIdUrl: photoIdUrl,
            subscriptionStartDate: format(validatedData.subscriptionStartDate, 'MMM dd, yyyy'),
            totalLessons: getLessonsForPlan(validatedData.subscriptionPlan),
            completedLessons: 0,
            approvalStatus: 'Pending' as ApprovalStatusType,
        });

        console.log(`Mock: Completed profile for ${user.name}`);
        return { success: true };
    } catch (error: any) {
        console.error("Error completing customer profile:", error);
        return { success: false, error: error.message || 'An unexpected error occurred during profile update.' };
    }
};

const generateId = (): string => Math.random().toString(36).substring(2, 10);

export async function addBlogPost(data: BlogPostFormValues): Promise<BlogPost | null> {
    console.log("Mock addBlogPost called");
    return null;
}

export async function updateBlogPost(slug: string, data: BlogPostFormValues): Promise<boolean> {
    console.log("Mock updateBlogPost called");
    return true;
}

export async function deleteBlogPost(slug: string): Promise<boolean> {
    console.log("Mock deleteBlogPost called");
    return true;
}

export async function addCourseModule(courseId: string, moduleData: Omit<CourseModule, 'id'>): Promise<Course | null> {
    console.log("Mock addCourseModule called");
    return null;
}

export async function updateCourseModule(courseId: string, moduleId: string, moduleData: CourseModuleFormValues): Promise<Course | null> {
    console.log("Mock updateCourseModule called");
    return null;
}

export async function deleteCourseModule(courseId: string, moduleId: string): Promise<boolean> {
    console.log("Mock deleteCourseModule called");
    return true;
}

export async function addFaq(data: FaqFormValues): Promise<FaqItem | null> {
    console.log("Mock addFaq called");
    return null;
}

export async function updateFaq(id: string, data: FaqFormValues): Promise<boolean> {
    console.log("Mock updateFaq called");
    return true;
}

export async function deleteFaq(id: string): Promise<boolean> {
    console.log("Mock deleteFaq called");
    return true;
}

export async function updateSiteBanner(id: string, data: VisualContentFormValues): Promise<boolean> {
    console.log("Mock updateSiteBanner called");
    return true;
}

export async function updatePromotionalPoster(id: string, data: VisualContentFormValues): Promise<boolean> {
    console.log("Mock updatePromotionalPoster called");
    return true;
}

export async function updateQuizQuestion(quizSetId: string, questionId: string, data: QuizQuestionFormValues): Promise<QuizSet | null> {
    console.log("Mock updateQuizQuestion called");
    return null;
}

export async function changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    console.log(`Mock: Password change requested for user ${userId}.`);
    return false; 
};

export async function assignTrainerToCustomer(customerId: string, trainerId: string): Promise<boolean> {
    const customer = allUsers.find(u => u.id === customerId);
    const trainer = allUsers.find(u => u.id === trainerId);

    if (!customer || !trainer) return false;

    customer.approvalStatus = 'In Progress';
    customer.assignedTrainerId = trainerId;
    customer.assignedTrainerName = trainer.name;

    console.log(`Mock: Assigned ${trainer.name} to ${customer.name}`);
    return true;
};

export async function updateAssignmentStatusByTrainer(customerId: string, newStatus: 'Approved' | 'Rejected'): Promise<boolean> {
    const customer = allUsers.find(u => u.id === customerId);
    if (!customer) return false;

    customer.approvalStatus = newStatus;

    if (newStatus === 'Approved') {
        if(customer.subscriptionStartDate) {
            const startDate = parse(customer.subscriptionStartDate!, 'MMM dd, yyyy', new Date());
            const firstLessonDate = addDays(startDate, 2);
            firstLessonDate.setHours(9, 0, 0, 0);
            customer.upcomingLesson = format(firstLessonDate, 'MMM dd, yyyy, h:mm a');
        }
        console.log(`Mock: Approved assignment for ${customer.name}`);
    } else {
        customer.assignedTrainerId = undefined;
        customer.assignedTrainerName = undefined;
        customer.approvalStatus = 'Pending';
        console.log(`Mock: Rejected assignment for ${customer.name}`);
    }
    return true;
}

export async function updateUserAttendance(studentId: string, status: 'Present' | 'Absent'): Promise<boolean> {
    const student = allUsers.find(u => u.id === studentId);
    if (!student) return false;

    if (status === 'Present' && student.attendance !== 'Present') {
        student.completedLessons = (student.completedLessons || 0) + 1;
    }
    student.attendance = status;
    console.log(`Mock: Marked attendance for ${student.name} as ${status}`);
    return true;
}

export async function updateSubscriptionStartDate(customerId: string, newDate: Date): Promise<UserProfile | null> {
    const customer = allUsers.find(u => u.id === customerId);
    if (!customer) return null;

    const firstLessonDate = addDays(newDate, 2);
    firstLessonDate.setHours(9, 0, 0, 0);
    
    customer.subscriptionStartDate = format(newDate, 'MMM dd, yyyy');
    customer.upcomingLesson = format(firstLessonDate, 'MMM dd, yyyy, h:mm a');

    console.log(`Mock: Updated subscription start date for ${customer.name}`);
    return customer;
}

export async function addRescheduleRequest(userId: string, customerName: string, originalDate: Date, newDate: Date): Promise<RescheduleRequest | null> {
    console.log(`Mock: Added reschedule request for ${customerName}`);
    return null; // Mock does not handle adding new requests yet
}

export async function updateRescheduleRequestStatus(requestId: string, newStatus: RescheduleRequestStatusType): Promise<boolean> {
    console.log(`Mock: Updated reschedule request ${requestId} to ${newStatus}`);
    return true;
}

export async function addFeedback(customerId: string, customerName: string, trainerId: string, trainerName: string, rating: number, comment: string): Promise<boolean> {
    const customer = allUsers.find(u => u.id === customerId);
    if(customer) {
        customer.feedbackSubmitted = true;
    }
    console.log(`Mock: Added feedback for trainer ${trainerName} from ${customerName}`);
    return true;
}

export async function updateReferralPayoutStatus(referralId: string, status: PayoutStatusType): Promise<boolean> {
     console.log(`Mock: Updated referral ${referralId} payout status to ${status}`);
     return true;
}

export async function updateUserProfile(userId: string, data: UserProfileUpdateValues): Promise<UserProfile | null> {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return null;

    const { photo, ...restData } = data;

    const updateData: Partial<UserProfile> = {
        ...restData,
        location: data.district || user.location,
    };
    
    if (photo) {
        updateData.photoURL = `https://placehold.co/100x100.png?text=${data.name.charAt(0)}`;
    }

    Object.assign(user, updateData);
    console.log(`Mock: Updated profile for ${user.name}`);
    return user;
};
