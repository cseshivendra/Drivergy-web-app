
'use server';

import { z } from 'zod';
import { RegistrationFormSchema, FullCustomerDetailsSchema, UserProfileUpdateSchema, ChangePasswordSchema, CourseModuleSchema, QuizQuestionSchema, VisualContentSchema, FaqSchema, BlogPostFormValues, BlogPostSchema } from '@/types';
import type { UserProfile, ApprovalStatusType, PayoutStatusType, RescheduleRequestStatusType, UserProfileUpdateValues, RescheduleRequest, ChangePasswordValues, FullCustomerDetailsValues, CourseModuleFormValues, QuizQuestionFormValues, VisualContentFormValues, FaqFormValues } from '@/types';
import { format, parseISO, addDays } from 'date-fns';
import { adminAuth, adminDb, adminStorage } from './firebase/admin';
import { revalidatePath } from 'next/cache';
import { uploadFileToCloudinary } from './cloudinary';
import { seedPromotionalPosters } from './server-data'; 
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
    
    // Manually construct the data object from FormData
    const rawData: { [key: string]: any } = Object.fromEntries(formData.entries());
    
    // Sanitize and correctly type the data BEFORE validation.
    // This is the key fix for the persistent validation issues.
    const file = formData.get('drivingLicenseFile');
    if (file instanceof File && file.size > 0) {
        rawData.drivingLicenseFile = file;
    } else {
        delete rawData.drivingLicenseFile;
    }
    
    // Now, validate the sanitized data
    const validationResult = RegistrationFormSchema.safeParse(rawData);

    if (!validationResult.success) {
        console.error("Registration validation failed:", validationResult.error.format());
        const firstError = validationResult.error.errors[0]?.message || 'Invalid form data. Please check all fields.';
        return { success: false, error: firstError };
    }
    
    const { email, password, name, phone, userRole, username, gender } = validationResult.data;

    try {
        const usernameQuery = await adminDb.collection('users').where('username', '==', username).limit(1).get();
        if (!usernameQuery.empty) {
            return { success: false, error: 'This username is already taken. Please choose another one.' };
        }
        
        const emailQuery = await adminDb.collection('users').where('contact', '==', email).limit(1).get();
        if (!emailQuery.empty) {
             return { success: false, error: 'A user is already registered with this email address.' };
        }

        let drivingLicenseUrl = '';
        if (userRole === 'trainer') {
            const { drivingLicenseFile } = validationResult.data;
            const buffer = await fileToBuffer(drivingLicenseFile);
            drivingLicenseUrl = await uploadFileToCloudinary(buffer, 'trainer_licenses');
        }
        
        const userRecord = await adminAuth.createUser({
            email: email,
            emailVerified: true,
            password: password,
            displayName: name,
            disabled: false,
        });

        const userProfileData: Omit<UserProfile, 'id'> = {
            uniqueId: `${userRole === 'customer' ? 'CU' : 'TR'}-${userRecord.uid.slice(0, 6).toUpperCase()}`,
            name,
            username,
            contact: email,
            phone,
            gender,
            subscriptionPlan: userRole === 'trainer' ? 'Trainer' : 'None',
            approvalStatus: 'Pending',
            registrationTimestamp: new Date().toISOString(),
        };

        if (userRole === 'trainer') {
            const {
                location, specialization, trainerVehicleType, fuelType, vehicleNumber,
                drivingLicenseNumber
            } = validationResult.data;
            
            Object.assign(userProfileData, {
                location, 
                specialization, 
                vehicleInfo: `${trainerVehicleType} (${fuelType}) - ${vehicleNumber}`,
                drivingLicenseUrl: drivingLicenseUrl,
                drivingLicenseNumber,
            });
        }
        
        await adminDb.collection('users').doc(userRecord.uid).set(userProfileData);
        
        const createdUser: UserProfile = { id: userRecord.uid, ...userProfileData };
        
        revalidatePath('/dashboard');
        revalidatePath('/login');

        return { success: true, user: createdUser };

    } catch (error: any) {
        console.error("Error in registerUserAction:", error);
        if (error.code === 'auth/email-already-exists') {
            return { success: false, error: 'A user is already registered with this email address.' };
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
        // Do not reveal if an email exists or not for security reasons.
        // Always return success to the client.
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
        data.subscriptionStartDate = new Date(data.subscriptionStartDate as string);
        const validationResult = FullCustomerDetailsSchema.safeParse(data);

        if (!validationResult.success) {
            console.error("Profile completion validation failed:", validationResult.error.format());
            return { success: false, error: "Invalid form data. Please check all fields." };
        }

        const { userId, photoIdFile, ...profileData } = validationResult.data;
        
        const photoIdUrl = await uploadFileToCloudinary(await fileToBuffer(photoIdFile), 'customer_documents');
        
        const userRef = adminDb.collection('users').doc(userId);
        await userRef.update({ 
            ...profileData, 
            subscriptionStartDate: format(profileData.subscriptionStartDate, 'MMM dd, yyyy'),
            photoIdUrl,
            approvalStatus: 'In Progress' 
        });

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
  const updatedData = { id: updatedDoc.id, ...updatedDoc.data() };
  if (updatedData.registrationTimestamp && typeof updatedData.registrationTimestamp.toDate === 'function') {
      updatedData.registrationTimestamp = updatedData.registrationTimestamp.toDate().toISOString();
  }
  return updatedData as UserProfile;
}

export async function changeUserPassword(userId: string, currentPass: string, newPass: string): Promise<boolean> {
   if (!adminAuth) {
        console.error("Auth not configured.");
        return false;
    }
    console.warn("Server-side password change is not recommended without re-authentication.");
    return false;
}

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
    revalidatePath('/blog');
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
    revalidatePath('/blog');
    revalidatePath(`/blog/${slug}`);
    return true;
}

export async function deleteBlogPost(slug: string): Promise<boolean> {
    if (!adminDb) return false;
    await adminDb.collection('blog').doc(slug).delete();
    revalidatePath('/dashboard');
    revalidatePath('/blog');
    return true;
}

export async function addCourseModule(courseId: string, formData: FormData): Promise<boolean> {
    if (!adminDb) return false;
    
    const data = Object.fromEntries(formData.entries());
    const validationResult = CourseModuleSchema.safeParse(data);
    if (!validationResult.success) return false;

    const { videoFile, ...moduleData } = validationResult.data;
    let videoUrl = moduleData.recordedLectureLink || '';

    if (videoFile) {
        videoUrl = await uploadFileToCloudinary(await fileToBuffer(videoFile), 'course_videos');
    }

    const courseRef = adminDb.collection('courses').doc(courseId);
    const courseDoc = await courseRef.get();
    if (!courseDoc.exists) return false;

    const newModule = { ...moduleData, recordedLectureLink: videoUrl, id: uuidv4() };
    const modules = courseDoc.data()?.modules || [];
    modules.push(newModule);

    await courseRef.update({ modules });
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/courses');
    return true;
}

export async function updateCourseModule(courseId: string, moduleId: string, formData: FormData): Promise<boolean> {
    if (!adminDb) return false;

    const data = Object.fromEntries(formData.entries());
    const validationResult = CourseModuleSchema.safeParse(data);
    if (!validationResult.success) return false;

    const { videoFile, ...moduleData } = validationResult.data;
    let videoUrl = moduleData.recordedLectureLink || '';

    if (videoFile) {
        videoUrl = await uploadFileToCloudinary(await fileToBuffer(videoFile), 'course_videos');
    }
    
    const courseRef = adminDb.collection('courses').doc(courseId);
    const courseDoc = await courseRef.get();
    if (!courseDoc.exists) return false;
    
    let modules = courseDoc.data()?.modules || [];
    const moduleIndex = modules.findIndex((m: any) => m.id === moduleId);

    if (moduleIndex === -1) return false;
    modules[moduleIndex] = { ...modules[moduleIndex], ...moduleData, recordedLectureLink: videoUrl };
    
    await courseRef.update({ modules });
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/courses');
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
    revalidatePath('/dashboard/courses');
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
        options: { en: data.options_en.split('\\n'), hi: data.options_hi.split('\\n') },
        correctAnswer: { en: data.correctAnswer_en, hi: data.correctAnswer_hi },
    };

    await quizSetRef.update({ questions });
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/rto-quiz');
    return true;
}

export async function addFaq(data: FaqFormValues): Promise<boolean> {
    if (!adminDb) return false;
    await adminDb.collection('faqs').add({ ...data, id: uuidv4() });
    revalidatePath('/dashboard');
    revalidatePath('/faq');
    return true;
}

export async function updateFaq(faqId: string, data: FaqFormValues): Promise<boolean> {
    if (!adminDb) return false;
    const faqQuery = await adminDb.collection('faqs').where('id', '==', faqId).limit(1).get();
    if (faqQuery.empty) return false;
    await faqQuery.docs[0].ref.update(data);
    revalidatePath('/dashboard');
    revalidatePath('/faq');
    return true;
}

export async function deleteFaq(faqId: string): Promise<boolean> {
    if (!adminDb) return false;
    const faqQuery = await adminDb.collection('faqs').where('id', '==', faqId).limit(1).get();
    if (faqQuery.empty) return false;
    await faqQuery.docs[0].ref.delete();
    revalidatePath('/dashboard');
    revalidatePath('/faq');
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
    revalidatePath('/');
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
    revalidatePath('/');
    return true;
}

export async function updateAssignmentStatusByTrainer(studentId: string, newStatus: 'Approved' | 'Rejected'): Promise<boolean> {
  if (!adminDb) return false;
  const studentRef = adminDb.collection('users').doc(studentId);
  await studentRef.update({ approvalStatus: newStatus });
  if (newStatus === 'Approved') {
  }
  revalidatePath('/dashboard');
  return true;
}


export async function updateUserAttendance(studentId: string, status: 'Present' | 'Absent'): Promise<boolean> {
  if (!adminDb) return false;
  const studentRef = adminDb.collection('users').doc(studentId);
  const studentDoc = await studentRef.get();
  if (!studentDoc.exists) return false;

  const currentCompleted = studentDoc.data()?.completedLessons || 0;
  const newCompleted = status === 'Present' ? currentCompleted + 1 : currentCompleted;

  await studentRef.update({
    attendance: status,
    completedLessons: newCompleted,
    upcomingLesson: null,
  });

  revalidatePath('/dashboard');
  return true;
}


export async function updateSubscriptionStartDate(customerId: string, newDate: Date): Promise<UserProfile | null> {
    if (!adminDb) return null;
    const userRef = adminDb.collection('users').doc(customerId);
    
    const lessonDate = addDays(newDate, 1);
    
    await userRef.update({
        subscriptionStartDate: format(newDate, 'MMM dd, yyyy'),
        upcomingLesson: format(lessonDate, 'MMM dd, yyyy, h:mm a')
    });
    const updatedDoc = await userRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() } as UserProfile;
}

export async function addRescheduleRequest(userId: string, customerName: string, originalDate: Date, newDate: Date): Promise<boolean> {
    if (!adminDb) return false;
    
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return false;
    
    const trainerId = userDoc.data()?.assignedTrainerId;
    if (!trainerId) return false;

    const request: Omit<RescheduleRequest, 'id' | 'requestTimestamp'> = {
        userId,
        customerName,
        trainerId,
        originalLessonDate: originalDate.toISOString(),
        requestedRescheduleDate: newDate.toISOString(),
        status: 'Pending'
    };

    await adminDb.collection('rescheduleRequests').add({
      ...request,
      requestTimestamp: new Date(),
    });

    revalidatePath('/dashboard');
    return true;
}


export async function updateRescheduleRequestStatus(requestId: string, newStatus: RescheduleRequestStatusType): Promise<boolean> {
    if (!adminDb) return false;
    const requestRef = adminDb.collection('rescheduleRequests').doc(requestId);
    await requestRef.update({ status: newStatus });
    
    if (newStatus === 'Approved') {
        const requestDoc = await requestRef.get();
        const requestData = requestDoc.data();
        if (requestData) {
            const userRef = adminDb.collection('users').doc(requestData.userId);
            await userRef.update({ upcomingLesson: requestData.requestedRescheduleDate });
        }
    }
    revalidatePath('/dashboard');
    return true;
}


export async function addFeedback(customerId: string, customerName: string, trainerId: string, trainerName: string, rating: number, comment: string): Promise<boolean> {
    if (!adminDb) return false;
    await adminDb.collection('feedback').add({
        customerId,
        customerName,
        trainerId,
        trainerName,
        rating,
        comment,
        submissionDate: new Date(),
    });
    
    await adminDb.collection('users').doc(customerId).update({ feedbackSubmitted: true });

    revalidatePath('/dashboard');
    return true;
}

export async function updateReferralPayoutStatus(referralId: string, status: PayoutStatusType): Promise<boolean> {
    if (!adminDb) return false;
    await adminDb.collection('referrals').doc(referralId).update({ payoutStatus: status });
    revalidatePath('/dashboard');
    return true;
}

export async function assignTrainerToCustomer(customerId: string, trainerId: string): Promise<boolean> {
    if (!adminDb) return false;
    
    const customerRef = adminDb.collection('users').doc(customerId);
    const trainerRef = adminDb.collection('users').doc(trainerId);

    const [customerDoc, trainerDoc] = await Promise.all([customerRef.get(), trainerRef.get()]);

    if (!customerDoc.exists || !trainerDoc.exists) return false;

    const customerData = customerDoc.data();
    const trainerData = trainerDoc.data();

    if (!customerData || !trainerData) return false;

    const subscriptionPlan = customerData.subscriptionPlan;
    let totalLessons = 0;
    if (subscriptionPlan === 'Basic') totalLessons = 10;
    else if (subscriptionPlan === 'Gold') totalLessons = 15;
    else if (subscriptionPlan === 'Premium') totalLessons = 20;

    const startDate = customerData.subscriptionStartDate ? parseISO(customerData.subscriptionStartDate) : new Date();

    await customerRef.update({
        approvalStatus: 'Approved',
        assignedTrainerId: trainerId,
        assignedTrainerName: trainerData.name,
        assignedTrainerPhone: trainerData.phone,
        assignedTrainerVehicleDetails: trainerData.vehicleInfo,
        totalLessons: totalLessons,
        completedLessons: 0,
        upcomingLesson: format(addDays(startDate, 1), "MMM dd, yyyy, '09:00 AM'"),
    });

    revalidatePath('/dashboard');
    return true;
}


export async function getLoginUser(identifier: string): Promise<{ success: boolean, user?: UserProfile, error?: string, code?: string }> {
    if (!adminDb) {
        console.error("Admin DB not initialized.");
        return { success: false, error: "Server not configured." };
    }
    
    try {
        let userQuery;

        if (identifier.includes('@')) {
            userQuery = adminDb.collection('users').where('contact', '==', identifier).limit(1);
        } else {
            userQuery = adminDb.collection('users').where('username', '==', identifier).limit(1);
        }

        const userQuerySnapshot = await userQuery.get();

        if (userQuerySnapshot.empty) {
            return { success: false, error: "User not found.", code: 'auth/user-not-found' };
        }
        
        const userDoc = userQuerySnapshot.docs[0];
        const userData = userDoc.data();
        
        if (userData.registrationTimestamp && typeof userData.registrationTimestamp.toDate === 'function') {
            userData.registrationTimestamp = userData.registrationTimestamp.toDate().toISOString();
        }
        
        return { success: true, user: { id: userDoc.id, ...userData } as UserProfile };

    } catch (error) {
        console.error("Error in getLoginUser server action:", error);
        return { success: false, error: "An unexpected error occurred." };
    }
}
