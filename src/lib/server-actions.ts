
'use server';

import { doc, updateDoc, getDoc, collection, addDoc, setDoc, query, where, limit, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import type { ApprovalStatusType, TrainerRegistrationFormValues, VehicleType, FullCustomerDetailsValues, UserProfile } from '@/types';
import { revalidatePath } from 'next/cache';
import { sendEmail } from './email';
import { format } from 'date-fns';
import { cloudinaryConfig } from './cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';


export async function uploadFile(file: File, folder: string): Promise<string> {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.error("Cloudinary environment variables are not set.");
        throw new Error("Cannot upload file: Server storage is not configured. Please contact support.");
    }

    await cloudinaryConfig();

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
        file.arrayBuffer()
            .then(buffer => {
                streamifier.createReadStream(Buffer.from(buffer)).pipe(stream);
            })
            .catch(error => {
                console.error('Error converting file to buffer:', error);
                reject(new Error('Failed to read file for upload.'));
            });
    });
}


interface UpdateStatusArgs {
    userId: string;
    newStatus: ApprovalStatusType;
}

const generateId = (): string => {
    return Math.random().toString(36).substring(2, 10);
};

export async function updateUserApprovalStatus({ userId, newStatus }: UpdateStatusArgs) {
    if (!isFirebaseConfigured() || !db) {
        console.error("Firebase not configured. Cannot update user status.");
        return { success: false, error: 'Database not configured.' };
    }

    if (!userId) {
        return { success: false, error: 'User ID is missing.' };
    }

    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, { approvalStatus: newStatus });
        revalidatePath('/'); // Revalidate the dashboard page to show new data
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating user ${userId} status on server:`, error);
        return { success: false, error: error.message || 'An unexpected server error occurred.' };
    }
}

export async function sendPasswordResetLink(email: string): Promise<{ success: boolean; error?: string }> {
    console.warn("sendPasswordResetLink is a mock function. No database is connected.");
    return { success: true };
}

export const registerTrainerAction = async (formData: FormData): Promise<{ success: boolean, error?: string }> => {
    if (!isFirebaseConfigured() || !db) {
        return { success: false, error: 'Database not configured.' };
    }

    try {
        const data = Object.fromEntries(formData.entries());

        // This action is now creating a user in the 'users' collection,
        // so we need the Auth UID. This action should be called AFTER
        // the user is created in Firebase Auth. We'll assume the UID is passed.
        const userId = data.userId as string;
        if (!userId) {
             return { success: false, error: "User is not authenticated. Cannot register trainer." };
        }

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

        const trainerProfileData = {
            uniqueId: `TR-${generateId().slice(-6).toUpperCase()}`,
            location: data.location as string,
            subscriptionPlan: "Trainer",
            vehicleInfo: data.trainerVehicleType as string,
            specialization: data.specialization as string,
            yearsOfExperience: Number(data.yearsOfExperience),
            trainerCertificateUrl: certUrl,
            drivingLicenseUrl: dlUrl,
            aadhaarCardUrl: aadhaarUrl,
            vehicleNumber: data.vehicleNumber as string,
            fuelType: data.fuelType as string,
            trainerCertificateNumber: data.trainerCertificateNumber as string,
            drivingLicenseNumber: data.drivingLicenseNumber as string,
            aadhaarCardNumber: data.aadhaarCardNumber as string,
        };
        
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, trainerProfileData);

        revalidatePath('/site/register');
        revalidatePath('/');
        return { success: true };

    } catch (error) {
        console.error("Error in registerTrainerAction:", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected server error occurred.";
        return { success: false, error: errorMessage };
    }
}


export const completeCustomerProfileAction = async (userId: string, formData: FormData): Promise<{ success: boolean, error?: string }> => {
    console.warn("completeCustomerProfileAction is a mock function. No database is connected.");
    return { success: true };
};
