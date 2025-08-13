
'use server';

import { z } from 'zod';
import { RegistrationFormSchema, FullCustomerDetailsSchema, UserProfileUpdateSchema, ChangePasswordSchema } from '@/types';
import type { UserProfile, ApprovalStatusType, PayoutStatusType, RescheduleRequestStatusType, UserProfileUpdateValues, BlogPostFormValues, RescheduleRequest, ChangePasswordValues, FullCustomerDetailsValues } from '@/types';
import { format, parseISO } from 'date-fns';
import { adminAuth, adminDb, adminStorage } from './firebase/admin';
import { revalidatePath } from 'next/cache';
import { uploadFileToCloudinary } from './cloudinary';

// Helper to convert file to buffer
async function fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

// =================================================================
// LIVE SERVER ACTIONS - Interacts with Firebase Admin SDK
// =================================================================

export async function registerUserAction(prevState: any, formData: FormData): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
    if (!adminAuth || !adminDb) {
        return { success: false, error: "Server is not configured for authentication." };
    }

    try {
        const data = Object.fromEntries(formData.entries());
        
        // Handle file inputs for Zod validation
        const fileFields = ['trainerCertificateFile', 'drivingLicenseFile', 'aadhaarCardFile'];
        fileFields.forEach(field => {
            if (formData.has(field)) {
                data[field] = formData.get(field) as File;
            }
        });

        const validationResult = RegistrationFormSchema.safeParse(data);

        if (!validationResult.success) {
            console.error("Registration validation failed:", validationResult.error.format());
            // Zod's error messages are detailed. Let's return a specific one if possible.
            const firstError = validationResult.error.errors[0]?.message || 'Invalid form data. Please check all fields.';
            return { success: false, error: firstError };
        }
        
        const { email, password, name, phone, userRole, username, gender } = validationResult.data;

        // Create user in Firebase Auth
        const userRecord = await adminAuth.createUser({
            email: email,
            emailVerified: false,
            password: password,
            displayName: name,
            disabled: false,
        });

        // Base user profile
        let newUserProfile: Omit<UserProfile, 'id' | 'registrationTimestamp'> = {
            uniqueId: `${userRole === 'customer' ? 'CU' : 'TR'}-${userRecord.uid.slice(0, 6).toUpperCase()}`,
            name: name,
            username: username,
            contact: email,
            phone: phone,
            gender: gender,
            subscriptionPlan: userRole === 'trainer' ? 'Trainer' : 'None',
            approvalStatus: 'Pending',
        };

        // Add trainer-specific fields
        if (userRole === 'trainer' && 'location' in validationResult.data) {
            const {
                location, yearsOfExperience, specialization, trainerVehicleType, fuelType, vehicleNumber,
                trainerCertificateNumber, drivingLicenseNumber, aadhaarCardNumber,
                trainerCertificateFile, drivingLicenseFile, aadhaarCardFile
            } = validationResult.data;

            // Upload files to Cloudinary
            const [certUrl, dlUrl, aadhaarUrl] = await Promise.all([
                uploadFileToCloudinary(await fileToBuffer(trainerCertificateFile), 'trainer_documents'),
                uploadFileToCloudinary(await fileToBuffer(drivingLicenseFile), 'trainer_documents'),
                uploadFileToCloudinary(await fileToBuffer(aadhaarCardFile), 'trainer_documents')
            ]);
            
            Object.assign(newUserProfile, {
                location, specialization, yearsOfExperience, vehicleInfo: `${trainerVehicleType} (${fuelType}) - ${vehicleNumber}`,
                licenseNumber: drivingLicenseNumber, // Re-check if this is the correct mapping
                trainerCertificateUrl: certUrl,
                drivingLicenseUrl: dlUrl,
                aadhaarCardUrl: aadhaarUrl,
                // store numbers as well if needed
            });
        }

        // Add registration timestamp using Firestore's server time
        const finalProfile = {
            ...newUserProfile,
            registrationTimestamp: new Date().toISOString(), // Use ISO string for consistency
        };

        await adminDb.collection('users').doc(userRecord.uid).set(finalProfile);
        
        const createdUser: UserProfile = { id: userRecord.uid, ...finalProfile };
        
        revalidatePath('/dashboard');

        return { success: true, user: createdUser };

    } catch (error: any) {
        console.error("Error in registerUserAction:", error);
        if (error.code === 'auth/email-already-exists') {
            return { success: false, error: 'A user is already registered with this email address.' };
        }
        if (error.code === 'auth/username-already-exists') {
            return { success: false, error: 'This username is already taken. Please choose another one.' };
        }
        return { success: false, error: error.message || 'An unexpected server error occurred during registration.' };
    }
}


export async function sendPasswordResetLink(email: string): Promise<{ success: boolean; error?: string }> {
    if (!adminAuth) {
         return { success: false, error: "Server is not configured for authentication." };
    }
    try {
        await adminAuth.generatePasswordResetLink(email);
        return { success: true };
    } catch (error: any) {
        console.error("Password reset error:", error);
        return { success: true };
    }
}

export async function updateUserApprovalStatus({ userId, newStatus }: { userId: string; newStatus: ApprovalStatusType; }): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: "Database not configured." };
    
    try {
        const userRef = adminDb.collection('users').doc(userId);
        await userRef.update({ approvalStatus: newStatus });
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating user ${userId} status:`, error);
        return { success: false, error: "Failed to update user status." };
    }
}

export async function completeCustomerProfileAction(prevState: any, formData: FormData): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
    if (!adminDb) {
        return { success: false, error: "Server not configured." };
    }
    
    try {
        const data = Object.fromEntries(formData.entries());
        data.photoIdFile = formData.get('photoIdFile') as File;
        const validationResult = FullCustomerDetailsSchema.safeParse(data);

        if (!validationResult.success) {
            console.error("Profile completion validation failed:", validationResult.error.format());
            return { success: false, error: "Invalid form data. Please check all fields." };
        }

        const { userId, photoIdFile, ...profileData } = validationResult.data;
        
        const photoIdUrl = await uploadFileToCloudinary(await fileToBuffer(photoIdFile), 'customer_documents');
        
        const userRef = adminDb.collection('users').doc(userId);
        await userRef.update({ ...profileData, photoIdUrl, approvalStatus: 'In Progress' });

        const updatedDoc = await userRef.get();
        const updatedUser = { id: updatedDoc.id, ...updatedDoc.data() } as UserProfile;
        
        revalidatePath('/dashboard');
        return { success: true, user: updatedUser };

    } catch(error: any) {
        console.error("Error completing customer profile:", error);
        return { success: false, error: "An unexpected error occurred." };
    }
}

// And so on... other server actions would be implemented here using adminDb and adminAuth

export async function changeUserPassword(userId: string, currentPass: string, newPass: string): Promise<boolean> {
   if (!adminAuth) {
        console.error("Auth not configured.");
        return false;
    }
    // This is complex to do securely from a server action without the user's active session.
    // The recommended approach is to use the Firebase client SDK's `reauthenticateWithCredential`
    // and `updatePassword` methods on the client side. This server action is a placeholder.
    // A real implementation would require a custom auth flow.
    console.warn("Server-side password change is not recommended without re-authentication.");
    return false;
}

export async function updateUserProfile(userId: string, data: UserProfileUpdateValues): Promise<UserProfile | null> {
    return null;
}
export async function addBlogPost(data: BlogPostFormValues): Promise<boolean> {
    return false;
}
export async function updateBlogPost(slug: string, data: BlogPostFormValues): Promise<boolean> {
    return false;
}
export async function deleteBlogPost(slug: string): Promise<boolean> {
    return false;
}

// Mocked functions to be replaced
export async function assignTrainerToCustomer(customerId: string, trainerId: string): Promise<boolean> { return false; }
export async function updateAssignmentStatusByTrainer(customerId: string, newStatus: 'Approved' | 'Rejected'): Promise<boolean> { return false; }
export async function updateUserAttendance(studentId: string, status: 'Present' | 'Absent'): Promise<boolean> { return false; }
export async function updateSubscriptionStartDate(customerId: string, newDate: Date): Promise<UserProfile | null> { return null; }
export async function addRescheduleRequest(userId: string, customerName: string, originalDate: Date, newDate: Date): Promise<boolean> { return false; }
export async function updateRescheduleRequestStatus(requestId: string, newStatus: RescheduleRequestStatusType): Promise<boolean> { return false; }
export async function addFeedback(customerId: string, customerName: string, trainerId: string, trainerName: string, rating: number, comment: string): Promise<boolean> { return false; }
export async function updateReferralPayoutStatus(referralId: string, status: PayoutStatusType): Promise<boolean> { return false; }
