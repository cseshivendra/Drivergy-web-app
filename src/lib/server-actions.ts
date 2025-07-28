
'use server';

import { doc, updateDoc, getDoc, collection, addDoc, setDoc, query, where, limit, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import type { ApprovalStatusType, TrainerRegistrationFormValues, VehicleType, FullCustomerDetailsValues } from '@/types';
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
        const userRef = doc(db, 'users', userId); // All users are in the 'users' collection
        await updateDoc(userRef, { approvalStatus: newStatus });
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating user ${userId} status on server:`, error);
        return { success: false, error: error.message || 'An unexpected server error occurred.' };
    }
}

export async function sendPasswordResetLink(email: string): Promise<{ success: boolean; error?: string }> {
    if (!isFirebaseConfigured() || !db) {
        return { success: false, error: 'Database not configured.' };
    }

    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("contact", "==", email), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log(`Password reset requested for non-existent email: ${email}`);
            return { success: true };
        }

        const userDoc = querySnapshot.docs[0];
        const user = { id: userDoc.id, ...userDoc.data() };

        // This is a mock reset link. In a real app, use Firebase Auth's sendPasswordResetEmail.
        const resetToken = `simulated-token-${Date.now()}`;
        const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/site/reset-password?token=${resetToken}&userId=${user.id}`;

        const emailHtml = `
            <h1>Password Reset Request</h1>
            <p>Hi ${user.name},</p>
            <p>You requested to reset your password. Please click the link below to set a new one:</p>
            <a href="${resetLink}">Reset Password</a>
            <p>If you did not request a password reset, please ignore this email.</p>
        `;

        await sendEmail({
            to: user.contact,
            subject: 'Drivergy - Password Reset Request',
            html: emailHtml,
        });

        return { success: true };

    } catch (error: any) {
        console.error("Error sending password reset link:", error);
        return { success: false, error: "Failed to send reset email. Please try again later." };
    }
}

export const registerTrainerAction = async (formData: FormData): Promise<{ success: boolean, error?: string }> => {
    if (!isFirebaseConfigured() || !db) {
        return { success: false, error: 'Database not configured.' };
    }

    try {
        // This is a server action, so we need to handle auth manually.
        // In a real app, you would use the Firebase Admin SDK to create a user.
        // For this project, we'll create the user document directly.
        const data = Object.fromEntries(formData.entries());

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

        const newTrainerData = {
            uniqueId: `TR-${generateId().slice(-6).toUpperCase()}`,
            name: data.name as string,
            contact: data.email as string,
            phone: data.phone as string,
            location: data.location as string,
            gender: data.gender as string,
            subscriptionPlan: "Trainer",
            registrationTimestamp: format(new Date(), 'MMM dd, yyyy'),
            vehicleInfo: data.trainerVehicleType as string,
            approvalStatus: 'Pending',
            myReferralCode: `${(data.name as string).split(' ')[0].toUpperCase()}${generateId().slice(-4)}`,
            photoURL: `https://placehold.co/100x100.png?text=${(data.name as string).charAt(0)}`,
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
        
        // In a real app, this should be the UID from Firebase Auth.
        // Since we are not creating an auth user here for trainers directly, we use a new doc ref.
        const trainerDocRef = doc(collection(db, 'users'));
        await setDoc(trainerDocRef, newTrainerData);

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
    if (!isFirebaseConfigured() || !db) {
        return { success: false, error: 'Database not configured.' };
    }
     if (!userId) {
        return { success: false, error: 'User ID is missing.' };
    }

    const data = Object.fromEntries(formData.entries());
    const photoIdFile = formData.get('photoIdFile') as File | null;
    
    if (!photoIdFile || photoIdFile.size === 0) {
        return { success: false, error: 'Photo ID file is required and cannot be empty.' };
    }

    const getLessonsForPlan = (plan: string): number => ({ Premium: 20, Gold: 15, Basic: 10 }[plan] || 0);

    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            throw new Error("User profile not found.");
        }
        const user = userSnap.data();

        const photoIdUrl = await uploadFile(photoIdFile, `user_documents/${userId}`);
        
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
            customerId: userId,
            customerName: user.name,
            vehicleType: data.vehiclePreference as VehicleType,
            status: 'Pending',
            requestTimestamp: new Date().toISOString(),
        };
        const newRequestRef = doc(collection(db, 'lessonRequests'));
        await setDoc(newRequestRef, newRequestData);
        
        revalidatePath('/site/payment');
        return { success: true };
    } catch (error: any) {
        console.error("Error completing customer profile:", error);
        return { success: false, error: error.message || 'An unexpected error occurred during profile update.' };
    }
};

    