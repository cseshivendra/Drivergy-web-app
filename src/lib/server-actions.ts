
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
    CustomerRegistrationFormSchema,
    WithdrawalRequestSchema
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
    TrainerPayout,
    TrainerWallet,
    WalletTransaction,
    WithdrawalRequest,
    WithdrawalRequestValues,
    DrivingSession,
    SessionStatus
} from '@/types';
import { format, parse, parseISO, addDays, isValid, startOfMonth, endOfMonth, isWithinInterval, differenceInMinutes } from 'date-fns';
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
// SESSION MANAGEMENT ACTIONS (4-Digit OTP)
// =================================================================

function generateOtp(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function fetchOngoingSession(userId: string): Promise<DrivingSession | null> {
    if (!adminDb) return null;
    try {
        const snap = await adminDb.collection('sessions')
            .where('status', 'in', ['Scheduled', 'Active'])
            .where('studentId', '==', userId)
            .limit(1)
            .get();
        
        if (snap.empty) {
            const trainerSnap = await adminDb.collection('sessions')
                .where('status', 'in', ['Scheduled', 'Active'])
                .where('trainerId', '==', userId)
                .limit(1)
                .get();
            if (trainerSnap.empty) return null;
            return { id: trainerSnap.docs[0].id, ...trainerSnap.docs[0].data() } as DrivingSession;
        }
        return { id: snap.docs[0].id, ...snap.docs[0].data() } as DrivingSession;
    } catch (error) {
        return null;
    }
}

export async function verifyStartSession(sessionId: string, enteredOtp: string): Promise<{ success: boolean, error?: string }> {
    if (!adminDb) return { success: false, error: "Database error." };
    try {
        const ref = adminDb.collection('sessions').doc(sessionId);
        const doc = await ref.get();
        if (!doc.exists) return { success: false, error: "Session not found." };
        
        const data = doc.data() as DrivingSession;
        if (data.status !== 'Scheduled') return { success: false, error: "Session is not scheduled." };
        if (data.startOtp !== enteredOtp) return { success: false, error: "Incorrect OTP." };
        
        const now = new Date();
        if (new Date(data.startOtpExpiry) < now) return { success: false, error: "OTP expired." };

        await ref.update({
            status: 'Active',
            startTime: now.toISOString(),
        });

        await createNotification({
            userId: data.studentId,
            message: `Your driving session has started with ${data.trainerName}. Drive safely!`,
            href: '/dashboard'
        });

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Verification failed." };
    }
}

export async function verifyEndSession(sessionId: string, enteredOtp: string, notes?: string): Promise<{ success: boolean, error?: string }> {
    if (!adminDb) return { success: false, error: "Database error." };
    try {
        const ref = adminDb.collection('sessions').doc(sessionId);
        const doc = await ref.get();
        if (!doc.exists) return { success: false, error: "Session not found." };
        
        const data = doc.data() as DrivingSession;
        if (data.status !== 'Active') return { success: false, error: "Session is not active." };
        if (data.endOtp !== enteredOtp) return { success: false, error: "Incorrect OTP." };
        
        const now = new Date();
        const start = new Date(data.startTime!);
        const duration = differenceInMinutes(now, start);

        // Optional: Enforcement of minimum duration (e.g., 30 mins)
        if (duration < 30) {
            // We still allow it but log it or show a warning. 
            // For now, let's just complete it.
        }

        await ref.update({
            status: 'Completed',
            endTime: now.toISOString(),
            duration,
            notes: notes || '',
        });

        // Credit Trainer Attendance & Wallet
        const studentRef = adminDb.collection('users').doc(data.studentId);
        const studentDoc = await studentRef.get();
        if (studentDoc.exists) {
            const currentCompleted = studentDoc.data()?.completedLessons || 0;
            await studentRef.update({
                completedLessons: currentCompleted + 1,
                attendance: 'Present',
                upcomingLesson: null // Clear upcoming as it's now completed
            });
        }

        await createNotification({
            userId: data.studentId,
            message: `Great job! Your session with ${data.trainerName} is complete.`,
            href: '/dashboard'
        });

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Completion failed." };
    }
}

export async function fetchAllSessions(): Promise<DrivingSession[]> {
    if (!adminDb) return [];
    try {
        const snap = await adminDb.collection('sessions').orderBy('createdAt', 'desc').get();
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as DrivingSession));
    } catch (error) {
        return [];
    }
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
// TRAINER WALLET & WITHDRAWAL ACTIONS
// =================================================================

export async function fetchTrainerWallet(trainerId: string): Promise<{ wallet: TrainerWallet | null, transactions: WalletTransaction[] }> {
    if (!adminDb) return { wallet: null, transactions: [] };

    try {
        const walletDoc = await adminDb.collection('trainer_wallets').doc(trainerId).get();
        const transactionsSnap = await adminDb.collection('wallet_transactions')
            .where('trainerId', '==', trainerId)
            .orderBy('timestamp', 'desc')
            .get();

        const wallet = walletDoc.exists ? { id: walletDoc.id, ...walletDoc.data() } as TrainerWallet : null;
        const transactions = transactionsSnap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                timestamp: normalizeDate(data.timestamp),
            } as WalletTransaction;
        });

        return { wallet, transactions };
    } catch (error) {
        console.error("Fetch wallet error:", error);
        return { wallet: null, transactions: [] };
    }
}

export async function requestWithdrawal(trainerId: string, data: WithdrawalRequestValues): Promise<{ success: boolean, error?: string }> {
    if (!adminDb) return { success: false, error: "Database not configured." };

    try {
        // 1. Check for pending requests
        const pendingCheck = await adminDb.collection('withdrawals')
            .where('trainerId', '==', trainerId)
            .where('status', '==', 'Pending')
            .limit(1)
            .get();

        if (!pendingCheck.empty) {
            return { success: false, error: "You already have a pending withdrawal request." };
        }

        // 2. Check balance
        const walletDoc = await adminDb.collection('trainer_wallets').doc(trainerId).get();
        const currentBalance = walletDoc.exists ? (walletDoc.data()?.balance || 0) : 0;

        if (data.amount > currentBalance) {
            return { success: false, error: "Insufficient wallet balance." };
        }

        // 3. Create request
        const trainerDoc = await adminDb.collection('trainers').doc(trainerId).get();
        const trainerName = trainerDoc.data()?.name || "Trainer";

        const withdrawalId = uuidv4();
        await adminDb.collection('withdrawals').doc(withdrawalId).set({
            trainerId,
            trainerName,
            amount: data.amount,
            upiId: data.upiId,
            bankDetails: data.bankDetails || null,
            reason: data.reason || null,
            status: 'Pending',
            requestDate: new Date().toISOString(),
        });

        // 4. Create debit transaction (Pending)
        await adminDb.collection('wallet_transactions').add({
            trainerId,
            type: 'Debit',
            amount: data.amount,
            description: `Withdrawal request for ₹${data.amount}`,
            withdrawalId,
            status: 'Pending',
            timestamp: new Date().toISOString(),
        });

        revalidatePath('/dashboard/wallet');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function fetchAllWithdrawals(): Promise<WithdrawalRequest[]> {
    if (!adminDb) return [];
    try {
        const snap = await adminDb.collection('withdrawals').orderBy('requestDate', 'desc').get();
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as WithdrawalRequest));
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function updateWithdrawalStatus(withdrawalId: string, newStatus: WithdrawalRequest['status']): Promise<boolean> {
    if (!adminDb) return false;

    try {
        const withdrawalRef = adminDb.collection('withdrawals').doc(withdrawalId);
        const withdrawalDoc = await withdrawalRef.get();
        if (!withdrawalDoc.exists) return false;

        const { trainerId, amount, trainerName } = withdrawalDoc.data() as WithdrawalRequest;

        await withdrawalRef.update({
            status: newStatus,
            processedDate: new Date().toISOString(),
        });

        // Update the transaction record
        const transQuery = await adminDb.collection('wallet_transactions')
            .where('withdrawalId', '==', withdrawalId)
            .limit(1)
            .get();

        if (!transQuery.empty) {
            await transQuery.docs[0].ref.update({
                status: newStatus === 'Approved' || newStatus === 'Completed' ? 'Successful' : 'Rejected'
            });
        }

        // If approved/completed, deduct from actual wallet balance
        if (newStatus === 'Approved' || newStatus === 'Completed') {
            const walletRef = adminDb.collection('trainer_wallets').doc(trainerId);
            const walletDoc = await walletRef.get();
            if (walletDoc.exists) {
                const currentBalance = walletDoc.data()?.balance || 0;
                const currentWithdrawn = walletDoc.data()?.totalWithdrawn || 0;
                await walletRef.update({
                    balance: currentBalance - amount,
                    totalWithdrawn: currentWithdrawn + amount,
                    lastWithdrawalDate: new Date().toISOString(),
                    lastWithdrawalAmount: amount,
                });
            }
            
            await createNotification({
                userId: trainerId,
                message: `Your withdrawal of ₹${amount} has been ${newStatus.toLowerCase()}.`,
                href: '/dashboard/wallet'
            });
        } else if (newStatus === 'Rejected') {
            await createNotification({
                userId: trainerId,
                message: `Your withdrawal of ₹${amount} was rejected.`,
                href: '/dashboard/wallet'
            });
        }

        revalidatePath('/dashboard/wallet');
        revalidatePath('/dashboard');
        return true;
    } catch (error) {
        console.error(error);
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
            
            // Initialize Wallet
            await adminDb.collection('trainer_wallets').doc(userRecord.uid).set({
                trainerId: userRecord.uid,
                trainerName: name,
                balance: 0,
                totalEarnings: 0,
                totalWithdrawn: 0,
            });

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
        const fullFirebaseLink = await adminAuth.generatePasswordResetLink(email);
        
        // Extract oobCode from the firebase link
        const url = new URL(fullFirebaseLink);
        const oobCode = url.searchParams.get('oobCode');
        
        if (!oobCode) {
            throw new Error("Failed to generate reset code.");
        }

        // Construct our project's custom reset link
        const baseUrl = process.env.APP_BASE_URL || 'https://drivergy.in';
        const customLink = `${baseUrl}/reset-password?token=${oobCode}`;

        await sendEmail({
            to: email,
            subject: 'Reset Your Drivergy Password',
            text: `We received a request to reset your password. Click the link below to set a new one:\n\n${customLink}\n\nIf you did not make this request, you can safely ignore this email.`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #ef4444; margin: 0;">DRIVERGY</h1>
                        <p style="color: #666; margin: 5px 0; font-size: 14px; letter-spacing: 2px;">LEARN. DRIVE. LIVE.</p>
                    </div>
                    <h2 style="color: #333;">Reset Your Password</h2>
                    <p style="color: #555; line-height: 1.5;">Hello,</p>
                    <p style="color: #555; line-height: 1.5;">We received a request to reset the password for your Drivergy account. Click the button below to choose a new password:</p>
                    <div style="text-align: center; margin: 35px 0;">
                        <a href="${customLink}" style="background-color: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
                    </div>
                    <p style="color: #555; line-height: 1.5;">If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="word-break: break-all;"><a href="${customLink}" style="color: #ef4444;">${customLink}</a></p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                    <p style="font-size: 12px; color: #888; text-align: center;">If you did not request a password reset, please ignore this email. This link will expire shortly for security reasons.</p>
                    <p style="font-size: 12px; color: #888; text-align: center;">&copy; ${new Date().getFullYear()} Drivergy. All rights reserved.</p>
                </div>
            `,
        });
        return { success: true };
    } catch (error: any) {
        console.error("Reset link error:", error);
        return { success: false, error: error.message || "Failed to send reset link." };
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
    
    const startOtp = generateOtp();
    const endOtp = generateOtp();
    const scheduledDate = addDays(newDate, 1);
    scheduledDate.setHours(9, 0, 0, 0); // Default to 9 AM

    await ref.update({
        subscriptionStartDate: format(newDate, 'MMM dd, yyyy'),
        upcomingLesson: format(scheduledDate, "MMM dd, yyyy, '09:00 AM'")
    });

    const userDoc = await ref.get();
    const userData = userDoc.data();

    // Create the session in the sessions collection
    if (userData?.assignedTrainerId) {
        await adminDb.collection('sessions').add({
            studentId: customerId,
            studentName: userData.name,
            trainerId: userData.assignedTrainerId,
            trainerName: userData.assignedTrainerName,
            status: 'Scheduled',
            scheduledDate: scheduledDate.toISOString(),
            startOtp,
            endOtp,
            startOtpExpiry: scheduledDate.toISOString(), // Simplified for demo
            createdAt: new Date().toISOString(),
        });
    }

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
        
        // Update associated session if it exists
        const sessionsSnap = await adminDb.collection('sessions')
            .where('studentId', '==', data.userId)
            .where('status', '==', 'Scheduled')
            .limit(1)
            .get();
        
        if (!sessionsSnap.empty) {
            await sessionsSnap.docs[0].ref.update({
                scheduledDate: requestedDate,
                startOtpExpiry: requestedDate
            });
        }
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
    const scheduledDate = addDays(start, 1);
    scheduledDate.setHours(9, 0, 0, 0);

    const startOtp = generateOtp();
    const endOtp = generateOtp();

    const payload = {
        approvalStatus: 'Approved',
        assignedTrainerId: trainerId,
        assignedTrainerName: tData.name,
        assignedTrainerPhone: tData.phone,
        assignedTrainerVehicleDetails: tData.vehicleInfo,
        totalLessons: total,
        completedLessons: 0,
        upcomingLesson: format(scheduledDate, "MMM dd, yyyy, '09:00 AM'"),
    };
    await adminDb.collection('users').doc(customerId).update(payload);

    // Create first session
    await adminDb.collection('sessions').add({
        studentId: customerId,
        studentName: cData.name,
        trainerId: trainerId,
        trainerName: tData.name,
        status: 'Scheduled',
        scheduledDate: scheduledDate.toISOString(),
        startOtp,
        endOtp,
        startOtpExpiry: scheduledDate.toISOString(),
        createdAt: new Date().toISOString(),
    });

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

    // Update scheduled session if it exists
    const sessionsSnap = await adminDb.collection('sessions')
        .where('studentId', '==', customerId)
        .where('status', '==', 'Scheduled')
        .limit(1)
        .get();
    
    if (!sessionsSnap.empty) {
        await sessionsSnap.docs[0].ref.update({
            trainerId: newTrainerId,
            trainerName: tDoc.data()?.name
        });
    }

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

    // Cancel scheduled session
    const sessionsSnap = await adminDb.collection('sessions')
        .where('studentId', '==', customerId)
        .where('status', '==', 'Scheduled')
        .limit(1)
        .get();
    
    if (!sessionsSnap.empty) {
        await sessionsSnap.docs[0].ref.update({ status: 'Cancelled' });
    }

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
