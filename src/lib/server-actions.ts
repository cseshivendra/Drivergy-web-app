
'use server';

import { z } from 'zod';
import { RegistrationFormSchema, FullCustomerDetailsSchema } from '@/types';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { adminAuth, adminDb } from './firebase/admin';
import type { ApprovalStatusType, UserProfile } from '@/types';
import { format } from 'date-fns';

const initializeCloudinary = async () => {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
        console.warn("Cloudinary environment variables not fully set. File uploads will fail.");
    }
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });
};

const uploadFileToCloudinary = async (fileBuffer: Buffer, folder: string): Promise<string> => {
    await initializeCloudinary();
    
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

export async function registerUserAction(prevState: any, formData: FormData): Promise<{ success: boolean; error?: string }> {
    if (!adminAuth || !adminDb) {
        const errorMessage = "Firebase Admin SDK is not initialized on the server. Check server logs and environment variables.";
        console.error("registerUserAction:", errorMessage);
        return { success: false, error: errorMessage };
    }

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
            console.error("Zod validation failed:", errorMessages);
            return { success: false, error: `Invalid form data: ${errorMessages}` };
        }

        const validatedData = validationResult.data;
        const { email, password, name, userRole } = validatedData;
        
        const existingUser = await adminAuth.getUserByEmail(email).catch(() => null);
        if (existingUser) {
            return { success: false, error: "A user is already registered with this email." };
        }
        
        const userRecord = await adminAuth.createUser({ email, password, displayName: name, emailVerified: false });
        const uid = userRecord.uid;

        const targetCollection = userRole === 'customer' ? 'customers' : 'trainers';
        const userRef = doc(adminDb, targetCollection, uid);

        const fileUrls: { [key: string]: string | null } = {};
        
        let newUserProfileData: Omit<UserProfile, 'id'>;

        if (userRole === 'trainer') {
            const trainerData = validatedData as z.infer<typeof import('@/types').TrainerRegistrationFormSchema>;
            const fileUploadPromises = [];
             if (trainerData.trainerCertificateFile && trainerData.trainerCertificateFile.size > 0) {
                fileUploadPromises.push(uploadFileToCloudinary(Buffer.from(await trainerData.trainerCertificateFile.arrayBuffer()), `user_documents`).then(url => { fileUrls['trainerCertificateUrl'] = url; }));
            }
             if (trainerData.drivingLicenseFile && trainerData.drivingLicenseFile.size > 0) {
                fileUploadPromises.push(uploadFileToCloudinary(Buffer.from(await trainerData.drivingLicenseFile.arrayBuffer()), `user_documents`).then(url => { fileUrls['drivingLicenseUrl'] = url; }));
            }
             if (trainerData.aadhaarCardFile && trainerData.aadhaarCardFile.size > 0) {
                fileUploadPromises.push(uploadFileToCloudinary(Buffer.from(await trainerData.aadhaarCardFile.arrayBuffer()), `user_documents`).then(url => { fileUrls['aadhaarCardUrl'] = url; }));
            }
            await Promise.all(fileUploadPromises);

            newUserProfileData = {
                uniqueId: `TR-${uid.slice(-6).toUpperCase()}`,
                name: trainerData.name,
                username: trainerData.username,
                contact: trainerData.email,
                phone: trainerData.phone,
                gender: trainerData.gender,
                location: trainerData.location,
                subscriptionPlan: "Trainer",
                registrationTimestamp: format(new Date(), 'MMM dd, yyyy'),
                approvalStatus: 'Pending',
                photoURL: `https://placehold.co/100x100.png?text=${trainerData.name.charAt(0)}`,
                myReferralCode: `${trainerData.name.split(' ')[0].toUpperCase()}${uid.slice(-4)}`,
                vehicleInfo: trainerData.trainerVehicleType,
                specialization: trainerData.specialization,
                yearsOfExperience: Number(trainerData.yearsOfExperience),
                trainerCertificateUrl: fileUrls.trainerCertificateUrl || '',
                drivingLicenseUrl: fileUrls.drivingLicenseUrl || '',
                aadhaarCardUrl: fileUrls.aadhaarCardUrl || '',
            };
        } else {
             const customerData = validatedData as z.infer<typeof import('@/types').CustomerRegistrationFormSchema>;
             newUserProfileData = {
                uniqueId: `CU-${uid.slice(-6).toUpperCase()}`,
                name: customerData.name,
                username: customerData.username,
                contact: customerData.email,
                phone: customerData.phone,
                gender: customerData.gender,
                location: 'TBD',
                subscriptionPlan: "None",
                registrationTimestamp: format(new Date(), 'MMM dd, yyyy'),
                approvalStatus: 'Pending',
                photoURL: `https://placehold.co/100x100.png?text=${customerData.name.charAt(0)}`,
                myReferralCode: `${customerData.name.split(' ')[0].toUpperCase()}${uid.slice(-4)}`,
                trainerPreference: customerData.trainerPreference || 'Any',
            };
        }

        await setDoc(userRef, newUserProfileData);
        return { success: true };

    } catch (error: any) {
        console.error("Error in registerUserAction:", error);
        if (error.code === 'auth/email-already-exists') {
             return { success: false, error: 'A user is already registered with this email.' };
        }
        const errorMessage = error.message || "An unexpected server error occurred.";
        return { success: false, error: errorMessage };
    }
}

export async function verifyAdminCredentials({ username, password }: { username: string, password?: string }): Promise<{ isAdmin: boolean, error?: string }> {
    if (!adminDb) return { isAdmin: false, error: 'Firebase Admin not initialized.' };

    if (username.toLowerCase() !== 'admin' || !password) {
        return { isAdmin: false };
    }
    
    try {
        const adminQuery = query(collection(adminDb, 'admins'), where('username', '==', username.toLowerCase()));
        const querySnapshot = await getDocs(adminQuery);

        if (querySnapshot.empty) {
            console.log("Admin user not found in database.");
            return { isAdmin: false, error: 'Admin user not found.' };
        }

        const adminDoc = querySnapshot.docs[0];
        const adminData = adminDoc.data();

        if (adminData.password === password) {
            return { isAdmin: true };
        } else {
            return { isAdmin: false, error: 'Invalid password.' };
        }
    } catch(e: any) {
        console.error("Error verifying admin credentials:", e);
        return { isAdmin: false, error: `Database error: ${e.message}` };
    }
}


export async function sendPasswordResetLink(email: string): Promise<{ success: boolean; error?: string }> {
    console.log(`A password reset link would be sent to ${email} if email services were configured.`);
    return { success: true };
}

interface UpdateStatusArgs {
    userId: string;
    newStatus: ApprovalStatusType;
}

export async function updateUserApprovalStatus({ userId, newStatus }: UpdateStatusArgs): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: 'Firebase Admin not initialized.' };

    if (!userId) {
        return { success: false, error: 'User ID is missing.' };
    }

    try {
        const collections = ['customers', 'trainers'];
        let userRef;

        for (const col of collections) {
            const ref = doc(adminDb, col, userId);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                userRef = ref;
                break;
            }
        }
        
        if (!userRef) {
            return { success: false, error: 'User not found in any collection.' };
        }

        await updateDoc(userRef, { approvalStatus: newStatus });
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating user ${userId} status on server:`, error);
        return { success: false, error: error.message || 'An unexpected server error occurred.' };
    }
}

export const completeCustomerProfileAction = async (userId: string, formData: FormData): Promise<{ success: boolean, error?: string }> => {
    if (!adminDb) return { success: false, error: 'Firebase Admin not initialized.' };
    
    if (!userId) {
        return { success: false, error: 'User ID is missing.' };
    }

    try {
        const data = Object.fromEntries(formData.entries());
        
        const file = formData.get('photoIdFile') as File | null;
        if (!file || file.size === 0) {
             return { success: false, error: 'Photo ID file is required.' };
        }

        const validationResult = FullCustomerDetailsSchema.safeParse({ ...data, photoIdFile: file });
         if (!validationResult.success) {
            const errorMessages = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            return { success: false, error: `Invalid form data: ${errorMessages}` };
        }
        
        const validatedData = validationResult.data;
        const buffer = await validatedData.photoIdFile.arrayBuffer();
        const photoIdUrl = await uploadFileToCloudinary(Buffer.from(buffer), `user_documents/${userId}`);

        const getLessonsForPlan = (plan: string): number => ({ Premium: 20, Gold: 15, Basic: 10 }[plan] || 0);

        const profileData = {
            subscriptionPlan: validatedData.subscriptionPlan,
            vehiclePreference: validatedData.vehiclePreference,
            trainerPreference: validatedData.trainerPreference,
            flatHouseNumber: validatedData.flatHouseNumber,
            street: validatedData.street,
            district: validatedData.district,
            state: validatedData.state,
            pincode: validatedData.pincode,
            location: validatedData.district,
            dlStatus: validatedData.dlStatus,
            dlNumber: validatedData.dlNumber || '',
            dlTypeHeld: validatedData.dlTypeHeld || '',
            photoIdType: validatedData.photoIdType,
            photoIdNumber: validatedData.photoIdNumber,
            photoIdUrl: photoIdUrl,
            subscriptionStartDate: format(validatedData.subscriptionStartDate, 'MMM dd, yyyy'),
            totalLessons: getLessonsForPlan(validatedData.subscriptionPlan),
            completedLessons: 0,
            approvalStatus: 'Pending' as ApprovalStatusType,
        };

        const userRef = doc(adminDb, 'customers', userId);
        const customerDoc = await getDoc(userRef);
        if (!customerDoc.exists()) {
            return { success: false, error: 'Customer profile not found.' };
        }

        await updateDoc(userRef, profileData);
        
        // After updating the profile, create the lesson request
        const lessonRequestData = {
            customerId: userId,
            customerName: customerDoc.data()?.name,
            vehicleType: validatedData.vehiclePreference,
            status: 'Pending' as const,
            requestTimestamp: new Date().toISOString(),
        };
        await addDoc(collection(adminDb, 'lessonRequests'), lessonRequestData);


        return { success: true };
    } catch (error: any) {
        console.error("Error completing customer profile:", error);
        return { success: false, error: error.message || 'An unexpected error occurred during profile update.' };
    }
};
