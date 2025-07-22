
'use server';

import { doc, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import type { ApprovalStatusType } from '@/types';
import { revalidatePath } from 'next/cache';

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
