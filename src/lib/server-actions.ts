
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
export async function checkUsernameAvailability(
  username: string,
  name: string
): Promise<{ available: boolean; suggestions?: string[] }> {
  if (!adminDb) {
    throw new Error('Database not configured.');
  }
  if (!username || username.length < 3) {
    return { available: false, suggestions: [] };
  }

  const usernameQuery = await adminDb
    .collection('users')
    .where('username', '==', username)
    .limit(1)
    .get();

  if (!usernameQuery.empty) {
    // Username is taken, generate suggestions
    const baseUsername = name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
    const suggestions = [
      `${baseUsername}${Math.floor(Math.random() * 10)}`,
      `${baseUsername}${Math.floor(Math.random() * 100)}`,
      `${baseUsername}_${new Date().getFullYear().toString().slice(-2)}`,
    ];
    
    return { available: false, suggestions };
  }

  return { available: true };
}


export async function registerUserAction(prevState: any, formData: FormData): Promise<{ success: boolean; error?: string; user?: UserProfile, token?: string }> {
    console.log("registerUserAction: Starting user registration process.");

    if (!adminAuth || !adminDb) {
        console.error("registerUserAction: FATAL: Server is not configured for authentication. Firebase Admin SDK failed to initialize.");
        return { success: false, error: "Server is not configured for authentication." };
    }
    console.log("registerUserAction: Firebase Admin SDK appears to be configured.");

    try {
        const rawData = Object.fromEntries(formData.entries());
        const userRole = rawData.userRole;

        // Separate file data from text data
        const fileData: { [key: string]: File | undefined } = {};
        const textData: { [key: string]: any } = {};

        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                if (value.size > 0) {
                   fileData[key] = value;
                }
            } else {
                textData[key] = value;
            }
        }
        
        // Add file placeholders to textData for Zod validation if needed
        if (userRole === 'trainer') {
            textData.trainerCertificateFile = fileData.trainerCertificateFile;
            textData.drivingLicenseFile = fileData.drivingLicenseFile;
            textData.aadhaarCardFile = fileData.aadhaarCardFile;
        }

        const validationResult = RegistrationFormSchema.safeParse(textData);

        if (!validationResult.success) {
            console.error("registerUserAction: Form validation failed.", validationResult.error.flatten());
            const firstError = validationResult.error.errors[0]?.message || 'Invalid form data. Please check all fields.';
            return { success: false, error: firstError };
        }
        
        const validatedData = validationResult.data;
        const { email, password, name, phone, username, gender, location } = validatedData;
        console.log("registerUserAction: Form data validated successfully for user role:", userRole);

        try {
            console.log(`registerUserAction: Checking if email '${email}' already exists in Firebase Auth...`);
            await adminAuth.getUserByEmail(email);
            console.error(`registerUserAction: Email '${email}' is already registered.`);
            return { success: false, error: 'A user is already registered with this email address.' };
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                console.log(`registerUserAction: Email '${email}' is available.`);
            } else {
                console.error("registerUserAction: Unexpected error while checking email existence.", error);
                throw error;
            }
        }

        console.log(`registerUserAction: Checking if username '${username}' is already taken...`);
        const usernameQuery = await adminDb.collection('users').where('username', '==', username).limit(1).get();
        if (!usernameQuery.empty) {
            console.error(`registerUserAction: Username '${username}' is already taken.`);
            return { success: false, error: 'This username is already taken. Please choose another one.' };
        }
        console.log(`registerUserAction: Username '${username}' is available.`);

        console.log(`registerUserAction: Creating user in Firebase Auth for email '${email}'...`);
        const userRecord = await adminAuth.createUser({
            email: email,
            emailVerified: false,
            password: password,
            displayName: name,
            disabled: false,
        });
        console.log(`registerUserAction: Successfully created user in Firebase Auth with UID: ${userRecord.uid}`);


        let newUserProfile: Omit<UserProfile, 'id' | 'registrationTimestamp'> = {
            uniqueId: `${userRole === 'customer' ? 'CU' : 'TR'}-${userRecord.uid.slice(0, 6).toUpperCase()}`,
            name: name,
            username: username,
            contact: email,
            phone: phone,
            gender: gender,
            location: location,
            subscriptionPlan: userRole === 'trainer' ? 'Trainer' : 'None',
            approvalStatus: 'Pending',
        };

        if (userRole === 'trainer' && validatedData.userRole === 'trainer') {
            console.log("registerUserAction: Processing trainer-specific fields...");
            const {
                yearsOfExperience, specialization, trainerVehicleType, fuelType, vehicleNumber,
                trainerCertificateNumber, drivingLicenseNumber, aadhaarCardNumber,
                trainerCertificateFile, drivingLicenseFile, aadhaarCardFile
            } = validatedData;

            if (!trainerCertificateFile || !drivingLicenseFile || !aadhaarCardFile) {
                 throw new Error("One or more required trainer documents were not provided.");
            }

            console.log("registerUserAction: Starting document uploads to Cloudinary...");
            const [certUrl, dlUrl, aadhaarUrl] = await Promise.all([
                uploadFileToCloudinary(await fileToBuffer(trainerCertificateFile), 'trainer_documents').then(url => { console.log("Uploaded certificate."); return url; }),
                uploadFileToCloudinary(await fileToBuffer(drivingLicenseFile), 'trainer_documents').then(url => { console.log("Uploaded DL."); return url; }),
                uploadFileToCloudinary(await fileToBuffer(aadhaarCardFile), 'trainer_documents').then(url => { console.log("Uploaded Aadhaar."); return url; })
            ]);
            console.log("registerUserAction: All trainer documents uploaded successfully to Cloudinary.");
            
            Object.assign(newUserProfile, {
                specialization, yearsOfExperience, vehicleInfo: `${trainerVehicleType} (${fuelType}) - ${vehicleNumber}`,
                licenseNumber: drivingLicenseNumber,
                trainerCertificateNumber: trainerCertificateNumber,
                aadhaarCardNumber: aadhaarCardNumber,
                trainerCertificateUrl: certUrl,
                drivingLicenseUrl: dlUrl,
                aadhaarCardUrl: aadhaarUrl,
            });
        }

        const finalProfile = {
            ...newUserProfile,
            registrationTimestamp: new Date().toISOString(),
        };

        console.log(`registerUserAction: Creating user profile in Firestore for UID: ${userRecord.uid}...`);
        await adminDb.collection('users').doc(userRecord.uid).set(finalProfile);
        console.log("registerUserAction: Successfully created Firestore user profile.");
        
        console.log(`registerUserAction: Generating custom auth token for UID: ${userRecord.uid}`);
        const customToken = await adminAuth.createCustomToken(userRecord.uid);
        console.log("registerUserAction: Custom token generated.");

        const createdUser: UserProfile = { id: userRecord.uid, ...finalProfile };
        
        revalidatePath('/dashboard');
        console.log("registerUserAction: Revalidated path and returning success with token.");

        return { success: true, user: createdUser, token: customToken };

    } catch (error: any) {
        console.error("registerUserAction: An unexpected error occurred during the registration process.", error);
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
        // Don't reveal if email exists or not for security reasons
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
    // This server-side password change is insecure without re-authentication.
    // Re-authentication should be enforced on the client before calling a more secure endpoint.
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
    // Potentially add logic here for the first lesson if needed.
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
        assignedTrainerExperience: trainerData.yearsOfExperience,
        assignedTrainerVehicleDetails: trainerData.vehicleInfo,
        totalLessons: totalLessons,
        completedLessons: 0,
        upcomingLesson: format(addDays(startDate, 1), "MMM dd, yyyy, '09:00 AM'"),
    });

    revalidatePath('/dashboard');
    return true;
}
