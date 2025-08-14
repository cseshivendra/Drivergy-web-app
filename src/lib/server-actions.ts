
'use server';

import { z } from 'zod';
import { RegistrationFormSchema, FullCustomerDetailsSchema, UserProfileUpdateSchema, ChangePasswordSchema, CourseModuleSchema, QuizQuestionSchema, VisualContentSchema, FaqSchema, BlogPostFormValues, BlogPostSchema } from '@/types';
import type { UserProfile, ApprovalStatusType, PayoutStatusType, RescheduleRequestStatusType, UserProfileUpdateValues, RescheduleRequest, ChangePasswordValues, FullCustomerDetailsValues, CourseModuleFormValues, QuizQuestionFormValues, VisualContentFormValues, FaqFormValues } from '@/types';
import { format, parseISO } from 'date-fns';
import { adminAuth, adminDb, adminStorage } from './firebase/admin';
import { revalidatePath } from 'next/cache';
import { uploadFileToCloudinary } from './cloudinary';
import { seedPromotionalPosters } from './server-data'; // Import the seeder
import { v4 as uuidv4 } from 'uuid';

// Helper to convert file to buffer
async function fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

// =================================================================
// LIVE SERVER ACTIONS - Interacts with Firebase Admin SDK
// =================================================================

export async function registerUserAction(prevState: any, formData: FormData): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
    if (!adminAuth || !adminDb) {
        return { success: false, error: "Server is not configured for authentication." };
    }

    // --- FIX: Trigger seeding on first registration attempt ---
    await seedPromotionalPosters();
    // ---------------------------------------------------------

    try {
        const data = Object.fromEntries(formData.entries());
        
        // Handle file inputs for Zod validation
        const fileFields = ['trainerCertificateFile', 'drivingLicenseFile', 'aadhaarCardFile'];
        fileFields.forEach(field => {
            if (formData.has(field)) {
                data[field] = formData.get(field) as File;
            }
        });

        const validationResult = RegistrationFormSchema.safeParse(data);

        if (!validationResult.success) {
            console.error("Registration validation failed:", validationResult.error.format());
            // Zod's error messages are detailed. Let's return a specific one if possible.
            const firstError = validationResult.error.errors[0]?.message || 'Invalid form data. Please check all fields.';
            return { success: false, error: firstError };
        }
        
        const { email, password, name, phone, userRole, username, gender } = validationResult.data;

        // Create user in Firebase Auth
        const userRecord = await adminAuth.createUser({
            email: email,
            emailVerified: false,
            password: password,
            displayName: name,
            disabled: false,
        });

        // Base user profile
        let newUserProfile: Omit<UserProfile, 'id' | 'registrationTimestamp'> = {
            uniqueId: `${userRole === 'customer' ? 'CU' : 'TR'}-${userRecord.uid.slice(0, 6).toUpperCase()}`,
            name: name,
            username: username,
            contact: email,
            phone: phone,
            gender: gender,
            subscriptionPlan: userRole === 'trainer' ? 'Trainer' : 'None',
            approvalStatus: 'Pending',
        };

        // Add trainer-specific fields
        if (userRole === 'trainer' && 'location' in validationResult.data) {
            const {
                location, yearsOfExperience, specialization, trainerVehicleType, fuelType, vehicleNumber,
                trainerCertificateNumber, drivingLicenseNumber, aadhaarCardNumber,
                trainerCertificateFile, drivingLicenseFile, aadhaarCardFile
            } = validationResult.data;

            // Upload files to Cloudinary
            const [certUrl, dlUrl, aadhaarUrl] = await Promise.all([
                uploadFileToCloudinary(await fileToBuffer(trainerCertificateFile), 'trainer_documents'),
                uploadFileToCloudinary(await fileToBuffer(drivingLicenseFile), 'trainer_documents'),
                uploadFileToCloudinary(await fileToBuffer(aadhaarCardFile), 'trainer_documents')
            ]);
            
            Object.assign(newUserProfile, {
                location, specialization, yearsOfExperience, vehicleInfo: `${trainerVehicleType} (${fuelType}) - ${vehicleNumber}`,
                licenseNumber: drivingLicenseNumber, // Re-check if this is the correct mapping
                trainerCertificateUrl: certUrl,
                drivingLicenseUrl: dlUrl,
                aadhaarCardUrl: aadhaarUrl,
                // store numbers as well if needed
            });
        }

        // Add registration timestamp using Firestore's server time
        const finalProfile = {
            ...newUserProfile,
            registrationTimestamp: new Date().toISOString(), // Use ISO string for consistency
        };

        await adminDb.collection('users').doc(userRecord.uid).set(finalProfile);
        
        const createdUser: UserProfile = { id: userRecord.uid, ...finalProfile };
        
        revalidatePath('/dashboard');

        return { success: true, user: createdUser };

    } catch (error: any) {
        console.error("Error in registerUserAction:", error);
        if (error.code === 'auth/email-already-exists') {
            return { success: false, error: 'A user is already registered with this email address.' };
        }
        if (error.code === 'auth/username-already-exists') {
            return { success: false, error: 'This username is already taken. Please choose another one.' };
        }
        return { success: false, error: error.message || 'An unexpected server error occurred during registration.' };
    }
}


export async function sendPasswordResetLink(email: string): Promise<{ success: boolean; error?: string }> {
    if (!adminAuth) {
         return { success: false, error: "Server is not configured for authentication." };
    }
    try {
        await adminAuth.generatePasswordResetLink(email);
        return { success: true };
    } catch (error: any) {
        console.error("Password reset error:", error);
        return { success: true };
    }
}

export async function updateUserApprovalStatus({ userId, newStatus }: { userId: string; newStatus: ApprovalStatusType; }): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: "Database not configured." };
    
    try {
        const userRef = adminDb.collection('users').doc(userId);
        await userRef.update({ approvalStatus: newStatus });
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating user ${userId} status:`, error);
        return { success: false, error: "Failed to update user status." };
    }
}

export async function completeCustomerProfileAction(prevState: any, formData: FormData): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
    if (!adminDb) {
        return { success: false, error: "Server not configured." };
    }
    
    try {
        const data = Object.fromEntries(formData.entries());
        data.photoIdFile = formData.get('photoIdFile') as File;
        const validationResult = FullCustomerDetailsSchema.safeParse(data);

        if (!validationResult.success) {
            console.error("Profile completion validation failed:", validationResult.error.format());
            return { success: false, error: "Invalid form data. Please check all fields." };
        }

        const { userId, photoIdFile, ...profileData } = validationResult.data;
        
        const photoIdUrl = await uploadFileToCloudinary(await fileToBuffer(photoIdFile), 'customer_documents');
        
        const userRef = adminDb.collection('users').doc(userId);
        await userRef.update({ ...profileData, photoIdUrl, approvalStatus: 'In Progress' });

        const updatedDoc = await userRef.get();
        const updatedUser = { id: updatedDoc.id, ...updatedDoc.data() } as UserProfile;
        
        revalidatePath('/dashboard');
        return { success: true, user: updatedUser };

    } catch(error: any) {
        console.error("Error completing customer profile:", error);
        return { success: false, error: "An unexpected error occurred." };
    }
}

export async function updateUserProfile(userId: string, data: UserProfileUpdateValues): Promise<UserProfile | null> {
  if (!adminDb) return null;
  const { photo, ...profileData } = data;
  const updatePayload: { [key: string]: any } = { ...profileData };

  if (photo) {
    const photoBuffer = await fileToBuffer(photo);
    const photoURL = await uploadFileToCloudinary(photoBuffer, 'profile_pictures');
    updatePayload.photoURL = photoURL;
  }

  const userRef = adminDb.collection('users').doc(userId);
  await userRef.update(updatePayload);
  const updatedDoc = await userRef.get();
  
  revalidatePath('/dashboard/profile');
  return { id: updatedDoc.id, ...updatedDoc.data() } as UserProfile;
}

export async function changeUserPassword(userId: string, currentPass: string, newPass: string): Promise<boolean> {
   if (!adminAuth) {
        console.error("Auth not configured.");
        return false;
    }
    // This is complex to do securely from a server action without the user's active session.
    // The recommended approach is to use the Firebase client SDK's `reauthenticateWithCredential`
    // and `updatePassword` methods on the client side. This server action is a placeholder.
    // A real implementation would require a custom auth flow.
    console.warn("Server-side password change is not recommended without re-authentication.");
    return false;
}

// And so on... other server actions would be implemented here using adminDb and adminAuth


export async function addBlogPost(data: BlogPostFormValues): Promise<boolean> {
    if (!adminDb) return false;
    const { slug, imageFile, ...postData } = data;
    let imageUrl = postData.imageSrc || '';

    if (imageFile) {
        const imageBuffer = await fileToBuffer(imageFile);
        imageUrl = await uploadFileToCloudinary(imageBuffer, 'blog_images');
    }

    await adminDb.collection('blog').doc(slug).set({ ...postData, imageSrc: imageUrl });
    revalidatePath('/dashboard');
    return true;
}

export async function updateBlogPost(slug: string, data: BlogPostFormValues): Promise<boolean> {
    if (!adminDb) return false;
    const { imageFile, ...postData } = data;
    let imageUrl = postData.imageSrc || '';

    if (imageFile) {
        const imageBuffer = await fileToBuffer(imageFile);
        imageUrl = await uploadFileToCloudinary(imageBuffer, 'blog_images');
    }

    await adminDb.collection('blog').doc(slug).update({ ...postData, imageSrc: imageUrl });
    revalidatePath('/dashboard');
    return true;
}

export async function deleteBlogPost(slug: string): Promise<boolean> {
    if (!adminDb) return false;
    await adminDb.collection('blog').doc(slug).delete();
    revalidatePath('/dashboard');
    return true;
}

export async function addCourseModule(courseId: string, moduleData: CourseModuleFormValues): Promise<boolean> {
    if (!adminDb) return false;
    const courseRef = adminDb.collection('courses').doc(courseId);
    const courseDoc = await courseRef.get();
    if (!courseDoc.exists) return false;

    const newModule = { ...moduleData, id: uuidv4() };
    const modules = courseDoc.data()?.modules || [];
    modules.push(newModule);

    await courseRef.update({ modules });
    revalidatePath('/dashboard');
    return true;
}

export async function updateCourseModule(courseId: string, moduleId: string, moduleData: CourseModuleFormValues): Promise<boolean> {
    if (!adminDb) return false;
    const courseRef = adminDb.collection('courses').doc(courseId);
    const courseDoc = await courseRef.get();
    if (!courseDoc.exists) return false;
    
    let modules = courseDoc.data()?.modules || [];
    const moduleIndex = modules.findIndex((m: any) => m.id === moduleId);

    if (moduleIndex === -1) return false;
    modules[moduleIndex] = { ...modules[moduleIndex], ...moduleData };
    
    await courseRef.update({ modules });
    revalidatePath('/dashboard');
    return true;
}

export async function deleteCourseModule(courseId: string, moduleId: string): Promise<boolean> {
    if (!adminDb) return false;
    const courseRef = adminDb.collection('courses').doc(courseId);
    const courseDoc = await courseRef.get();
    if (!courseDoc.exists) return false;

    const modules = courseDoc.data()?.modules || [];
    const updatedModules = modules.filter((m: any) => m.id !== moduleId);
    
    await courseRef.update({ modules: updatedModules });
    revalidatePath('/dashboard');
    return true;
}

export async function updateQuizQuestion(quizSetId: string, questionId: string, data: QuizQuestionFormValues): Promise<boolean> {
    if (!adminDb) return false;
    const quizSetRef = adminDb.collection('quizSets').doc(quizSetId);
    const doc = await quizSetRef.get();
    if (!doc.exists) return false;

    const questions = doc.data()?.questions || [];
    const qIndex = questions.findIndex((q: any) => q.id === questionId);

    if (qIndex === -1) return false;

    questions[qIndex] = {
        id: questionId,
        question: { en: data.question_en, hi: data.question_hi },
        options: { en: data.options_en.split('\n'), hi: data.options_hi.split('\n') },
        correctAnswer: { en: data.correctAnswer_en, hi: data.correctAnswer_hi },
    };

    await quizSetRef.update({ questions });
    revalidatePath('/dashboard');
    return true;
}

export async function addFaq(data: FaqFormValues): Promise<boolean> {
    if (!adminDb) return false;
    await adminDb.collection('faqs').add({ ...data, id: uuidv4() });
    revalidatePath('/dashboard');
    return true;
}

export async function updateFaq(faqId: string, data: FaqFormValues): Promise<boolean> {
    if (!adminDb) return false;
    await adminDb.collection('faqs').doc(faqId).update(data);
    revalidatePath('/dashboard');
    return true;
}

export async function deleteFaq(faqId: string): Promise<boolean> {
    if (!adminDb) return false;
    await adminDb.collection('faqs').doc(faqId).delete();
    revalidatePath('/dashboard');
    return true;
}

export async function updateSiteBanner(bannerId: string, data: VisualContentFormValues): Promise<boolean> {
    if (!adminDb) return false;
    const { imageFile, ...bannerData } = data;
    let imageUrl = bannerData.imageSrc || '';

    if (imageFile) {
        imageUrl = await uploadFileToCloudinary(await fileToBuffer(imageFile), 'site_banners');
    }
    await adminDb.collection('siteBanners').doc(bannerId).update({ ...bannerData, imageSrc: imageUrl });
    revalidatePath('/dashboard');
    return true;
}

export async function updatePromotionalPoster(posterId: string, data: VisualContentFormValues): Promise<boolean> {
    if (!adminDb) return false;
    const { imageFile, ...posterData } = data;
    let imageUrl = posterData.imageSrc || '';

    if (imageFile) {
        imageUrl = await uploadFileToCloudinary(await fileToBuffer(imageFile), 'promo_posters');
    }
    await adminDb.collection('promotionalPosters').doc(posterId).update({ ...posterData, imageSrc: imageUrl });
    revalidatePath('/dashboard');
    return true;
}

// Mocked functions to be replaced
export async function assignTrainerToCustomer(customerId: string, trainerId: string): Promise<boolean> { return false; }
export async function updateAssignmentStatusByTrainer(customerId: string, newStatus: 'Approved' | 'Rejected'): Promise<boolean> { return false; }
export async function updateUserAttendance(studentId: string, status: 'Present' | 'Absent'): Promise<boolean> { return false; }
export async function updateSubscriptionStartDate(customerId: string, newDate: Date): Promise<UserProfile | null> { return null; }
export async function addRescheduleRequest(userId: string, customerName: string, originalDate: Date, newDate: Date): Promise<boolean> { return false; }
export async function updateRescheduleRequestStatus(requestId: string, newStatus: RescheduleRequestStatusType): Promise<boolean> { return false; }
export async function addFeedback(customerId: string, customerName: string, trainerId: string, trainerName: string, rating: number, comment: string): Promise<boolean> { return false; }
export async function updateReferralPayoutStatus(referralId: string, status: PayoutStatusType): Promise<boolean> { return false; }
