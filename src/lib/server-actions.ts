

'use server';

import { z } from 'zod';
import { RegistrationFormSchema, FullCustomerDetailsSchema, UserProfileUpdateSchema, ChangePasswordSchema, CourseModuleSchema, QuizQuestionSchema, VisualContentSchema, FaqSchema, BlogPostFormValues, BlogPostSchema, TrainerRegistrationFormSchema } from '@/types';
import type { UserProfile, ApprovalStatusType, PayoutStatusType, RescheduleRequestStatusType, UserProfileUpdateValues, RescheduleRequest, ChangePasswordValues, FullCustomerDetailsValues, CourseModuleFormValues, QuizQuestionFormValues, VisualContentFormValues, FaqFormValues, RegistrationFormValues, Notification } from '@/types';
import { format, parseISO, addDays } from 'date-fns';
import { adminAuth, adminDb, adminStorage } from './firebase/admin';
import { revalidatePath } from 'next/cache';
import { uploadFileToCloudinary } from './cloudinary';
import { seedPromotionalPosters } from './server-data'; 
import { v4 as uuidv4 } from 'uuid';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './firebase/client';


// Helper to convert file to buffer
async function fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

// =================================================================
// NOTIFICATION ACTIONS
// =================================================================

async function createNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>): Promise<void> {
    if (!adminDb) return;
    try {
        await adminDb.collection('notifications').add({
            ...notification,
            isRead: false,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error creating notification:", error);
    }
}

export async function listenToNotifications(userId: string, callback: (notifications: Notification[]) => void): Promise<() => void> {
    if (!db) {
      console.error("Firestore not initialized");
      return () => {};
    }
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
  
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      callback(notifications);
    });
  
    return unsubscribe;
}

export async function markNotificationsAsRead(userId: string, notificationIds: string[]): Promise<void> {
    if (!adminDb || notificationIds.length === 0) return;
    const batch = adminDb.batch();
    notificationIds.forEach(id => {
        const docRef = adminDb.collection('notifications').doc(id);
        batch.update(docRef, { isRead: true });
    });
    await batch.commit();
}


// =================================================================
// LIVE SERVER ACTIONS - Interacts with Firebase Admin SDK
// =================================================================
export async function registerUserAction(data: RegistrationFormValues): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
    if (!adminAuth || !adminDb) {
        return { success: false, error: "Server is not configured for authentication." };
    }
    
    const userRole = data.userRole;

    if (userRole === 'trainer') {
        const validationResult = TrainerRegistrationFormSchema.safeParse(data);
        if (!validationResult.success) {
            const firstError = validationResult.error.errors[0]?.message || 'Invalid form data. Please check all fields.';
            return { success: false, error: firstError };
        }

        const { email, password, name, phone, username, gender, location, specialization, trainerVehicleType, fuelType, vehicleNumber, drivingLicenseNumber } = validationResult.data;

        try {
            // Check both collections for existing user
            const emailQueryUsers = await adminDb.collection('users').where('contact', '==', email).limit(1).get();
            const emailQueryTrainers = await adminDb.collection('trainers').where('contact', '==', email).limit(1).get();
            if (!emailQueryUsers.empty || !emailQueryTrainers.empty) {
                return { success: false, error: 'A user is already registered with this email address.' };
            }

            const usernameQueryUsers = await adminDb.collection('users').where('username', '==', username).limit(1).get();
            const usernameQueryTrainers = await adminDb.collection('trainers').where('username', '==', username).limit(1).get();
            if (!usernameQueryUsers.empty || !usernameQueryTrainers.empty) {
                return { success: false, error: 'This username is already taken. Please choose another one.' };
            }
            
            const userRecord = await adminAuth.createUser({
                email: email,
                emailVerified: true,
                password: password,
                displayName: name,
                disabled: false,
            });
            
            const trainerProfile: Omit<UserProfile, 'id'> = {
                uniqueId: `TR-${userRecord.uid.slice(0, 6).toUpperCase()}`,
                name,
                username,
                contact: email,
                phone,
                gender,
                userRole: 'trainer',
                subscriptionPlan: 'Trainer',
                approvalStatus: 'Pending',
                location,
                specialization,
                vehicleInfo: `${trainerVehicleType} (${fuelType})`,
                vehicleNumber,
                drivingLicenseNumber,
                registrationTimestamp: new Date().toISOString(),
            };
            
            await adminDb.collection('trainers').doc(userRecord.uid).set(trainerProfile);
            revalidatePath('/dashboard');

            return { success: true, user: { ...trainerProfile, id: userRecord.uid } };

        } catch (error: any) {
            console.error("Error in trainer registerUserAction:", error);
            if (error.code === 'auth/email-already-exists') {
                return { success: false, error: 'A user is already registered with this email address.' };
            }
            return { success: false, error: error.message || 'An unexpected server error occurred during registration.' };
        }

    } else {
        const validationResult = RegistrationFormSchema.safeParse(data);
        if (!validationResult.success) {
            const firstError = validationResult.error.errors[0]?.message || 'Invalid form data. Please check all fields.';
            return { success: false, error: firstError };
        }
        const { email, password, name, phone, username, gender } = validationResult.data;

        try {
            const emailQueryUsers = await adminDb.collection('users').where('contact', '==', email).limit(1).get();
            const emailQueryTrainers = await adminDb.collection('trainers').where('contact', '==', email).limit(1).get();
            if (!emailQueryUsers.empty || !emailQueryTrainers.empty) {
                 return { success: false, error: 'A user is already registered with this email address.' };
            }
             const usernameQueryUsers = await adminDb.collection('users').where('username', '==', username).limit(1).get();
             const usernameQueryTrainers = await adminDb.collection('trainers').where('username', '==', username).limit(1).get();
            if (!usernameQueryUsers.empty || !usernameQueryTrainers.empty) {
                return { success: false, error: 'This username is already taken. Please choose another one.' };
            }

            const userRecord = await adminAuth.createUser({
                email: email,
                emailVerified: true,
                password: password,
                displayName: name,
                disabled: false,
            });

            const userProfileData: Omit<UserProfile, 'id'> = {
                uniqueId: `CU-${userRecord.uid.slice(0, 6).toUpperCase()}`,
                name,
                username,
                contact: email,
                phone,
                gender,
                userRole: 'customer',
                subscriptionPlan: 'None',
                approvalStatus: 'Pending',
                registrationTimestamp: new Date().toISOString(),
            };
             await adminDb.collection('users').doc(userRecord.uid).set(userProfileData);
             await createNotification({ userId: userRecord.uid, message: `Welcome to Drivergy, ${name}! Complete your profile to get started.`, href: '/dashboard/complete-profile' });

            revalidatePath('/dashboard');
            revalidatePath('/login');
            return { success: true, user: { ...userProfileData, id: userRecord.uid } };

        } catch (error: any) {
            console.error("Error in customer registerUserAction:", error);
             if (error.code === 'auth/email-already-exists') {
                return { success: false, error: 'A user is already registered with this email address.' };
            }
            return { success: false, error: error.message || 'An unexpected server error occurred during registration.' };
        }
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

export async function updateUserApprovalStatus({ userId, newStatus, role }: { userId: string; newStatus: ApprovalStatusType; role: 'customer' | 'trainer' | 'admin' }): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: "Database not configured." };
    
    try {
        const collectionName = role === 'trainer' ? 'trainers' : 'users';
        const userRef = adminDb.collection(collectionName).doc(userId);
        await userRef.update({ approvalStatus: newStatus });

        await createNotification({ userId: userId, message: `An admin has updated your account status to: ${newStatus}.`, href: '/dashboard/profile' });
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating user ${userId} status:`, error);
        return { success: false, error: "Failed to update user status." };
    }
}

export async function deleteUserAction({ userId, userRole }: { userId: string; userRole: 'customer' | 'trainer' | 'admin' }): Promise<{ success: boolean; error?: string }> {
    if (!adminAuth || !adminDb) {
        return { success: false, error: "Server is not configured correctly." };
    }

    try {
        await adminAuth.deleteUser(userId);
        const collectionName = userRole === 'trainer' ? 'trainers' : 'users';
        await adminDb.collection(collectionName).doc(userId).delete();

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        console.error(`Failed to delete user ${userId}:`, error);
        return { success: false, error: "An error occurred while deleting the user." };
    }
}


export async function completeCustomerProfileAction(prevState: any, formData: FormData): Promise<{ success: boolean; error?: string; }> {
    if (!adminDb) {
        return { success: false, error: "Server not configured." };
    }
    
    const data = Object.fromEntries(formData.entries());
    data.photoIdFile = formData.get('photoIdFile') as File;
    if (data.subscriptionStartDate && typeof data.subscriptionStartDate === 'string') {
        data.subscriptionStartDate = new Date(data.subscriptionStartDate);
    }
    
    const validationResult = FullCustomerDetailsSchema.safeParse(data);

    if (!validationResult.success) {
        console.error("Profile completion validation failed:", validationResult.error.format());
        const firstError = validationResult.error.errors[0]?.message || 'Invalid form data. Please check all fields.';
        return { success: false, error: firstError };
    }

    const { userId, photoIdFile, ...profileData } = validationResult.data;
    
    try {
        const photoIdUrl = await uploadFileToCloudinary(await fileToBuffer(photoIdFile), 'customer_documents');
        
        const userRef = adminDb.collection('users').doc(userId);
        await userRef.update({ 
            ...profileData, 
            subscriptionStartDate: format(profileData.subscriptionStartDate, 'MMM dd, yyyy'),
            photoIdUrl,
            approvalStatus: 'In Progress' 
        });
        
        revalidatePath('/dashboard');
        return { success: true };

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
  const trainerRef = adminDb.collection('trainers').doc(userId);
  const userDoc = await userRef.get();

  let updatedDoc;
  if(userDoc.exists) {
      await userRef.update(updatePayload);
      updatedDoc = await userRef.get();
  } else {
      await trainerRef.update(updatePayload);
      updatedDoc = await trainerRef.get();
  }
  
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

    const newRequestRef = await adminDb.collection('rescheduleRequests').add({
      ...request,
      requestTimestamp: new Date(),
    });
    
    await createNotification({ userId: trainerId, message: `${customerName} requested to reschedule a lesson.`, href: '/dashboard' });

    revalidatePath('/dashboard');
    return true;
}


export async function updateRescheduleRequestStatus(requestId: string, newStatus: RescheduleRequestStatusType): Promise<boolean> {
    if (!adminDb) return false;
    const requestRef = adminDb.collection('rescheduleRequests').doc(requestId);
    const requestDoc = await requestRef.get();
    if (!requestDoc.exists) return false;
    
    const requestData = requestDoc.data()!;
    
    await requestRef.update({ status: newStatus });
    
    if (newStatus === 'Approved') {
        const userRef = adminDb.collection('users').doc(requestData.userId);
        await userRef.update({ upcomingLesson: requestData.requestedRescheduleDate });
        await createNotification({ userId: requestData.userId, message: `Your reschedule request was ${newStatus}.`, href: '/dashboard' });
    } else {
        await createNotification({ userId: requestData.userId, message: `Your reschedule request was unfortunately ${newStatus}.`, href: '/dashboard' });
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
    const trainerRef = adminDb.collection('trainers').doc(trainerId);

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

    const updatePayload = {
        approvalStatus: 'Approved',
        assignedTrainerId: trainerId,
        assignedTrainerName: trainerData.name,
        assignedTrainerPhone: trainerData.phone,
        assignedTrainerVehicleDetails: trainerData.vehicleInfo,
        totalLessons: totalLessons,
        completedLessons: 0,
        upcomingLesson: format(addDays(startDate, 1), "MMM dd, yyyy, '09:00 AM'"),
    };
    await customerRef.update(updatePayload);

    // Create notifications
    await createNotification({ userId: customerId, message: `You have been assigned to trainer ${trainerData.name}. Your first lesson is scheduled!`, href: '/dashboard' });
    await createNotification({ userId: trainerId, message: `You have been assigned a new student: ${customerData.name}.`, href: '/dashboard' });

    revalidatePath('/dashboard');
    return true;
}

export async function reassignTrainerToCustomer(customerId: string, newTrainerId: string): Promise<boolean> {
    if (!adminDb) return false;

    const customerRef = adminDb.collection('users').doc(customerId);
    const newTrainerRef = adminDb.collection('trainers').doc(newTrainerId);

    const [customerDoc, newTrainerDoc] = await Promise.all([customerRef.get(), newTrainerRef.get()]);

    if (!customerDoc.exists || !newTrainerDoc.exists) return false;
    
    const customerData = customerDoc.data()!;
    const newTrainerData = newTrainerDoc.data()!;
    const oldTrainerId = customerData.assignedTrainerId;
    
    await customerRef.update({
        assignedTrainerId: newTrainerId,
        assignedTrainerName: newTrainerData.name,
        assignedTrainerPhone: newTrainerData.phone,
        assignedTrainerVehicleDetails: newTrainerData.vehicleInfo,
    });
    
    await createNotification({ userId: customerId, message: `Your trainer has been changed to ${newTrainerData.name}.`, href: '/dashboard' });
    if(oldTrainerId) {
        await createNotification({ userId: oldTrainerId, message: `Your student ${customerData.name} has been reassigned to another trainer.`, href: '/dashboard' });
    }
    await createNotification({ userId: newTrainerId, message: `You have been assigned a new student: ${customerData.name}.`, href: '/dashboard' });

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
        let trainerQuery;

        if (identifier.includes('@')) {
            userQuery = adminDb.collection('users').where('contact', '==', identifier).limit(1);
            trainerQuery = adminDb.collection('trainers').where('contact', '==', identifier).limit(1);
        } else {
            userQuery = adminDb.collection('users').where('username', '==', identifier).limit(1);
            trainerQuery = adminDb.collection('trainers').where('username', '==', identifier).limit(1);
        }

        const [userQuerySnapshot, trainerQuerySnapshot] = await Promise.all([
            userQuery.get(),
            trainerQuery.get()
        ]);
        
        let userDoc;
        if (!userQuerySnapshot.empty) {
            userDoc = userQuerySnapshot.docs[0];
        } else if (!trainerQuerySnapshot.empty) {
            userDoc = trainerQuerySnapshot.docs[0];
        } else {
            return { success: false, error: "User not found.", code: 'auth/user-not-found' };
        }
        
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
