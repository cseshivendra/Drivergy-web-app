
'use server';

import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import type { ApprovalStatusType } from '@/types';
import { revalidatePath } from 'next/cache';

interface UpdateStatusArgs {
    userId: string;
    newStatus: ApprovalStatusType;
}

export async function updateUserApprovalStatus({ userId, newStatus }: UpdateStatusArgs): Promise<{success: boolean, error?: string}> {
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

interface AssignTrainerArgs {
    customerId: string;
    trainerId: string;
}

export async function assignTrainerToCustomer({ customerId, trainerId }: AssignTrainerArgs): Promise<{success: boolean, error?: string}> {
    if (!isFirebaseConfigured() || !db) {
        return { success: false, error: 'Database not configured.' };
    }

    try {
        const customerRef = doc(db, "users", customerId);
        const trainerSnap = await getDoc(doc(db, "users", trainerId));

        if (!trainerSnap.exists()) {
            return { success: false, error: "Selected trainer not found." };
        }
        
        const trainerData = trainerSnap.data();

        await updateDoc(customerRef, {
            approvalStatus: 'In Progress', // The trainer needs to accept
            assignedTrainerId: trainerId,
            assignedTrainerName: trainerData.name,
        });

        revalidatePath('/');
        return { success: true };

    } catch (error: any) {
        console.error("Error assigning trainer:", error);
        return { success: false, error: "An unexpected server error occurred during assignment." };
    }
};
