'use server';

import { z } from 'zod';
import { 
    RegistrationFormSchema, 
    FullCustomerDetailsSchema, 
    UserProfileUpdateSchema, 
    ChangePasswordSchema, 
    CourseModuleSchema, 
    QuizQuestionSchema, 
    VisualContentSchema, 
    FaqSchema, 
    BlogPostSchema, 
    TrainerRegistrationFormSchema, 
    CustomerRegistrationFormSchema 
} from '@/types';
import type { 
    UserProfile, 
    ApprovalStatusType, 
    PayoutStatusType, 
    RescheduleRequestStatusType, 
    UserProfileUpdateValues, 
    RescheduleRequest, 
    FullCustomerDetailsValues, 
    CourseModuleFormValues, 
    QuizQuestionFormValues, 
    VisualContentFormValues, 
    FaqFormValues, 
    RegistrationFormValues, 
    Notification, 
    Skill,
    AdminDashboardData,
    SummaryData,
    LessonRequest,
    Feedback,
    LessonProgressData,
    Course,
    QuizSet,
    FaqItem,
    BlogPost,
    SiteBanner,
    PromotionalPoster,
    RevenueDashboardData,
    RevenueTransaction,
    TrainerPayout
} from '@/types';
import { format, parse, parseISO, addDays, isValid, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { adminAuth, adminDb } from './firebase/admin';
import { revalidatePath } from 'next/cache';
import { uploadFileToCloudinary } from './cloudinary';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from './email';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Robust date normalization helper to prevent RangeError: Invalid time value.
 * Safely handles Firestore Timestamps, ISO strings, and standard date strings.
 */
function normalizeDate(dateVal: any): string {
    if (!dateVal) return new Date().toISOString();
    
    let dateObj: Date;
    
    if (dateVal instanceof Date) {
        dateObj = dateVal;
    } else if (typeof dateVal === 'string') {
        dateObj = parseISO(dateVal);
        if (!isValid(dateObj)) {
            // Fallback for strings like "Jul 22, 2024" or standard constructor
            dateObj = new Date(dateVal);
        }
    } else if (dateVal && typeof dateVal.toDate === 'function') {
        // Handle Firestore Timestamp
        dateObj = dateVal.toDate();
    } else if (typeof dateVal === 'object' && dateVal._seconds) {
        // Handle POJO version of Firestore Timestamp if it lost its prototype
        dateObj = new Date(dateVal._seconds * 1000);
    } else {
        dateObj = new Date(dateVal);
    }

    return isValid(dateObj) ? dateObj.toISOString() : new Date().toISOString();
}

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
            timestamp: new Date(),
        });
    } catch (error) {
        console.error("Error creating notification:", error);
    }
}

export async function markNotificationsAsRead(userId: string, notificationIds: string[]): Promise<void> {
    if (!adminDb || notificationIds.length === 0) return;
    const batch = adminDb.batch();
    notificationIds.forEach(id => {
        const docRef = adminDb.collection('notifications').doc(id);
        batch.update(docRef, { isRead: true });
    });
    await batch.commit();
    revalidatePath('/dashboard');
}

// =================================================================
// ADMIN DASHBOARD ACTIONS (Bypasses Security Rules)
// =================================================================

export async function fetchAdminDashboardData(): Promise<AdminDashboardData | null> {
    if (!adminDb) {
        console.error("Admin DB not initialized.");
        return null;
    }

    try {
        const [
            usersSnap, 
            trainersSnap, 
            coursesSnap, 
            quizSetsSnap, 
            faqsSnap, 
            blogSnap, 
            bannersSnap, 
            postersSnap, 
            rescheduleSnap, 
            feedbackSnap,
            referralsSnap
        ] = await Promise.all([
            adminDb.collection('users').get(),
            adminDb.collection('trainers').get(),
            adminDb.collection('courses').get(),
            adminDb.collection('quizSets').get(),
            adminDb.collection('faqs').get(),
            adminDb.collection('blog').orderBy('date', 'desc').get(),
            adminDb.collection('siteBanners').get(),
            adminDb.collection('promotionalPosters').get(),
            adminDb.collection('rescheduleRequests').orderBy('requestTimestamp', 'desc').get(),
            adminDb.collection('feedback').orderBy('submissionDate', 'desc').get(),
            adminDb.collection('referrals').get()
        ]);

        const customers: UserProfile[] = usersSnap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                registrationTimestamp: normalizeDate(data.registrationTimestamp),
            } as UserProfile;
        });

        const instructors: UserProfile[] = trainersSnap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                registrationTimestamp: normalizeDate(data.registrationTimestamp),
            } as UserProfile;
        });

        const allUsers = [...customers, ...instructors];

        const lessonRequests: LessonRequest[] = customers
            .filter(c => c.subscriptionPlan && c.subscriptionPlan !== 'None' && !c.assignedTrainerId)
            .map(c => ({
                id: c.id,
                customerId: c.id,
                customerName: c.name,
                vehicleType: (c.vehiclePreference || 'Four-Wheeler') as any,
                status: 'Pending',
                requestTimestamp: normalizeDate(c.registrationTimestamp),
            }));

        const feedback: Feedback[] = feedbackSnap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                submissionDate: normalizeDate(data.submissionDate),
            } as Feedback;
        });

        const rescheduleRequests: RescheduleRequest[] = rescheduleSnap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                originalLessonDate: normalizeDate(data.originalLessonDate),
                requestedRescheduleDate: normalizeDate(data.requestedRescheduleDate),
                requestTimestamp: normalizeDate(data.requestTimestamp),
            } as RescheduleRequest;
        });

        const referrals: Referral[] = referralsSnap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                timestamp: normalizeDate(data.timestamp),
            } as Referral;
        });

        const lessonProgress: LessonProgressData[] = customers
            .filter(c => c.assignedTrainerId)
            .map(c => ({
                studentId: c.id,
                studentName: c.name,
                trainerName: c.assignedTrainerName || 'N/A',
                subscriptionPlan: c.subscriptionPlan,
                totalLessons: c.totalLessons || 0,
                completedLessons: c.completedLessons || 0,
                remainingLessons: (c.totalLessons || 0) - (c.completedLessons || 0),
            }));

        const summaryData: SummaryData = {
            totalCustomers: customers.length,
            totalInstructors: instructors.length,
            activeSubscriptions: customers.filter(c => c.subscriptionPlan !== 'None' && c.approvalStatus === 'Approved').length,
            pendingRequests: lessonRequests.length,
            pendingRescheduleRequests: rescheduleRequests.filter(r => r.status === 'Pending').length,
            totalCertifiedTrainers: instructors.filter(i => i.approvalStatus === 'Approved').length,
            totalEarnings: customers.reduce((acc, curr) => {
                const planPrices: Record<string, number> = { 'Basic': 3999, 'Gold': 7499, 'Premium': 9999 };
                return acc + (planPrices[curr.subscriptionPlan] || 0);
            }, 0),
        };

        return {
            summaryData,
            allUsers,
            lessonRequests,
            rescheduleRequests,
            feedback,
            referrals,
            lessonProgress,
            courses: coursesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Course)),
            quizSets: quizSetsSnap.docs.map(d => ({ id: d.id, ...d.data() } as QuizSet)),
            faqs: faqsSnap.docs.map(d => ({ id: d.id, ...d.data() } as FaqItem)),
            blogPosts: blogSnap.docs.map(d => ({ slug: d.id, ...d.data() } as BlogPost)),
            siteBanners: bannersSnap.docs.map(d => ({ id: d.id, ...d.data() } as SiteBanner)),
            promotionalPosters: postersSnap.docs.map(d => ({ id: d.id, ...d.data() } as PromotionalPoster)),
        };

    } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
        return null;
    }
}

// =================================================================
// REVENUE MANAGEMENT ACTIONS
// =================================================================

export async function fetchRevenueDashboardData(): Promise<RevenueDashboardData | null> {
    if (!adminDb) return null;

    try {
        const [ordersSnap, usersSnap, trainersSnap, payoutsSnap] = await Promise.all([
            adminDb.collection('orders').where('status', '==', 'PAYMENT_SUCCESS').get(),
            adminDb.collection('users').get(),
            adminDb.collection('trainers').get(),
            adminDb.collection('payouts').get()
        ]);

        const usersMap = new Map(usersSnap.docs.map(d => [d.id, { id: d.id, ...d.data() }]));
        const trainersMap = new Map(trainersSnap.docs.map(d => [d.id, { id: d.id, ...d.data() }]));
        const existingPayouts = new Map(payoutsSnap.docs.map(d => [d.data().trainerId, { id: d.id, ...d.data() }]));

        const transactions: RevenueTransaction[] = ordersSnap.docs.map(doc => {
            const order = doc.data();
            const student = usersMap.get(order.userId) as any;
            const trainerId = student?.assignedTrainerId;
            const trainer = trainerId ? trainersMap.get(trainerId) as any : null;
            
            const amount = order.amount || 0;
            const commission = amount * 0.20;
            const trainerShare = amount * 0.80;

            return {
                id: doc.id,
                orderId: order.orderId,
                studentId: order.userId,
                studentName: student?.name || 'Unknown Student',
                trainerId: trainerId || null,
                trainerName: trainer?.name || 'Not Assigned',
                planName: order.plan || 'N/A',
                amount,
                commission,
                trainerShare,
                paymentMethod: 'PhonePe',
                status: 'Success',
                timestamp: normalizeDate(order.paidAt || order.createdAt),
            };
        });

        // Calculate Trainer Payouts
        const trainerStats = new Map<string, { total: number; name: string }>();
        transactions.forEach(tx => {
            if (tx.trainerId) {
                const current = trainerStats.get(tx.trainerId) || { total: 0, name: tx.trainerName! };
                current.total += tx.trainerShare;
                trainerStats.set(tx.trainerId, current);
            }
        });

        const payouts: TrainerPayout[] = Array.from(trainerStats.entries()).map(([trainerId, stats]) => {
            const existing = existingPayouts.get(trainerId) as any;
            const paid = existing?.paidAmount || 0;
            return {
                id: existing?.id || `payout-${trainerId}`,
                trainerId,
                trainerName: stats.name,
                totalEarnings: stats.total,
                paidAmount: paid,
                pendingAmount: stats.total - paid,
                lastPayoutDate: existing?.lastPayoutDate ? normalizeDate(existing.lastPayoutDate) : undefined,
                upiId: (trainersMap.get(trainerId) as any)?.upiId || 'N/A',
                status: (stats.total - paid) > 0 ? 'Pending' : 'Paid'
            };
        });

        // Summary Data
        const now = new Date();
        const thisMonthRange = { start: startOfMonth(now), end: endOfMonth(now) };
        const monthlyTransactions = transactions.filter(tx => isWithinInterval(parseISO(tx.timestamp), thisMonthRange));

        const summary = {
            totalRevenue: transactions.reduce((acc, tx) => acc + tx.amount, 0),
            totalCommission: transactions.reduce((acc, tx) => acc + tx.commission, 0),
            totalTrainerEarnings: transactions.reduce((acc, tx) => acc + tx.trainerShare, 0),
            pendingPayouts: payouts.reduce((acc, p) => acc + p.pendingAmount, 0),
            monthlyRevenue: monthlyTransactions.reduce((acc, tx) => acc + tx.amount, 0),
        };

        // Charts Logic
        const monthlyGrowthMap = new Map<string, { revenue: number; commission: number }>();
        transactions.forEach(tx => {
            const month = format(parseISO(tx.timestamp), 'MMM yyyy');
            const current = monthlyGrowthMap.get(month) || { revenue: 0, commission: 0 };
            current.revenue += tx.amount;
            current.commission += tx.commission;
            monthlyGrowthMap.set(month, current);
        });

        const monthlyGrowth = Array.from(monthlyGrowthMap.entries())
            .map(([month, data]) => ({ month, ...data }))
            .sort((a, b) => parse(a.month, 'MMM yyyy', new Date()).getTime() - parse(b.month, 'MMM yyyy', new Date()).getTime());

        const trainerEarningsChart = payouts.map(p => ({
            trainerName: p.trainerName,
            earnings: p.totalEarnings,
            commission: p.totalEarnings * 0.25 // Calculated back: if 80% is earnings, then 20% total is 25% of the earnings part
        })).slice(0, 5);

        return { summary, transactions, payouts, monthlyGrowth, trainerEarnings: trainerEarningsChart };

    } catch (error) {
        console.error("Revenue fetch error:", error);
        return null;
    }
}

export async function updatePayoutStatus(trainerId: string, amount: number): Promise<boolean> {
    if (!adminDb) return false;
    try {
        const payoutsRef = adminDb.collection('payouts');
        const query = await payoutsRef.where('trainerId', '==', trainerId).limit(1).get();
        
        if (query.empty) {
            await payoutsRef.add({
                trainerId,
                paidAmount: amount,
                lastPayoutDate: new Date().toISOString(),
            });
        } else {
            const doc = query.docs[0];
            const currentPaid = doc.data().paidAmount || 0;
            await doc.ref.update({
                paidAmount: currentPaid + amount,
                lastPayoutDate: new Date().toISOString(),
            });
        }
        
        revalidatePath('/dashboard/revenue');
        return true;
    } catch (error) {
        console.error("Payout update error:", error);
        return false;
    }
}

// =================================================================
// AUTH & REGISTRATION ACTIONS
// =================================================================

export async function registerUserAction(data: RegistrationFormValues): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
    if (!adminAuth || !adminDb) {
        return { success: false, error: "Server is not configured for authentication." };
    }
    
    const { email, username, userRole } = data;
    try {
        const [emailUsers, emailTrainers, userUsers, userTrainers] = await Promise.all([
            adminDb.collection('users').where('contact', '==', email).limit(1).get(),
            adminDb.collection('trainers').where('contact', '==', email).limit(1).get(),
            adminDb.collection('users').where('username', '==', username).limit(1).get(),
            adminDb.collection('trainers').where('username', '==', username).limit(1).get()
        ]);

        if (!emailUsers.empty || !emailTrainers.empty) return { success: false, error: 'Email already registered.' };
        if (!userUsers.empty || !userTrainers.empty) return { success: false, error: 'Username taken.' };
    } catch (e) {
        return { success: false, error: 'Database check failed.' };
    }

    if (userRole === 'trainer') {
        const validation = TrainerRegistrationFormSchema.safeParse(data);
        if (!validation.success) return { success: false, error: validation.error.errors[0].message };

        const { password, name, phone, gender, state, district, specialization, trainerVehicleType, fuelType, vehicleNumber, drivingLicenseNumber, yearsOfExperience } = validation.data;

        try {
            const userRecord = await adminAuth.createUser({ email, password, displayName: name });
            const uniqueId = `TR-${userRecord.uid.slice(0, 6).toUpperCase()}`;
            const trainerProfile = {
                uniqueId,
                myReferralCode: `${username.toLowerCase()}${uniqueId.slice(-3)}`,
                name, username, contact: email, phone, gender,
                userRole: 'trainer', subscriptionPlan: 'Trainer', approvalStatus: 'Pending',
                location: district, state, district, specialization,
                vehicleInfo: `${trainerVehicleType} (${fuelType})`,
                vehicleNumber, drivingLicenseNumber, yearsOfExperience,
                registrationTimestamp: new Date().toISOString(),
            };
            
            await adminDb.collection('trainers').doc(userRecord.uid).set(trainerProfile);
            revalidatePath('/dashboard');
            return { success: true, user: { ...trainerProfile, id: userRecord.uid } as UserProfile };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    } else {
        const validation = CustomerRegistrationFormSchema.safeParse(data);
        if (!validation.success) return { success: false, error: validation.error.errors[0].message };

        const { password, name, phone, gender } = validation.data;

        try {
            const userRecord = await adminAuth.createUser({ email, password, displayName: name });
            const uniqueId = `CU-${userRecord.uid.slice(0, 6).toUpperCase()}`;
            const userProfileData = {
                uniqueId,
                myReferralCode: `${username.toLowerCase()}${uniqueId.slice(-3)}`,
                name, username, contact: email, phone, gender,
                userRole: 'customer', subscriptionPlan: 'None', approvalStatus: 'Pending',
                registrationTimestamp: new Date().toISOString(),
            };
            await adminDb.collection('users').doc(userRecord.uid).set(userProfileData);
            revalidatePath('/dashboard');
            return { success: true, user: { ...userProfileData, id: userRecord.uid } as UserProfile };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}

export async function sendPasswordResetLink(email: string): Promise<{ success: boolean; error?: string }> {
    if (!adminAuth) return { success: false, error: "Auth not configured." };
    try {
        const link = await adminAuth.generatePasswordResetLink(email);
        await sendEmail({
            to: email,
            subject: 'Reset Your Drivergy Password',
            text: `Click to reset: ${link}`,
            html: `<p>Click <a href="${link}">here</a> to reset your password.</p>`,
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: "Failed to send reset link." };
    }
}

export async function updateUserApprovalStatus({ userId, newStatus, role }: { userId: string; newStatus: ApprovalStatusType; role: 'customer' | 'trainer' | 'admin' }): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: "Database not configured." };
    try {
        const collection = role === 'trainer' ? 'trainers' : 'users';
        await adminDb.collection(collection).doc(userId).update({ approvalStatus: newStatus });
        await createNotification({ userId, message: `Account status updated to: ${newStatus}.`, href: '/dashboard/profile' });
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: "Failed to update status." };
    }
}

export async function deleteUserAction({ userId, userRole }: { userId: string; userRole: 'customer' | 'trainer' | 'admin' }): Promise<{ success: boolean; error?: string }> {
    if (!adminAuth || !adminDb) return { success: false, error: "Server not configured." };
    try {
        const collection = userRole === 'trainer' ? 'trainers' : 'users';
        await Promise.all([
            adminAuth.deleteUser(userId),
            adminDb.collection(collection).doc(userId).delete()
        ]);
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: "Failed to delete user." };
    }
}

export async function completeCustomerProfileAction(prevState: any, formData: FormData): Promise<{ success: boolean; error?: string; }> {
    if (!adminDb) return { success: false, error: "Server not configured." };
    
    let data = Object.fromEntries(formData.entries());
    const file = data.photoIdFile as File;
    const validationData = { 
        ...data, 
        photoIdFile: (file && file.size > 0) ? file : undefined,
        subscriptionStartDate: data.subscriptionStartDate ? new Date(data.subscriptionStartDate as string) : undefined
    };

    const validation = FullCustomerDetailsSchema.safeParse(validationData);
    if (!validation.success) return { success: false, error: validation.error.errors[0].message };

    const { userId, photoIdFile, ...profileData } = validation.data;
    
    try {
        const photoIdUrl = await uploadFileToCloudinary(await fileToBuffer(photoIdFile), 'customer_documents');
        await adminDb.collection('users').doc(userId).update({ 
            ...profileData, 
            subscriptionStartDate: format(profileData.subscriptionStartDate, 'MMM dd, yyyy'),
            photoIdUrl,
            approvalStatus: 'In Progress' 
        });
        revalidatePath('/dashboard');
        return { success: true };
    } catch(error: any) {
        return { success: false, error: "Failed to save profile." };
    }
}

export async function updateUserProfile(userId: string, data: UserProfileUpdateValues): Promise<UserProfile | null> {
    if (!adminDb) return null;
    const { photo, ...profileData } = data;
    const updatePayload: { [key: string]: any } = { ...profileData };

    if (photo) {
        const photoURL = await uploadFileToCloudinary(await fileToBuffer(photo), 'profile_pictures');
        updatePayload.photoURL = photoURL;
    }

    try {
        const userRef = adminDb.collection('users').doc(userId);
        const trainerRef = adminDb.collection('trainers').doc(userId);
        const [userDoc, trainerDoc] = await Promise.all([userRef.get(), trainerRef.get()]);

        const targetRef = userDoc.exists ? userRef : (trainerDoc.exists ? trainerRef : null);
        if (!targetRef) return null;

        await targetRef.update(updatePayload);
        const updated = await targetRef.get();
        revalidatePath('/dashboard/profile');
        return { id: updated.id, ...updated.data(), registrationTimestamp: normalizeDate(updated.data()?.registrationTimestamp) } as UserProfile;
    } catch (error) {
        return null;
    }
}

export async function changeUserPassword(userId: string, currentPass: string, newPass: string): Promise<boolean> {
    console.warn("Server-side password change requires re-auth which is restricted in this environment.");
    return false;
}

export async function addBlogPost(data: z.infer<typeof BlogPostSchema>): Promise<boolean> {
    if (!adminDb) return false;
    const { slug, imageFile, ...postData } = data;
    let imageUrl = postData.imageSrc || '';
    if (imageFile) imageUrl = await uploadFileToCloudinary(await fileToBuffer(imageFile), 'blog_images');
    await adminDb.collection('blog').doc(slug).set({ ...postData, imageSrc: imageUrl });
    revalidatePath('/blog'); revalidatePath('/dashboard');
    return true;
}

export async function updateBlogPost(slug: string, data: z.infer<typeof BlogPostSchema>): Promise<boolean> {
    if (!adminDb) return false;
    const { imageFile, ...postData } = data;
    let imageUrl = postData.imageSrc || '';
    if (imageFile) imageUrl = await uploadFileToCloudinary(await fileToBuffer(imageFile), 'blog_images');
    await adminDb.collection('blog').doc(slug).update({ ...postData, imageSrc: imageUrl });
    revalidatePath('/blog'); revalidatePath(`/blog/${slug}`); revalidatePath('/dashboard');
    return true;
}

export async function deleteBlogPost(slug: string): Promise<boolean> {
    if (!adminDb) return false;
    await adminDb.collection('blog').doc(slug).delete();
    revalidatePath('/blog'); revalidatePath('/dashboard');
    return true;
}

export async function addCourseModule(courseId: string, formData: FormData): Promise<boolean> {
    if (!adminDb) return false;
    const data = Object.fromEntries(formData.entries());
    const validation = CourseModuleSchema.safeParse(data);
    if (!validation.success) return false;

    const { videoFile, ...moduleData } = validation.data;
    let videoUrl = moduleData.recordedLectureLink || '';
    if (videoFile) videoUrl = await uploadFileToCloudinary(await fileToBuffer(videoFile), 'course_videos');

    const courseRef = adminDb.collection('courses').doc(courseId);
    const courseDoc = await courseRef.get();
    if (!courseDoc.exists) return false;

    const modules = courseDoc.data()?.modules || [];
    modules.push({ ...moduleData, recordedLectureLink: videoUrl, id: uuidv4() });
    await courseRef.update({ modules });
    revalidatePath('/dashboard/courses');
    return true;
}

export async function updateCourseModule(courseId: string, moduleId: string, formData: FormData): Promise<boolean> {
    if (!adminDb) return false;
    const data = Object.fromEntries(formData.entries());
    const validation = CourseModuleSchema.safeParse(data);
    if (!validation.success) return false;

    const { videoFile, ...moduleData } = validation.data;
    const courseRef = adminDb.collection('courses').doc(courseId);
    const courseDoc = await courseRef.get();
    if (!courseDoc.exists) return false;
    
    let modules = courseDoc.data()?.modules || [];
    const idx = modules.findIndex((m: any) => m.id === moduleId);
    if (idx === -1) return false;

    let videoUrl = moduleData.recordedLectureLink || modules[idx].recordedLectureLink;
    if (videoFile) videoUrl = await uploadFileToCloudinary(await fileToBuffer(videoFile), 'course_videos');

    modules[idx] = { ...modules[idx], ...moduleData, recordedLectureLink: videoUrl };
    await courseRef.update({ modules });
    revalidatePath('/dashboard/courses');
    return true;
}

export async function deleteCourseModule(courseId: string, moduleId: string): Promise<boolean> {
    if (!adminDb) return false;
    const courseRef = adminDb.collection('courses').doc(courseId);
    const courseDoc = await courseRef.get();
    if (!courseDoc.exists) return false;
    const modules = (courseDoc.data()?.modules || []).filter((m: any) => m.id !== moduleId);
    await courseRef.update({ modules });
    revalidatePath('/dashboard/courses');
    return true;
}

export async function updateQuizQuestion(quizSetId: string, questionId: string, data: QuizQuestionFormValues): Promise<boolean> {
    if (!adminDb) return false;
    const ref = adminDb.collection('quizSets').doc(quizSetId);
    const doc = await ref.get();
    if (!doc.exists) return false;
    const questions = doc.data()?.questions || [];
    const idx = questions.findIndex((q: any) => q.id === questionId);
    if (idx === -1) return false;
    questions[idx] = {
        id: questionId,
        question: { en: data.question_en, hi: data.question_hi },
        options: { en: data.options_en.split('\n'), hi: data.options_hi.split('\n') },
        correctAnswer: { en: data.correctAnswer_en, hi: data.correctAnswer_hi },
    };
    await ref.update({ questions });
    revalidatePath('/dashboard/rto-quiz');
    return true;
}

export async function addFaq(data: FaqFormValues): Promise<boolean> {
    if (!adminDb) return false;
    await adminDb.collection('faqs').add({ ...data, id: uuidv4() });
    revalidatePath('/faq');
    return true;
}

export async function updateFaq(faqId: string, data: FaqFormValues): Promise<boolean> {
    if (!adminDb) return false;
    const query = await adminDb.collection('faqs').where('id', '==', faqId).limit(1).get();
    if (query.empty) return false;
    await query.docs[0].ref.update(data);
    revalidatePath('/faq');
    return true;
}

export async function deleteFaq(faqId: string): Promise<boolean> {
    if (!adminDb) return false;
    const query = await adminDb.collection('faqs').where('id', '==', faqId).limit(1).get();
    if (query.empty) return false;
    await query.docs[0].ref.delete();
    revalidatePath('/faq');
    return true;
}

export async function updateSiteBanner(bannerId: string, data: VisualContentFormValues): Promise<boolean> {
    if (!adminDb) return false;
    const { imageFile, ...bannerData } = data;
    let imageUrl = bannerData.imageSrc;
    if (imageFile) imageUrl = await uploadFileToCloudinary(await fileToBuffer(imageFile), 'site_banners');
    await adminDb.collection('siteBanners').doc(bannerId).update({ ...bannerData, imageSrc: imageUrl });
    revalidatePath('/');
    return true;
}

export async function updatePromotionalPoster(posterId: string, data: VisualContentFormValues): Promise<boolean> {
    if (!adminDb) return false;
    const { imageFile, ...posterData } = data;
    let imageUrl = posterData.imageSrc;
    if (imageFile) imageUrl = await uploadFileToCloudinary(await fileToBuffer(imageFile), 'promo_posters');
    await adminDb.collection('promotionalPosters').doc(posterId).update({ ...posterData, imageSrc: imageUrl });
    revalidatePath('/');
    return true;
}

export async function updateUserAttendance(studentId: string, status: 'Present' | 'Absent'): Promise<boolean> {
    if (!adminDb) return false;
    const ref = adminDb.collection('users').doc(studentId);
    const doc = await ref.get();
    if (!doc.exists) return false;
    const current = doc.data()?.completedLessons || 0;
    await ref.update({
        attendance: status,
        completedLessons: status === 'Present' ? current + 1 : current,
        upcomingLesson: null,
    });
    revalidatePath('/dashboard');
    return true;
}

export async function updateSubscriptionStartDate(customerId: string, newDate: Date): Promise<UserProfile | null> {
    if (!adminDb) return null;
    const ref = adminDb.collection('users').doc(customerId);
    await ref.update({
        subscriptionStartDate: format(newDate, 'MMM dd, yyyy'),
        upcomingLesson: format(addDays(newDate, 1), "MMM dd, yyyy, '09:00 AM'")
    });
    const updated = await ref.get();
    return { id: updated.id, ...updated.data(), registrationTimestamp: normalizeDate(updated.data()?.registrationTimestamp) } as UserProfile;
}

export async function addRescheduleRequest(userId: string, customerName: string, originalDate: Date, newDate: Date): Promise<boolean> {
    if (!adminDb) return false;
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const trainerId = userDoc.data()?.assignedTrainerId;
    if (!trainerId) return false;

    await adminDb.collection('rescheduleRequests').add({
        userId, customerName, trainerId,
        originalLessonDate: originalDate.toISOString(),
        requestedRescheduleDate: newDate.toISOString(),
        status: 'Pending',
        requestTimestamp: new Date()
    });
    await createNotification({ userId: trainerId, message: `${customerName} wants to reschedule.`, href: '/dashboard' });
    revalidatePath('/dashboard');
    return true;
}

export async function updateRescheduleRequestStatus(requestId: string, newStatus: RescheduleRequestStatusType): Promise<boolean> {
    if (!adminDb) return false;
    const ref = adminDb.collection('rescheduleRequests').doc(requestId);
    const doc = await ref.get();
    if (!doc.exists) return false;
    const data = doc.data()!;
    await ref.update({ status: newStatus });
    if (newStatus === 'Approved') {
        const requestedDate = normalizeDate(data.requestedRescheduleDate);
        await adminDb.collection('users').doc(data.userId).update({ upcomingLesson: format(parseISO(requestedDate), "MMM dd, yyyy, h:mm a") });
    }
    await createNotification({ userId: data.userId, message: `Reschedule request ${newStatus.toLowerCase()}.`, href: '/dashboard' });
    revalidatePath('/dashboard');
    return true;
}

export async function addFeedback(customerId: string, customerName: string, trainerId: string, trainerName: string, rating: number, comment: string): Promise<boolean> {
    if (!adminDb) return false;
    await adminDb.collection('feedback').add({ customerId, customerName, trainerId, trainerName, rating, comment, submissionDate: new Date() });
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

export async function assignTrainerToCustomer(customerId: string, trainerId: string): Promise<UserProfile | null> {
    if (!adminDb) return null;
    const [cDoc, tDoc] = await Promise.all([adminDb.collection('users').doc(customerId).get(), adminDb.collection('trainers').doc(trainerId).get()]);
    if (!cDoc.exists || !tDoc.exists) return null;
    const cData = cDoc.data()!; const tData = tDoc.data()!;
    const plan = cData.subscriptionPlan;
    const total = plan === 'Basic' ? 10 : (plan === 'Gold' ? 15 : (plan === 'Premium' ? 20 : 1));
    const startStr = cData.subscriptionStartDate;
    const start = startStr ? new Date(startStr) : new Date();

    const payload = {
        approvalStatus: 'Approved',
        assignedTrainerId: trainerId,
        assignedTrainerName: tData.name,
        assignedTrainerPhone: tData.phone,
        assignedTrainerVehicleDetails: tData.vehicleInfo,
        totalLessons: total,
        completedLessons: 0,
        upcomingLesson: format(addDays(start, 1), "MMM dd, yyyy, '09:00 AM'"),
    };
    await adminDb.collection('users').doc(customerId).update(payload);
    await createNotification({ userId: customerId, message: `Trainer ${tData.name} assigned. First lesson ready!`, href: '/dashboard' });
    await createNotification({ userId: trainerId, message: `New student: ${cData.name}.`, href: '/dashboard' });
    revalidatePath('/dashboard');
    const updated = await adminDb.collection('users').doc(customerId).get();
    return { id: updated.id, ...updated.data(), registrationTimestamp: normalizeDate(updated.data()?.registrationTimestamp) } as UserProfile;
}

export async function reassignTrainerToCustomer(customerId: string, newTrainerId: string): Promise<UserProfile | null> {
    if (!adminDb) return null;
    const [cDoc, tDoc] = await Promise.all([adminDb.collection('users').doc(customerId).get(), adminDb.collection('trainers').doc(newTrainerId).get()]);
    if (!cDoc.exists || !tDoc.exists) return null;
    const oldId = cDoc.data()?.assignedTrainerId;
    await adminDb.collection('users').doc(customerId).update({
        assignedTrainerId: newTrainerId,
        assignedTrainerName: tDoc.data()?.name,
        assignedTrainerPhone: tDoc.data()?.phone,
        assignedTrainerVehicleDetails: tDoc.data()?.vehicleInfo,
    });
    if (oldId) await createNotification({ userId: oldId, message: `Student reassigned.`, href: '/dashboard' });
    await createNotification({ userId: newTrainerId, message: `New student assigned.`, href: '/dashboard' });
    revalidatePath('/dashboard');
    const updated = await adminDb.collection('users').doc(customerId).get();
    return { id: updated.id, ...updated.data(), registrationTimestamp: normalizeDate(updated.data()?.registrationTimestamp) } as UserProfile;
}

export async function updateStudentProgress(studentId: string, skills: Skill[], lessonNotes: string): Promise<boolean> {
    if (!adminDb) return false;
    await adminDb.collection('users').doc(studentId).update({ skills, lessonNotes });
    revalidatePath(`/dashboard/student-progress/${studentId}`);
    return true;
}

export async function unassignTrainerFromCustomer(customerId: string, trainerId: string): Promise<boolean> {
    if (!adminDb) return false;
    await adminDb.collection('users').doc(customerId).update({
        approvalStatus: 'Pending',
        assignedTrainerId: null, assignedTrainerName: null,
        assignedTrainerPhone: null, assignedTrainerVehicleDetails: null,
        upcomingLesson: null, totalLessons: null, completedLessons: null,
    });
    revalidatePath('/dashboard');
    return true;
}

export async function getLoginUser(identifier: string): Promise<{ success: boolean, user?: UserProfile, error?: string }> {
    if (!adminDb) return { success: false, error: "Server error." };
    const field = identifier.includes('@') ? 'contact' : 'username';
    const [uQ, tQ] = await Promise.all([
        adminDb.collection('users').where(field, '==', identifier).limit(1).get(),
        adminDb.collection('trainers').where(field, '==', identifier).limit(1).get()
    ]);
    const doc = !uQ.empty ? uQ.docs[0] : (!tQ.empty ? tQ.docs[0] : null);
    if (!doc) return { success: false, error: "User not found." };
    const data = doc.data();
    return { success: true, user: { id: doc.id, ...data, registrationTimestamp: normalizeDate(data.registrationTimestamp) } as UserProfile };
}

export async function getOrderDetails(orderId: string) {
    if (!adminDb) return null;
    try {
        const orderDoc = await adminDb.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) return null;
        
        const orderData = orderDoc.data();
        const userDoc = await adminDb.collection('users').doc(orderData?.userId).get();
        const userData = userDoc.exists ? userDoc.data() : null;

        return {
            id: orderDoc.id,
            ...orderData,
            customerName: userData?.name || 'Customer',
            customerEmail: userData?.contact || 'N/A',
            customerPhone: userData?.phone || orderData?.mobile || 'N/A'
        };
    } catch (e) {
        console.error("Error fetching order details:", e);
        return null;
    }
}
