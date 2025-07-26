
'use server';

import { doc, updateDoc, query, collection, where, getDocs, limit, setDoc, addDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import type { ApprovalStatusType, TrainerRegistrationFormValues, UserProfile } from '@/types';
import { revalidatePath } from 'next/cache';
import { sendEmail } from './email';
import { format } from 'date-fns';
import { uploadFile } from './file-upload';

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
    if (!isFirebaseConfigured() || !db) {
        return { success: false, error: 'Database not configured.' };
    }

    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("contact", "==", email), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            // To prevent user enumeration attacks, we don't reveal if the user exists.
            // We just return success and the frontend shows a generic message.
            console.log(`Password reset requested for non-existent email: ${email}`);
            return { success: true };
        }

        const userDoc = querySnapshot.docs[0];
        const user = { id: userDoc.id, ...userDoc.data() };

        // In a real application, you would generate a secure, single-use token,
        // store its hash in the database with an expiry date, and create a reset URL.
        // For this prototype, we'll simulate the link.
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

        const newTrainer: Omit<UserProfile, 'id'> = {
            uniqueId: `TR-${generateId().slice(-6).toUpperCase()}`,
            name: data.name as string,
            username: data.username as string,
            password: data.password as string,
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
            // Include other trainer-specific fields from form
            vehicleNumber: data.vehicleNumber as string,
            fuelType: data.fuelType as string,
            trainerCertificateNumber: data.trainerCertificateNumber as string,
            drivingLicenseNumber: data.drivingLicenseNumber as string,
            aadhaarCardNumber: data.aadhaarCardNumber as string,
        };

        await addDoc(collection(db, 'users'), newTrainer);
        revalidatePath('/site/register');
        return { success: true };

    } catch (error) {
        console.error("Error in registerTrainerAction:", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected server error occurred.";
        return { success: false, error: errorMessage };
    }
}
