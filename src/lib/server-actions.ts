
'use server';

import { z } from 'zod';
import { RegistrationFormSchema, FullCustomerDetailsSchema, UserProfileUpdateValues, UserProfileUpdateSchema, ChangePasswordValues, ChangePasswordSchema, CourseModuleFormValues, CourseModuleSchema, QuizQuestionFormValues, QuizQuestionSchema, FaqFormValues, FaqSchema, BlogPostFormValues, BlogPostSchema, VisualContentFormValues, VisualContentSchema } from '@/types';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { adminAuth, adminDb } from './firebase/admin';
import type { ApprovalStatusType, UserProfile, CourseModule, QuizSet, Question, FaqItem, BlogPost, SiteBanner, PromotionalPoster, PayoutStatusType, RescheduleRequest, RescheduleRequestStatusType } from '@/types';
import { addDays, format, parse } from 'date-fns';

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

const generateId = (): string => Math.random().toString(36).substring(2, 10);

// =================================================================
// WRITE OPERATIONS MOVED FROM MOCK-DATA
// =================================================================

export async function addBlogPost(data: BlogPostFormValues): Promise<BlogPost | null> {
    if (!adminDb) return null;
    let imageUrl = data.imageSrc || 'https://placehold.co/1200x800.png';
    // File upload is handled by server action now
    const newPostData: Omit<BlogPost, 'slug'> = {
        title: data.title, category: data.category, excerpt: data.excerpt,
        content: data.content, author: data.author, date: format(new Date(), 'LLL d, yyyy'),
        imageSrc: imageUrl, imageHint: data.imageHint, tags: data.tags,
    };
    const docRef = doc(adminDb, 'blogPosts', data.slug);
    await setDoc(docRef, newPostData);
    return { slug: docRef.id, ...newPostData };
}

export async function updateBlogPost(slug: string, data: BlogPostFormValues): Promise<boolean> {
    if (!adminDb) return false;
    const updateData: Partial<BlogPostFormValues> = { ...data };
    // File upload handled by server action
    delete updateData.imageFile;
    await updateDoc(doc(adminDb, 'blogPosts', slug), updateData as any);
    return true;
}

export async function deleteBlogPost(slug: string): Promise<boolean> {
    if (!adminDb) return false;
    await deleteDoc(doc(adminDb, 'blogPosts', slug));
    return true;
}

export async function addCourseModule(courseId: string, moduleData: Omit<CourseModule, 'id'>): Promise<Course | null> {
    if (!adminDb) return null;
    const courseRef = doc(adminDb, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    if (!courseSnap.exists()) return null;
    const course = courseSnap.data() as Course;
    const newModule = { ...moduleData, id: generateId() };
    const updatedModules = [...(course.modules || []), newModule];
    await updateDoc(courseRef, { modules: updatedModules });
    return { ...course, modules: updatedModules, id: courseId };
}

export async function updateCourseModule(courseId: string, moduleId: string, moduleData: CourseModuleFormValues): Promise<Course | null> {
    if (!adminDb) return null;
    const courseRef = doc(adminDb, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    if (!courseSnap.exists()) return null;
    const course = courseSnap.data() as Course;
    const updatedModules = course.modules.map(m => m.id === moduleId ? { ...m, ...moduleData } : m);
    await updateDoc(courseRef, { modules: updatedModules });
    return { ...course, modules: updatedModules, id: courseId };
}

export async function deleteCourseModule(courseId: string, moduleId: string): Promise<boolean> {
    if (!adminDb) return false;
    const courseRef = doc(adminDb, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    if (!courseSnap.exists()) return false;
    const course = courseSnap.data() as Course;
    const updatedModules = course.modules.filter(m => m.id !== moduleId);
    await updateDoc(courseRef, { modules: updatedModules });
    return true;
}

export async function addFaq(data: FaqFormValues): Promise<FaqItem | null> {
    if (!adminDb) return null;
    const docRef = await addDoc(collection(adminDb, 'faqs'), data);
    return { id: docRef.id, ...data };
}

export async function updateFaq(id: string, data: FaqFormValues): Promise<boolean> {
    if (!adminDb) return false;
    await updateDoc(doc(adminDb, 'faqs', id), data as any);
    return true;
}

export async function deleteFaq(id: string): Promise<boolean> {
    if (!adminDb) return false;
    await deleteDoc(doc(adminDb, 'faqs', id));
    return true;
}

export async function updateSiteBanner(id: string, data: VisualContentFormValues): Promise<boolean> {
    if (!adminDb) return false;
    const updateData: Partial<VisualContentFormValues> = { ...data };
    // File upload handled by server action
    delete updateData.imageFile;
    await updateDoc(doc(adminDb, 'siteBanners', id), updateData as any);
    return true;
}

export async function updatePromotionalPoster(id: string, data: VisualContentFormValues): Promise<boolean> {
    if (!adminDb) return false;
    const updateData: Partial<VisualContentFormValues> = { ...data };
    // File upload handled by server action
    delete updateData.imageFile;
    await updateDoc(doc(adminDb, 'promotionalPosters', id), updateData as any);
    return true;
}

export async function updateQuizQuestion(quizSetId: string, questionId: string, data: QuizQuestionFormValues): Promise<QuizSet | null> {
    if (!adminDb) return null;
    const setRef = doc(adminDb, 'quizSets', quizSetId);
    const setSnap = await getDoc(setRef);
    if (!setSnap.exists()) return null;
    const quizSet = setSnap.data() as QuizSet;
    const updatedQuestions = quizSet.questions.map(q => {
        if (q.id === questionId) {
            return {
                id: q.id,
                question: { en: data.question_en, hi: data.question_hi },
                options: { en: data.options_en.split('\n').filter(o => o.trim() !== ''), hi: data.options_hi.split('\n').filter(o => o.trim() !== '') },
                correctAnswer: { en: data.correctAnswer_en, hi: data.correctAnswer_hi },
            };
        }
        return q;
    });
    await updateDoc(setRef, { questions: updatedQuestions });
    return { ...quizSet, questions: updatedQuestions, id: quizSetId };
}

export async function changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    // This is a placeholder. Actual password change should be done on the client with re-authentication.
    console.log(`Password change requested for user ${userId}. This should be handled client-side.`);
    return false; 
};

export async function assignTrainerToCustomer(customerId: string, trainerId: string): Promise<boolean> {
    if (!adminDb) return false;
    const customerRef = doc(adminDb, "customers", customerId);
    const trainerRef = doc(adminDb, "trainers", trainerId);
    const [customerSnap, trainerSnap] = await Promise.all([getDoc(customerRef), getDoc(trainerRef)]);
    if (!customerSnap.exists() || !trainerSnap.exists()) return false;
    const trainerData = trainerSnap.data() as UserProfile;
    await updateDoc(customerRef, {
        approvalStatus: 'In Progress', assignedTrainerId: trainerId,
        assignedTrainerName: trainerData.name
    });
    return true;
};

export async function updateAssignmentStatusByTrainer(customerId: string, newStatus: 'Approved' | 'Rejected'): Promise<boolean> {
    if (!adminDb) return false;
    const customerRef = doc(adminDb, "customers", customerId);
    const updates: { [key: string]: any } = { approvalStatus: newStatus };

    if (newStatus === 'Approved') {
        const customerSnap = await getDoc(customerRef);
        if(!customerSnap.exists()) return false;
        const user = customerSnap.data() as UserProfile;
        if(user.subscriptionStartDate) {
            const startDate = parse(user.subscriptionStartDate!, 'MMM dd, yyyy', new Date());
            const firstLessonDate = addDays(startDate, 2);
            firstLessonDate.setHours(9, 0, 0, 0);
            updates.upcomingLesson = format(firstLessonDate, 'MMM dd, yyyy, h:mm a');
        }


        const requestQuery = query(collection(adminDb, 'lessonRequests'), where('customerId', '==', customerId));
        const requestSnapshot = await getDocs(requestQuery);
        if (!requestSnapshot.empty) {
            await updateDoc(requestSnapshot.docs[0].ref, { status: 'Active' });
        }
    } else { // Rejected
        updates.assignedTrainerId = null; updates.assignedTrainerName = null;
        updates.approvalStatus = 'Pending';
    }
    await updateDoc(customerRef, updates);
    return true;
}

export async function updateUserAttendance(studentId: string, status: 'Present' | 'Absent'): Promise<boolean> {
    if (!adminDb) return false;
    const studentRef = doc(adminDb, "customers", studentId);
    const studentSnap = await getDoc(studentRef);
    if (!studentSnap.exists()) return false;
    const studentData = studentSnap.data() as UserProfile;
    const updates: { [key: string]: any } = { attendance: status };
    if (status === 'Present' && studentData.attendance !== 'Present') {
        updates.completedLessons = (studentData.completedLessons || 0) + 1;
    }
    await updateDoc(studentRef, updates);
    return true;
}

export async function updateSubscriptionStartDate(customerId: string, newDate: Date): Promise<UserProfile | null> {
    if (!adminDb) return null;
    const firstLessonDate = addDays(newDate, 2);
    firstLessonDate.setHours(9, 0, 0, 0);
    const updates = {
        subscriptionStartDate: format(newDate, 'MMM dd, yyyy'),
        upcomingLesson: format(firstLessonDate, 'MMM dd, yyyy, h:mm a'),
    };
    const customerRef = doc(adminDb, 'customers', customerId);
    await updateDoc(customerRef, updates);
    const updatedSnap = await getDoc(customerRef);
    return updatedSnap.exists() ? { id: updatedSnap.id, ...updatedSnap.data() } as UserProfile : null;
}

export async function addRescheduleRequest(userId: string, customerName: string, originalDate: Date, newDate: Date): Promise<RescheduleRequest | null> {
    if (!adminDb) return null;
    const newRequest: Omit<RescheduleRequest, 'id'> = {
        userId, customerName,
        originalLessonDate: format(originalDate, 'MMM dd, yyyy, h:mm a'),
        requestedRescheduleDate: format(newDate, 'MMM dd, yyyy, h:mm a'),
        status: 'Pending', requestTimestamp: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(adminDb, 'rescheduleRequests'), newRequest);
    return { id: docRef.id, ...newRequest };
}

export async function updateRescheduleRequestStatus(requestId: string, newStatus: RescheduleRequestStatusType): Promise<boolean> {
    if (!adminDb) return false;
    const requestRef = doc(adminDb, 'rescheduleRequests', requestId);
    await updateDoc(requestRef, { status: newStatus });
    if (newStatus === 'Approved') {
        const requestSnap = await getDoc(requestRef);
        if (!requestSnap.exists()) return false;
        const requestData = requestSnap.data() as RescheduleRequest;
        await updateDoc(doc(adminDb, 'customers', requestData.userId), { upcomingLesson: requestData.requestedRescheduleDate });
    }
    return true;
}

export async function addFeedback(customerId: string, customerName: string, trainerId: string, trainerName: string, rating: number, comment: string): Promise<boolean> {
    if (!adminDb) return false;
    const newFeedback: Omit<Feedback, 'id'> = { customerId, customerName, trainerId, trainerName, rating, comment, submissionDate: new Date().toISOString() };
    await addDoc(collection(adminDb, 'feedback'), newFeedback);
    await updateDoc(doc(adminDb, 'customers', customerId), { feedbackSubmitted: true });
    return true;
}

export async function updateReferralPayoutStatus(referralId: string, status: PayoutStatusType): Promise<boolean> {
    if (!adminDb) return false;
    await updateDoc(doc(adminDb, 'referrals', referralId), { payoutStatus: status });
    return true;
}

export async function updateUserProfile(userId: string, data: UserProfileUpdateValues): Promise<UserProfile | null> {
    if (!adminDb) return null;
    let userRef;

    const collectionsToSearch = ['customers', 'trainers'];
    for (const col of collectionsToSearch) {
        const ref = doc(adminDb, col, userId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            userRef = ref;
            break;
        }
    }

    if (!userRef) return null;

    const { photo, ...restData } = data;

    const updateData: Partial<UserProfile> = {
        ...restData,
        location: data.district,
    };

    Object.keys(updateData).forEach(key => (updateData as any)[key] === undefined && delete (updateData as any)[key]);
    await updateDoc(userRef, updateData);
    const updatedDoc = await getDoc(userRef);
    return updatedDoc.exists() ? { id: updatedDoc.id, ...updatedDoc.data() } as UserProfile : null;
};
