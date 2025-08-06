
'use server';

import { z } from 'zod';
import { RegistrationFormSchema, FullCustomerDetailsSchema } from '@/types';
import type { UserProfile, ApprovalStatusType, PayoutStatusType, RescheduleRequestStatusType, UserProfileUpdateValues } from '@/types';
import { allUsers, fetchUserById, updateUserInMockDB } from './mock-data';
import { format } from 'date-fns';

// =================================================================
// MOCK SERVER ACTIONS - NO DATABASE INTERACTION
// =================================================================

export async function registerUserAction(prevState: any, formData: FormData): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
    console.log("Mock registerUserAction called.");
    try {
        const data = Object.fromEntries(formData.entries());
        const validationResult = RegistrationFormSchema.safeParse(data);

        if (!validationResult.success) {
            const formattedErrors = validationResult.error.format();
            return { success: false, error: 'Invalid form data provided. Please check the fields and try again.' };
        }
        
        const { email, username, userRole } = validationResult.data;
        const existingUser = allUsers.find(u => u.contact.toLowerCase() === email.toLowerCase() || (u.username && u.username.toLowerCase() === username.toLowerCase()));
        if (existingUser) {
            return { success: false, error: 'A user is already registered with this email or username.' };
        }

        const newUser: UserProfile = {
            id: `mock-user-${Date.now()}`,
            uniqueId: `${userRole === 'customer' ? 'CU' : 'TR'}-${Date.now().toString().slice(-6)}`,
            name: validationResult.data.name,
            username: validationResult.data.username,
            contact: validationResult.data.email,
            phone: validationResult.data.phone,
            gender: validationResult.data.gender,
            password: validationResult.data.password, 
            subscriptionPlan: userRole === 'customer' ? 'None' : 'Trainer',
            location: userRole === 'trainer' ? validationResult.data.location : '',
            registrationTimestamp: format(new Date(), 'MMM dd, yyyy'),
            approvalStatus: 'Pending',
        };
        
        if (userRole === 'trainer') {
            Object.assign(newUser, {
                specialization: validationResult.data.specialization,
                yearsOfExperience: validationResult.data.yearsOfExperience,
                vehicleInfo: validationResult.data.trainerVehicleType,
            });
        }
        
        allUsers.push(newUser);
        
        console.log("Simulating successful user registration for:", email);
        console.log("Total users in mock DB:", allUsers.length);
        
        return { success: true, user: newUser };

    } catch (error: any) {
        console.error("Error in mock registerUserAction:", error);
        return { success: false, error: 'An unexpected server error occurred.' };
    }
}

export async function verifyAdminCredentials({ username, password }: { username: string, password?: string }): Promise<{ isAdmin: boolean, error?: string }> {
    console.log("Mock verifyAdminCredentials called.");
    if (username.toLowerCase() === 'admin' && password === 'admin') {
        return { isAdmin: true };
    }
    return { isAdmin: false, error: 'Invalid mock admin credentials.' };
}

export async function sendPasswordResetLink(email: string): Promise<{ success: boolean; error?: string }> {
    console.log(`Simulating password reset link sent to ${email}.`);
    return { success: true };
}

export async function updateUserApprovalStatus({ userId, newStatus }: { userId: string; newStatus: ApprovalStatusType; }): Promise<{ success: boolean; error?: string }> {
    console.log(`Simulating status update for user ${userId} to ${newStatus}.`);
    const user = await fetchUserById(userId);
    if (user) {
        user.approvalStatus = newStatus;
        updateUserInMockDB(user);
        return { success: true };
    }
    return { success: false, error: 'User not found' };
}

export const completeCustomerProfileAction = async (formData: FormData): Promise<{ success: boolean; error?: string; user?: UserProfile }> => {
    try {
        const data = Object.fromEntries(formData.entries());

        const userId = data.userId as string;
        if (!userId) {
            return { success: false, error: 'User ID is missing.' };
        }
        
        let user = await fetchUserById(userId);
        if (!user) {
            return { success: false, error: 'User not found.' };
        }

        if (typeof data.subscriptionStartDate === 'string') {
            data.subscriptionStartDate = new Date(data.subscriptionStartDate);
        }

        const validationResult = FullCustomerDetailsSchema.safeParse(data);

        if (!validationResult.success) {
            console.error("Profile completion validation error:", validationResult.error.format());
            return { success: false, error: "Invalid data submitted. Please check your entries." };
        }

        const profileData = validationResult.data;
        const photoIdUrl = `https://placehold.co/file-mock-path/${Date.now()}.pdf`;

        Object.assign(user, {
            subscriptionPlan: profileData.subscriptionPlan,
            vehicleInfo: profileData.vehiclePreference,
            trainerPreference: profileData.trainerPreference,
            flatHouseNumber: profileData.flatHouseNumber,
            street: profileData.street,
            district: profileData.district,
            state: profileData.state,
            pincode: profileData.pincode,
            dlStatus: profileData.dlStatus,
            dlNumber: profileData.dlNumber,
            dlTypeHeld: profileData.dlTypeHeld,
            photoIdType: profileData.photoIdType,
            photoIdNumber: profileData.photoIdNumber,
            photoIdUrl: photoIdUrl,
            subscriptionStartDate: format(profileData.subscriptionStartDate, 'MMM dd, yyyy'),
            referralCode: profileData.referralCode,
            approvalStatus: 'Pending', 
        });

        updateUserInMockDB(user);
        console.log(`Successfully completed profile for user ${userId}.`);
        
        // Fetch the user again to get the most up-to-date version
        const updatedUser = await fetchUserById(userId);
        return { success: true, user: updatedUser || undefined };

    } catch (error) {
        console.error("Error in completeCustomerProfileAction:", error);
        return { success: false, error: "An unexpected server error occurred." };
    }
};

export async function assignTrainerToCustomer(customerId: string, trainerId: string): Promise<boolean> {
    console.log(`Simulating assignment of trainer ${trainerId} to customer ${customerId}.`);
    const customer = await fetchUserById(customerId);
    const trainer = await fetchUserById(trainerId);
    if (customer && trainer) {
        customer.assignedTrainerId = trainerId;
        customer.assignedTrainerName = trainer.name;
        customer.approvalStatus = 'In Progress';
        updateUserInMockDB(customer);
        return true;
    }
    return false;
};

export async function updateAssignmentStatusByTrainer(customerId: string, newStatus: 'Approved' | 'Rejected'): Promise<boolean> {
    console.log(`Simulating assignment status update for customer ${customerId} to ${newStatus}.`);
    const customer = await fetchUserById(customerId);
    if (customer) {
        customer.approvalStatus = newStatus;
        updateUserInMockDB(customer);
        return true;
    }
    return false;
}

export async function updateUserAttendance(studentId: string, status: 'Present' | 'Absent'): Promise<boolean> {
    console.log(`Simulating attendance update for student ${studentId} to ${status}.`);
    const student = await fetchUserById(studentId);
    if(student){
        student.attendance = status;
        if(status === 'Present'){
            student.completedLessons = (student.completedLessons || 0) + 1;
        }
        updateUserInMockDB(student);
        return true;
    }
    return false;
}

export async function updateSubscriptionStartDate(customerId: string, newDate: Date): Promise<UserProfile | null> {
    console.log(`Simulating subscription start date update for ${customerId}.`);
    const customer = await fetchUserById(customerId);
    if(customer) {
        return customer;
    }
    return null;
}

export async function addRescheduleRequest(userId: string, customerName: string, originalDate: Date, newDate: Date): Promise<any> {
    console.log(`Simulating reschedule request for ${customerName}.`);
    return { success: true };
}

export async function updateRescheduleRequestStatus(requestId: string, newStatus: RescheduleRequestStatusType): Promise<boolean> {
    console.log(`Simulating reschedule request ${requestId} status update to ${newStatus}.`);
    return true;
}

export async function addFeedback(customerId: string, customerName: string, trainerId: string, trainerName: string, rating: number, comment: string): Promise<boolean> {
    console.log(`Simulating feedback submission from ${customerName} for ${trainerName}.`);
    const customer = await fetchUserById(customerId);
    if(customer){
        customer.feedbackSubmitted = true;
        updateUserInMockDB(customer);
    }
    return true;
}

export async function updateReferralPayoutStatus(referralId: string, status: PayoutStatusType): Promise<boolean> {
    console.log(`Simulating referral payout status update for ${referralId} to ${status}.`);
    return true;
}

export async function updateUserProfile(userId: string, data: UserProfileUpdateValues): Promise<UserProfile | null> {
    console.log(`Simulating profile update for user ${userId}.`);
    const user = await fetchUserById(userId);
    if(user){
        Object.assign(user, data);
        updateUserInMockDB(user);
        return user;
    }
    return null;
};


    
