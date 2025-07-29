
'use server';

import { doc, updateDoc, getDoc, collection, addDoc, setDoc, query, where, limit, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import type { ApprovalStatusType, TrainerRegistrationFormValues, FullCustomerDetailsValues, RegistrationFormValues, CustomerRegistrationFormValues, UserProfile, LessonRequest, VehicleType } from '@/types';
import { revalidatePath } from 'next/cache';
import { sendEmail } from './email';
import { format } from 'date-fns';
import { uploadFileToCloudinary } from './cloudinary';

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
    if (!db) return { success: false, error: "Database not configured." };
    try {
        const data = Object.fromEntries(formData.entries()) as unknown as RegistrationFormValues;

        const usersRef = collection(db, "users");
        const emailQuery = query(usersRef, where("contact", "==", data.email), limit(1));
        const usernameQuery = query(usersRef, where("username", "==", data.username), limit(1));
        const phoneQuery = query(usersRef, where("phone", "==", data.phone), limit(1));
        
        const [emailSnap, usernameSnap, phoneSnap] = await Promise.all([
            getDocs(emailQuery),
            getDocs(usernameQuery),
            getDocs(phoneQuery)
        ]);

        if (!emailSnap.empty || !usernameSnap.empty || !phoneSnap.empty) {
             return { success: false, error: "A user is already registered with this email, username, or phone number." };
        }

        const userRef = doc(collection(db, 'users'));
        if (data.userRole === 'customer') {
            const customerData = data as CustomerRegistrationFormValues;
            const newUser: Omit<UserProfile, 'id'> = {
                uniqueId: `CU-${userRef.id.slice(-6).toUpperCase()}`,
                name: customerData.name, username: customerData.username, password: customerData.password,
                contact: customerData.email, phone: customerData.phone, gender: customerData.gender,
                location: 'TBD', subscriptionPlan: "None",
                registrationTimestamp: format(new Date(), 'MMM dd, yyyy'),
                approvalStatus: 'Pending', photoURL: `https://placehold.co/100x100.png?text=${customerData.name.charAt(0)}`,
                myReferralCode: `${customerData.name.split(' ')[0].toUpperCase()}${userRef.id.slice(-4)}`,
                trainerPreference: customerData.trainerPreference || 'Any',
            };
            await setDoc(userRef, newUser);
        } else if (data.userRole === 'trainer') {
            const trainerData = data as TrainerRegistrationFormValues;
            const certFile = formData.get('trainerCertificateFile') as File | null;
            const dlFile = formData.get('drivingLicenseFile') as File | null;
            const aadhaarFile = formData.get('aadhaarCardFile') as File | null;
            if (!certFile || !dlFile || !aadhaarFile) return { success: false, error: "One or more required documents were not uploaded." };
            
            const [certUrl, dlUrl, aadhaarUrl] = await Promise.all([
                uploadFile(certFile, `trainer_documents/${userRef.id}`),
                uploadFile(dlFile, `trainer_documents/${userRef.id}`),
                uploadFile(aadhaarFile, `trainer_documents/${userRef.id}`),
            ]);

            const newTrainer: Omit<UserProfile, 'id'> = {
                uniqueId: `TR-${userRef.id.slice(-6).toUpperCase()}`,
                name: trainerData.name, username: trainerData.username,
                contact: trainerData.email, phone: trainerData.phone, gender: trainerData.gender,
                password: trainerData.password, location: trainerData.location,
                subscriptionPlan: "Trainer", registrationTimestamp: format(new Date(), 'MMM dd, yyyy'),
                approvalStatus: 'Pending', photoURL: `https://placehold.co/100x100.png?text=${trainerData.name.charAt(0)}`,
                myReferralCode: `${trainerData.name.split(' ')[0].toUpperCase()}${userRef.id.slice(-4)}`,
                vehicleInfo: trainerData.trainerVehicleType, specialization: trainerData.specialization,
                yearsOfExperience: Number(trainerData.yearsOfExperience),
                trainerCertificateUrl: certUrl,
                drivingLicenseUrl: dlUrl,
                aadhaarCardUrl: aadhaarUrl,
            };
            await setDoc(userRef, newTrainer);
        }

        revalidatePath('/register');
        revalidatePath('/');
        return { success: true };

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

    