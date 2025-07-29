'use server';

import { doc, updateDoc, getDoc, collection, addDoc, setDoc, query, where, limit, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import type { ApprovalStatusType, TrainerRegistrationFormValues, FullCustomerDetailsValues, RegistrationFormValues, CustomerRegistrationFormValues, UserProfile, LessonRequest, VehicleType } from '@/types';
import { revalidatePath } from 'next/cache';
import { sendEmail } from './email';
import { format } from 'date-fns';
import { uploadFileToCloudinary } from './cloudinary';
import { createNewUser } from './mock-data';

export async function uploadFile(file: File, folder: string): Promise<string> {
    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        return await uploadFileToCloudinary(buffer, folder);
    } catch (error) {
        console.error('Error in uploadFile server action:', error);
        // Fallback to a placeholder to avoid breaking the app, but log the error.
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
    return { success: true };
}

export const registerUserAction = async (formData: FormData): Promise<{ success: boolean, error?: string }> => {
    const data = Object.fromEntries(formData.entries()) as unknown as RegistrationFormValues;
    const files: { [key: string]: File | null } = {
        trainerCertificateFile: formData.get('trainerCertificateFile') as File | null,
        drivingLicenseFile: formData.get('drivingLicenseFile') as File | null,
        aadhaarCardFile: formData.get('aadhaarCardFile') as File | null,
    };

    try {
        const result = await createNewUser(data, files);
        if (result.success) {
            revalidatePath('/register');
            revalidatePath('/');
        }
        return result;
    } catch (error) {
        console.error("Error in registerUserAction:", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected server error occurred.";
        return { success: false, error: errorMessage };
    }
}

export const completeCustomerProfileAction = async (userId: string, formData: FormData): Promise<{ success: boolean, error?: string }> => {
    if (!userId || !db) {
        return { success: false, error: 'User ID is missing or database is not configured.' };
    }

    try {
        const data = Object.fromEntries(formData.entries());
        const photoIdFile = formData.get('photoIdFile') as File | null;

        if (!photoIdFile || photoIdFile.size === 0) {
            return { success: false, error: 'Photo ID file is required and cannot be empty.' };
        }

        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) throw new Error("User profile not found.");
        const user = userSnap.data();

        const photoIdUrl = await uploadFile(photoIdFile, `user_documents/${userId}`);
        const getLessonsForPlan = (plan: string): number => ({ Premium: 20, Gold: 15, Basic: 10 }[plan] || 0);

        const profileData = {
            subscriptionPlan: data.subscriptionPlan as string,
            vehicleInfo: data.vehiclePreference as string,
            trainerPreference: data.trainerPreference as string,
            flatHouseNumber: data.flatHouseNumber as string,
            street: data.street as string,
            district: data.district as string,
            state: data.state as string,
            pincode: data.pincode as string,
            location: data.district as string,
            dlStatus: data.dlStatus as string,
            dlNumber: (data.dlNumber as string) || '',
            dlTypeHeld: (data.dlTypeHeld as string) || '',
            photoIdType: data.photoIdType as string,
            photoIdNumber: data.photoIdNumber as string,
            photoIdUrl: photoIdUrl,
            subscriptionStartDate: data.subscriptionStartDate as string,
            totalLessons: getLessonsForPlan(data.subscriptionPlan as string),
            completedLessons: 0,
            approvalStatus: 'Pending' as ApprovalStatusType,
        };
        await updateDoc(userRef, profileData);

        const newRequestData: Omit<LessonRequest, 'id'> = {
            customerId: userId, customerName: user.name,
            vehicleType: data.vehiclePreference as VehicleType,
            status: 'Pending', requestTimestamp: new Date().toISOString(),
        };
        await addDoc(collection(db, 'lessonRequests'), newRequestData);
        
        revalidatePath('/payment');
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error("Error completing customer profile:", error);
        return { success: false, error: error.message || 'An unexpected error occurred during profile update.' };
    }
};
