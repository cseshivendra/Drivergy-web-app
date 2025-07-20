
'use server';

/**
 * @fileOverview This file contains all the server actions that interact with the database.
 * Client components should import and use these functions instead of calling mock-data functions directly.
 * This pattern ensures that server-side logic is not improperly bundled with client-side code.
 */

import type { User as FirebaseUser } from 'firebase/auth';
import type {
    UserProfile,
    CustomerRegistrationFormValues,
    TrainerRegistrationFormValues,
    UserProfileUpdateValues,
    FullCustomerDetailsValues,
} from '@/types';
import {
    authenticateUserByCredentials as _authenticateUserByCredentials,
    fetchUserById as _fetchUserById,
    addCustomer as _addCustomer,
    addTrainer as _addTrainer,
    updateUserProfile as _updateUserProfile,
    changeUserPassword as _changeUserPassword,
    completeCustomerProfile as _completeCustomerProfile,
} from '@/lib/mock-data';

// Note: getOrCreateGoogleUser is intentionally removed from here.
// It's now handled entirely within mock-data.ts to avoid client-side server function calls.

export async function authenticateUserByCredentials(username: string, password: string): Promise<UserProfile | null> {
    return _authenticateUserByCredentials(username, password);
}

export async function fetchUserById(userId: string): Promise<UserProfile | null> {
    return _fetchUserById(userId);
}

export async function addCustomer(data: CustomerRegistrationFormValues): Promise<UserProfile | null> {
    return _addCustomer(data);
}

export async function addTrainer(data: TrainerRegistrationFormValues): Promise<UserProfile | null> {
    return _addTrainer(data);
}

export async function updateUserProfile(userId: string, data: UserProfileUpdateValues): Promise<UserProfile | null> {
    return _updateUserProfile(userId, data);
}

export async function changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    return _changeUserPassword(userId, currentPassword, newPassword);
}

export async function completeCustomerProfile(userId: string, data: FullCustomerDetailsValues): Promise<boolean> {
    return _completeCustomerProfile(userId, data);
}
