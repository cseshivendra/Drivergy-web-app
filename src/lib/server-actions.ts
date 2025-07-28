
'use server';

import { doc, updateDoc, getDoc, collection, addDoc, setDoc, query, where, limit, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import type { ApprovalStatusType, TrainerRegistrationFormValues, FullCustomerDetailsValues, RegistrationFormValues, CustomerRegistrationFormValues, UserProfile, LessonRequest, VehicleType } from '@/types';
import { revalidatePath } from 'next/cache';
import { sendEmail } from './email';
import { format } from 'date-fns';
import { 
    checkUserExistsInMock,
    registerTrainerInMock,
    completeCustomerProfileInMock,
    registerCustomerInMock
} from './mock-data';
import { uploadFileToCloudinary } from './cloudinary';

export async function uploadFile(file: File, folder: string): Promise<string> {
    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        // Use the mock-enabled Cloudinary uploader
        return await uploadFileToCloudinary(buffer, folder);
    } catch (error) {
        console.error('Error in mock uploadFile:', error);
        return "https://placehold.co/600x400.png?text=UploadError";
    }
}

interface UpdateStatusArgs {
    userId: string;
    newStatus: ApprovalStatusType;
}

export async function updateUserApprovalStatus({ userId, newStatus }: UpdateStatusArgs) {
    if (!isFirebaseConfigured() || !db) {
        console.error("Firebase not configured. Cannot update user status.");
        return { success: false, error: 'Database not configured.' };
    }

    if (!userId) {
        return { success: false, error: 'User ID is missing.' };
    }
    
    console.log(`Server Action: Updating user ${userId} to status ${newStatus}`);
    
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { approvalStatus: newStatus });
        revalidatePath('/'); // Revalidate the dashboard page to show new data
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating user ${userId} status on server:`, error);
        return { success: false, error: error.message || 'An unexpected server error occurred.' };
    }
}

export async function sendPasswordResetLink(email: string): Promise<{ success: boolean; error?: string }> {
    console.log(`Simulating password reset link sent to: ${email}`);
    // In a real app, you would generate a token and send a real email.
    // For mock mode, we just return success.
    return { success: true };
}


export const registerUserAction = async (formData: FormData): Promise<{ success: boolean, error?: string }> => {
    try {
        const data = Object.fromEntries(formData.entries()) as unknown as RegistrationFormValues;

        // Pre-registration check
        const userExists = await checkUserExistsInMock({
            email: data.email,
            username: data.username,
            phone: data.phone,
        });

        if (userExists) {
            return { success: false, error: "A user is already registered with this email, username, or phone number." };
        }

        if (data.userRole === 'customer') {
             await registerCustomerInMock(data as CustomerRegistrationFormValues);
        } else if (data.userRole === 'trainer') {
            const certFile = formData.get('trainerCertificateFile') as File | null;
            const dlFile = formData.get('drivingLicenseFile') as File | null;
            const aadhaarFile = formData.get('aadhaarCardFile') as File | null;

            if (!certFile || !dlFile || !aadhaarFile) {
                return { success: false, error: "One or more required documents were not uploaded." };
            }

            const [certUrl, dlUrl, aadhaarUrl] = await Promise.all([
                uploadFile(certFile, 'trainer_documents'),
                uploadFile(dlFile, 'trainer_documents'),
                uploadFile(aadhaarFile, 'trainer_documents'),
            ]);

            const trainerData = {
                ...data,
                trainerCertificateUrl: certUrl,
                drivingLicenseUrl: dlUrl,
                aadhaarCardUrl: aadhaarUrl,
            } as unknown as TrainerRegistrationFormValues;
            
            await registerTrainerInMock(trainerData);
        }

        revalidatePath('/site/register');
        revalidatePath('/');
        return { success: true };

    } catch (error) {
        console.error("Error in registerUserAction:", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected server error occurred.";
        return { success: false, error: errorMessage };
    }
}


export const completeCustomerProfileAction = async (userId: string, formData: FormData): Promise<{ success: boolean, error?: string }> => {
    if (!userId) {
        return { success: false, error: 'User ID is missing.' };
    }

    try {
        const data = Object.fromEntries(formData.entries());
        const photoIdFile = formData.get('photoIdFile') as File | null;

        if (!photoIdFile || photoIdFile.size === 0) {
            return { success: false, error: 'Photo ID file is required and cannot be empty.' };
        }

        const photoIdUrl = await uploadFile(photoIdFile, `user_documents/${userId}`);
        const values = {
            ...data,
            photoIdUrl,
        } as unknown as FullCustomerDetailsValues;

        await completeCustomerProfileInMock(userId, values);
        
        revalidatePath('/site/payment');
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error("Error completing customer profile:", error);
        return { success: false, error: error.message || 'An unexpected error occurred during profile update.' };
    }
};
