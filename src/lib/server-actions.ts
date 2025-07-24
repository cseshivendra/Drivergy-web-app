
'use server';

import { doc, updateDoc, query, collection, where, getDocs, limit } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import type { ApprovalStatusType } from '@/types';
import { revalidatePath } from 'next/cache';
import { sendEmail } from './email';

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
