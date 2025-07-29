
'use server';

import { createNewUser } from './mock-data';
import type { RegistrationFormValues } from '@/types';
import { RegistrationFormSchema } from '@/types';
import { sendEmail } from '@/lib/email';
import { doc, updateDoc, collection, addDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { ApprovalStatusType, VehicleType } from '@/types';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

// Cloudinary logic is now self-contained within this server actions file.
const cloudinaryConfig = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });
};

const uploadFileToCloudinary = async (fileBuffer: Buffer, folder: string): Promise<string> => {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
        console.error("Cloudinary environment variables are not set.");
        throw new Error("Cannot upload file: Server storage is not configured.");
    }

    cloudinaryConfig();

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


export async function registerUserAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
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
            return { success: false, error: `Invalid form data: ${errorMessages}` };
        }

        const validatedData = validationResult.data;
        const fileUploads: { [key: string]: File | null } = {};
        
        if (validatedData.userRole === 'trainer') {
            fileUploads.trainerCertificateFile = validatedData.trainerCertificateFile;
            fileUploads.drivingLicenseFile = validatedData.drivingLicenseFile;
            fileUploads.aadhaarCardFile = validatedData.aadhaarCardFile;
        }

        const result = await createNewUser(validatedData, fileUploads);

        if (!result.success) {
            return { success: false, error: result.error };
        }

        return { success: true };

    } catch (error) {
        console.error("Error in registerUserAction:", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected server error occurred.";
        return { success: false, error: errorMessage };
    }
}


export async function sendPasswordResetLink(email: string): Promise<{ success: boolean; error?: string }> {
    // This is a mock function. In a real app, you would generate a secure token,
    // save it with an expiry date in the database, and send a real email.
    console.log(`A password reset link would be sent to ${email} if email services were configured.`);
    return { success: true };
}


interface UpdateStatusArgs {
    userId: string;
    newStatus: ApprovalStatusType;
}

export async function updateUserApprovalStatus({ userId, newStatus }: UpdateStatusArgs): Promise<{ success: boolean; error?: string }> {
    if (!db) {
        return { success: false, error: 'Database not configured.' };
    }
    if (!userId) {
        return { success: false, error: 'User ID is missing.' };
    }

    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { approvalStatus: newStatus });
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating user ${userId} status on server:`, error);
        return { success: false, error: error.message || 'An unexpected server error occurred.' };
    }
}


export const completeCustomerProfileAction = async (userId: string, formData: FormData): Promise<{ success: boolean, error?: string }> => {
    if (!db) {
        return { success: false, error: 'Database not configured.' };
    }
    if (!userId) {
        return { success: false, error: 'User ID is missing.' };
    }

    try {
        const data = Object.fromEntries(formData.entries());
        const photoIdFile = formData.get('photoIdFile') as File | null;
        
        if (!photoIdFile || photoIdFile.size === 0) {
            return { success: false, error: 'Photo ID file is required and cannot be empty.' };
        }
        
        const buffer = await photoIdFile.arrayBuffer();
        const photoIdUrl = await uploadFileToCloudinary(Buffer.from(buffer), `user_documents/${userId}`);

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

        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if(!userSnap.exists()) {
             throw new Error("User profile not found.");
        }
        
        await updateDoc(userRef, profileData);
        
        const newRequestData = {
            customerId: userId,
            customerName: userSnap.data().name,
            vehicleType: data.vehiclePreference as VehicleType,
            status: 'Pending' as const,
            requestTimestamp: new Date().toISOString(),
        };
        await addDoc(collection(db, 'lessonRequests'), newRequestData);

        return { success: true };
    } catch (error: any) {
        console.error("Error completing customer profile:", error);
        return { success: false, error: error.message || 'An unexpected error occurred during profile update.' };
    }
};

// This function is now internal to server-actions.ts and is NOT exported
// It was previously in a separate file, causing client-bundle issues.
export const uploadFile = async (file: File, folder: string): Promise<string> => {
    const buffer = await file.arrayBuffer();
    return uploadFileToCloudinary(Buffer.from(buffer), folder);
}
