
import type { UserProfile, LessonRequest, SummaryData, VehicleType, Course, CourseModule, CustomerRegistrationFormValues, TrainerRegistrationFormValues, ApprovalStatusType, RescheduleRequest, RescheduleRequestStatusType, UserProfileUpdateValues, TrainerSummaryData, Feedback, LessonProgressData, Referral, PayoutStatusType, QuizSet, Question, CourseModuleFormValues, QuizQuestionFormValues, FaqItem, BlogPost, SiteBanner, PromotionalPoster, FaqFormValues, BlogPostFormValues, VisualContentFormValues, FullCustomerDetailsValues } from '@/types';
import { addDays, format, isFuture, parse } from 'date-fns';
import { Car, Bike, FileText } from 'lucide-react';
import { db, isFirebaseConfigured } from './firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, writeBatch, documentId, orderBy, limit, setDoc, onSnapshot } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { uploadFile } from './server-actions'; 


// =================================================================
// USER MANAGEMENT - WRITE & ONE-TIME READ OPERATIONS
// =================================================================
export async function getOrCreateUser(firebaseUser: FirebaseUser): Promise<UserProfile | null> {
    if (!db) return null;
    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() } as UserProfile;
    } else {
        // This path is for brand new users, typically from Google Sign-In for the first time
        const newUser: Omit<UserProfile, 'id'> = {
            uniqueId: `CU-${generateId().slice(-6).toUpperCase()}`,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
            username: firebaseUser.email || '',
            contact: firebaseUser.email || '',
            phone: firebaseUser.phoneNumber || '',
            gender: 'Prefer not to say',
            location: 'TBD',
            subscriptionPlan: 'None',
            registrationTimestamp: format(new Date(), 'MMM dd, yyyy'),
            approvalStatus: 'Pending',
            myReferralCode: `${(firebaseUser.displayName || 'USER').split(' ')[0].toUpperCase()}${generateId().slice(-4)}`,
            photoURL: firebaseUser.photoURL || `https://placehold.co/100x100.png?text=${(firebaseUser.displayName || 'U').charAt(0)}`,
            totalReferralPoints: 0,
        };
        try {
            await setDoc(userRef, newUser);
            return { id: userRef.id, ...newUser };
        } catch(error: any) {
            console.error("Error creating new user in Firestore:", error);
            return null;
        }
    }
};

export const authenticateUserByCredentials = async (username: string, password: string): Promise<UserProfile | null> => {
    // This is a mock authentication for the sample admin user.
    if (username === 'admin' && password === 'admin') {
        const adminUser: UserProfile = {
            id: 'admin-user-id',
            uniqueId: 'AD-001',
            name: 'Admin User',
            username: 'admin',
            contact: 'admin@drivergy.in',
            subscriptionPlan: 'Admin',
            approvalStatus: 'Approved',
            registrationTimestamp: format(new Date(), 'MMM dd, yyyy'),
            location: 'HQ',
            gender: 'Other',
            isAdmin: true,
        };
        return adminUser;
    }
    
    // Fallback to Firebase for other users if needed (or keep it separate)
    if (!db) return null;
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", username), where("password", "==", password), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) return null;

        const userDoc = querySnapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() } as UserProfile;
    } catch (error: any) {
        console.error("Error authenticating user:", error);
        return null;
    }
};

export async function fetchUserById(userId: string): Promise<UserProfile | null> {
    if (!db || !userId) return null;
    try {
        let userQuery;
        // Check if the ID is a Firebase Auth UID or a Drivergy uniqueId
        if (userId.startsWith('CU-') || userId.startsWith('TR-') || userId.startsWith('AD-')) {
            userQuery = query(collection(db, 'users'), where('uniqueId', '==', userId), limit(1));
        } else {
            // Assume it's a Firestore document ID (which is the Firebase Auth UID)
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) return null;
            const user = { id: userSnap.id, ...userSnap.data() } as UserProfile;
            if (user.uniqueId?.startsWith('CU') && user.assignedTrainerId) {
                const trainerSnap = await getDoc(doc(db, "users", user.assignedTrainerId));
                if (trainerSnap.exists()) {
                    const trainer = trainerSnap.data() as UserProfile;
                    user.assignedTrainerPhone = trainer.phone;
                    user.assignedTrainerExperience = trainer.yearsOfExperience;
                    user.assignedTrainerVehicleDetails = trainer.vehicleInfo;
                }
            }
            return user;
        }

        const querySnapshot = await getDocs(userQuery);
        if (querySnapshot.empty) {
            return null;
        }

        const userDoc = querySnapshot.docs[0];
        const user = { id: userDoc.id, ...userDoc.data() } as UserProfile;

        if (user.uniqueId?.startsWith('CU') && user.assignedTrainerId) {
            const trainerRef = doc(db, "users", user.assignedTrainerId);
            const trainerSnap = await getDoc(trainerRef);
            if (trainerSnap.exists()) {
                const trainer = trainerSnap.data() as UserProfile;
                user.assignedTrainerPhone = trainer.phone;
                user.assignedTrainerExperience = trainer.yearsOfExperience;
                user.assignedTrainerVehicleDetails = trainer.vehicleInfo;
            }
        }
        return user;
    } catch(error: any) {
        console.error(`Error fetching user ${userId}:`, error);
        return null;
    }
};


export async function updateUserProfile(userId: string, data: UserProfileUpdateValues): Promise<UserProfile | null> {
    if (!db) return null;
    try {
        const updateData: { [key: string]: any } = {
            name: data.name,
            contact: data.email,
            phone: data.phone,
            location: data.district,
            flatHouseNumber: data.flatHouseNumber,
            street: data.street,
            state: data.state,
            district: data.district,
            pincode: data.pincode,
        };

        if (data.photo) {
            updateData.photoURL = await uploadFile(data.photo, `user_photos/${userId}`);
        }

        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, updateData);
        const updatedDoc = await getDoc(userRef);
        return { id: updatedDoc.id, ...updatedDoc.data() } as UserProfile;
    } catch (error: any) {
        console.error("Error updating user profile:", error);
        return null;
    }
};

export async function changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    if (!db) return false;
    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists() || userSnap.data().password !== currentPassword) {
            return false;
        }
        await updateDoc(userRef, { password: newPassword });
        return true;
    } catch (error: any) {
        console.error("Error changing password:", error);
        return false;
    }
};

export async function addCustomer(data: CustomerRegistrationFormValues): Promise<UserProfile | null> {
    if (!db) return null;

    const newUser: Omit<UserProfile, 'id'> = {
        uniqueId: `CU-${generateId().slice(-6).toUpperCase()}`,
        name: data.name,
        username: data.username,
        password: data.password,
        contact: data.email,
        phone: data.phone,
        gender: data.gender,
        location: "TBD", // To be determined
        subscriptionPlan: "None", // Start with no plan
        registrationTimestamp: format(new Date(), 'MMM dd, yyyy'),
        approvalStatus: 'Pending', // Pending profile completion
        myReferralCode: `${data.name.split(' ')[0].toUpperCase()}${generateId().slice(-4)}`,
        photoURL: `https://placehold.co/100x100.png?text=${data.name.charAt(0)}`,
        totalReferralPoints: 0,
    };

    try {
        const userRef = doc(collection(db, 'users'));
        await setDoc(userRef, newUser);
        return { id: userRef.id, ...newUser };
    } catch (error: any) {
        console.error("Error adding customer:", error);
        return null;
    }
};

export async function completeCustomerProfile(userId: string, data: FullCustomerDetailsValues): Promise<boolean> {
    if (!db) return false;
    const getLessonsForPlan = (plan: string): number => ({ Premium: 20, Gold: 15, Basic: 10 }[plan] || 0);

    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            throw new Error("User profile not found.");
        }
        const user = userSnap.data();

        const photoIdUrl = await uploadFile(data.photoIdFile, `user_documents/${userId}`);
        const profileData = {
            subscriptionPlan: data.subscriptionPlan,
            vehicleInfo: data.vehiclePreference,
            trainerPreference: data.trainerPreference,
            flatHouseNumber: data.flatHouseNumber,
            street: data.street,
            district: data.district,
            state: data.state,
            pincode: data.pincode,
            location: data.district, // Set primary location from district
            dlStatus: data.dlStatus,
            dlNumber: data.dlNumber || '',
            dlTypeHeld: data.dlTypeHeld || '',
            photoIdType: data.photoIdType,
            photoIdNumber: data.photoIdNumber,
            photoIdUrl: photoIdUrl,
            subscriptionStartDate: format(data.subscriptionStartDate, 'MMM dd, yyyy'),
            totalLessons: getLessonsForPlan(data.subscriptionPlan),
            completedLessons: 0,
            approvalStatus: 'Pending' as ApprovalStatusType, // Now pending admin assignment
        };

        await updateDoc(userRef, profileData);

        // Create the lesson request for the admin
        const newRequestData: Omit<LessonRequest, 'id'> = {
            customerId: userId,
            customerName: user.name,
            vehicleType: data.vehiclePreference as VehicleType,
            status: 'Pending',
            requestTimestamp: new Date().toISOString(),
        };
        const newRequestRef = doc(collection(db, 'lessonRequests'));
        await setDoc(newRequestRef, newRequestData);
        return true;
    } catch (error: any) {
        console.error("Error completing customer profile:", error);
        if (error instanceof Error && error.message.includes("Cloudinary configuration")) {
            throw new Error("Cannot upload file: Server storage is not configured. Please contact support.");
        }
        throw new Error("An unexpected error occurred during profile update.");
    }
};

export async function assignTrainerToCustomer(customerId: string, trainerId: string): Promise<boolean> {
    if (!db) return false;
    try {
        const customerRef = doc(db, "users", customerId);
        const customerSnap = await getDoc(customerRef);
        const trainerSnap = await getDoc(doc(db, "users", trainerId));

        if (!customerSnap.exists() || !trainerSnap.exists()) {
            throw new Error("Assign Trainer Error: Customer or Trainer document not found.");
        }

        const customerData = customerSnap.data() as UserProfile;
        const trainerData = trainerSnap.data() as UserProfile;

        // Update customer to 'In Progress' and assign trainer details
        await updateDoc(customerRef, {
            approvalStatus: 'In Progress',
            assignedTrainerId: trainerId,
            assignedTrainerName: trainerData.name
        });
        return true;
    } catch (error: any) {
        console.error("Error assigning trainer:", error);
        return false;
    }
};


export async function updateAssignmentStatusByTrainer(customerId: string, newStatus: 'Approved' | 'Rejected'): Promise<boolean> {
    if (!db) return false;
    try {
        const customerRef = doc(db, "users", customerId);
        const updates: { [key: string]: any } = { approvalStatus: newStatus };

        if (newStatus === 'Approved') {
            const customerSnap = await getDoc(customerRef);
            if(!customerSnap.exists()) return false;
            const user = customerSnap.data() as UserProfile;
            const startDate = parse(user.subscriptionStartDate!, 'MMM dd, yyyy', new Date());
            const firstLessonDate = addDays(startDate, 2);
            firstLessonDate.setHours(9, 0, 0, 0);
            updates.upcomingLesson = format(firstLessonDate, 'MMM dd, yyyy, h:mm a');

            // Update lesson request to 'Active'
            const requestQuery = query(collection(db, 'lessonRequests'), where('customerId', '==', customerId));
            const requestSnapshot = await getDocs(requestQuery);
            if (!requestSnapshot.empty) {
                const requestDocRef = requestSnapshot.docs[0].ref;
                await updateDoc(requestDocRef, { status: 'Active' });
            }

        } else { // If trainer rejects
            updates.assignedTrainerId = null;
            updates.assignedTrainerName = null;
            updates.approvalStatus = 'Pending'; // Return to admin queue
        }

        await updateDoc(customerRef, updates);
        return true;
    } catch (error: any) {
        console.error("Error updating assignment by trainer:", error);
        return false;
    }
};

export async function updateUserAttendance(studentId: string, status: 'Present' | 'Absent'): Promise<boolean> {
    if (!db) return false;
    try {
        const studentRef = doc(db, "users", studentId);
        const studentSnap = await getDoc(studentRef);
        if (!studentSnap.exists()) return false;

        const studentData = studentSnap.data() as UserProfile;
        const updates: { [key: string]: any } = { attendance: status };

        if (status === 'Present' && studentData.attendance !== 'Present') {
            updates.completedLessons = (studentData.completedLessons || 0) + 1;
        }

        await updateDoc(studentRef, updates);
        return true;
    } catch(error: any) {
        console.error("Error updating attendance:", error);
        return false;
    }
};

export async function updateSubscriptionStartDate(customerId: string, newDate: Date): Promise<UserProfile | null> {
    if (!db) return null;
    const firstLessonDate = addDays(newDate, 2);
    firstLessonDate.setHours(9, 0, 0, 0);
    const updates = {
        subscriptionStartDate: format(newDate, 'MMM dd, yyyy'),
        upcomingLesson: format(firstLessonDate, 'MMM dd, yyyy, h:mm a'),
    };
    try {
        const customerRef = doc(db, 'users', customerId);
        await updateDoc(customerRef, updates);
        const updatedSnap = await getDoc(customerRef);
        return updatedSnap.exists() ? { id: updatedSnap.id, ...updatedSnap.data() } as UserProfile : null;
    } catch(error: any) {
        console.error("Error updating start date:", error);
        return null;
    }
}

// =================================================================
// REAL-TIME LISTENERS
// =================================================================

export function listenToAllLessonRequests(callback: (data: LessonRequest[]) => void) {
    if (!isFirebaseConfigured() || !db) {
      callback([]);
      return () => {};
    }
    const q = query(collection(db, 'lessonRequests'), orderBy('requestTimestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LessonRequest)));
    }, (error) => {
        console.error("Error listening to lesson requests:", error);
    });
}

export function listenToAllFeedback(callback: (data: Feedback[]) => void) {
    if (!isFirebaseConfigured() || !db) {
      callback([]);
      return () => {};
    }
    const q = query(collection(db, 'feedback'), orderBy('submissionDate', 'desc'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback)));
    }, (error) => {
        console.error("Error listening to feedback:", error);
    });
}

export function listenToAllReferrals(callback: (data: Referral[]) => void) {
    if (!isFirebaseConfigured() || !db) {
      callback([]);
      return () => {};
    }
    const q = query(collection(db, "referrals"), orderBy("timestamp", "desc"));
    return onSnapshot(q, async (snapshot) => {
        const referrals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));
        if (referrals.length === 0) {
            callback([]);
            return;
        }

        const refereeIds = [...new Set(referrals.map(r => r.refereeId))].filter(Boolean);
        if (refereeIds.length === 0) {
            callback(referrals);
            return;
        }

        const usersMap = new Map<string, UserProfile>();
        for (let i = 0; i < refereeIds.length; i += 30) {
            const batchIds = refereeIds.slice(i, i + 30);
            const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', batchIds));
            const usersSnapshot = await getDocs(usersQuery);
            usersSnapshot.forEach(doc => usersMap.set(doc.id, { id: doc.id, ...doc.data() } as UserProfile));
        }

        const enrichedReferrals = referrals.map(ref => {
            const referee = usersMap.get(ref.refereeId);
            return {
                ...ref,
                refereeUniqueId: referee?.uniqueId,
                refereeSubscriptionPlan: referee?.subscriptionPlan,
                refereeApprovalStatus: referee?.approvalStatus,
            };
        });
        callback(enrichedReferrals);
    }, (error) => {
        console.error("Error listening to referrals:", error);
    });
};

export function listenToQuizSets(callback: (data: QuizSet[]) => void) {
    if (!isFirebaseConfigured() || !db) {
      callback([]);
      return () => {};
    }
    return onSnapshot(collection(db, 'quizSets'), (snapshot) => {
      if (snapshot.empty) {
        callback([]);
      } else {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizSet)));
      }
    }, (error) => {
        console.error("Error listening to quiz sets:", error);
        callback([]);
    });
}
export function listenToPromotionalPosters(callback: (data: PromotionalPoster[]) => void) {
    if (!isFirebaseConfigured() || !db) {
      callback([]);
      return () => {};
    }
    return onSnapshot(collection(db, 'promotionalPosters'), (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromotionalPoster)));
    }, (error) => {
        console.error("Error listening to promotional posters:", error);
    });
}
export function listenToCourses(callback: (data: Course[]) => void) {
    if (!isFirebaseConfigured() || !db) {
      callback([]);
      return () => {};
    }
    return onSnapshot(collection(db, 'courses'), (snapshot) => {
        const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
        callback(reAssignCourseIcons(courses));
    }, (error) => {
        console.error("Error listening to courses:", error);
    });
}

export function listenToFaqs(callback: (data: FaqItem[]) => void) {
    if (!isFirebaseConfigured() || !db) {
      callback([]);
      return () => {};
    }
    return onSnapshot(collection(db, 'faqs'), (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FaqItem)));
    }, (error) => {
        console.error("Error listening to faqs:", error);
    });
}

export function listenToBlogPosts(callback: (data: BlogPost[]) => void) {
    if (!isFirebaseConfigured() || !db) {
      callback([]);
      return () => {};
    }
    const q = query(collection(db, 'blogPosts'), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({...doc.data(), slug: doc.id } as BlogPost)));
    }, (error) => {
        console.error("Error listening to blog posts:", error);
    });
}
export function listenToSiteBanners(callback: (data: SiteBanner[]) => void) {
    if (!isFirebaseConfigured() || !db) {
      callback([]);
      return () => {};
    }
    return onSnapshot(collection(db, 'siteBanners'), (snapshot) => {
        if(snapshot.empty) {
            callback([]);
            return;
        }
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SiteBanner)));
    }, (error) => {
        console.error("Error listening to site banners:", error);
        callback([]);
    });
}

export function listenToUser(userId: string, callback: (data: UserProfile | null) => void) {
    if (!isFirebaseConfigured() || !db) {
      callback(null);
      return () => {};
    }
    return onSnapshot(doc(db!, 'users', userId), async (snap) => {
        if (!snap.exists()) {
            callback(null);
            return;
        }
        const user = { id: snap.id, ...snap.data() } as UserProfile;
        if (user.uniqueId?.startsWith('CU') && user.assignedTrainerId) {
            const trainerSnap = await getDoc(doc(db!, "users", user.assignedTrainerId));
            if (trainerSnap.exists()) {
                const trainer = trainerSnap.data() as UserProfile;
                user.assignedTrainerPhone = trainer.phone;
                user.assignedTrainerExperience = trainer.yearsOfExperience;
                user.assignedTrainerVehicleDetails = trainer.vehicleInfo;
            }
        }
        callback(user);
    }, (error) => {
        console.error(`Error listening to user ${userId}:`, error);
    });
};

export function listenToTrainerStudents(trainerId: string, callback: (students: UserProfile[], feedback: Feedback[]) => void) {
    if (!isFirebaseConfigured() || !db) {
      callback([], []);
      return () => {};
    }
    const studentsQuery = query(collection(db!, "users"), where("assignedTrainerId", "==", trainerId));
    const feedbackQuery = query(collection(db!, 'feedback'), where('trainerId', '==', trainerId));

    const unsubStudents = onSnapshot(studentsQuery, () => {
        Promise.all([getDocs(studentsQuery), getDocs(feedbackQuery)]).then(([studentsSnap, feedbackSnap]) => {
            const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
            const feedback = feedbackSnap.docs.map(d => ({ id: d.id, ...d.data() } as Feedback));
            callback(students, feedback);
        }).catch(err => console.error("Error fetching trainer student data:", err));
    }, (err) => console.error("Student listener error:", err));

    const unsubFeedback = onSnapshot(feedbackQuery, () => {
        Promise.all([getDocs(studentsQuery), getDocs(feedbackQuery)]).then(([studentsSnap, feedbackSnap]) => {
            const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
            const feedback = feedbackSnap.docs.map(d => ({ id: d.id, ...d.data() } as Feedback));
            callback(students, feedback);
        }).catch(err => console.error("Error fetching trainer feedback data:", err));
    }, (err) => console.error("Feedback listener error:", err));

    return () => {
        unsubStudents();
        unsubFeedback();
    };
}


// =================================================================
// CALCULATED/AGGREGATED DATA LISTENERS
// =================================================================

export function listenToSummaryData(callback: (data: Partial<SummaryData>) => void) {
    if (!isFirebaseConfigured() || !db) {
      callback({});
      return () => {};
    }
    const usersUnsub = onSnapshot(collection(db!, 'users'), (snap) => {
        const users = snap.docs.map(doc => doc.data() as UserProfile);
        const totalCustomers = users.filter(u => u.uniqueId?.startsWith('CU')).length;
        const totalInstructors = users.filter(u => u.uniqueId?.startsWith('TR')).length;
        const activeSubscriptions = users.filter(u => u.approvalStatus === 'Approved').length;
        const totalCertifiedTrainers = users.filter(u => u.uniqueId?.startsWith('TR') && u.approvalStatus === 'Approved').length;
        const totalEarnings = users.filter(u => u.approvalStatus === 'Approved' && u.subscriptionPlan !== 'Trainer').reduce((acc, user) => {
            if (user.subscriptionPlan === 'Premium') return acc + 9999;
            if (user.subscriptionPlan === 'Gold') return acc + 7499;
            if (user.subscriptionPlan === 'Basic') return acc + 3999;
            return acc;
        }, 0);

        callback({ totalCustomers, totalInstructors, activeSubscriptions, totalCertifiedTrainers, totalEarnings });
    }, (error) => {
      console.error("Error listening to users for summary:", error);
    });

    const requestsUnsub = onSnapshot(query(collection(db!, 'lessonRequests'), where('status', '==', 'Pending')), (snap) => {
        callback(prev => ({ ...prev, pendingRequests: snap.size }));
    }, (error) => {
      console.error("Error listening to lessonRequests for summary:", error);
    });

    const rescheduleUnsub = onSnapshot(query(collection(db!, 'rescheduleRequests'), where('status', '==', 'Pending')), (snap) => {
        callback(prev => ({ ...prev, pendingRescheduleRequests: snap.size }));
    }, (error) => {
      console.error("Error listening to rescheduleRequests for summary:", error);
    });

    return () => {
        usersUnsub();
        requestsUnsub();
        rescheduleUnsub();
    };
};

export function listenToCustomerLessonProgress(callback: (data: LessonProgressData[]) => void) {
    if (!isFirebaseConfigured() || !db) {
      callback([]);
      return () => {};
    }
    const q = query(collection(db!, 'users'), where('approvalStatus', '==', 'Approved'));
    return onSnapshot(q, (snapshot) => {
        const users = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as UserProfile))
            .filter(u => u.assignedTrainerName);

        const progressData = users.map(c => ({
            studentId: c.uniqueId,
            studentName: c.name,
            trainerName: c.assignedTrainerName!,
            subscriptionPlan: c.subscriptionPlan,
            totalLessons: c.totalLessons || 0,
            completedLessons: c.completedLessons || 0,
            remainingLessons: (c.totalLessons || 0) - (c.completedLessons || 0),
        })).sort((a, b) => a.remainingLessons - b.remainingLessons);

        callback(progressData);
    }, (error) => {
      console.error("Error listening to lesson progress:", error);
    });
};

// =================================================================
// WRITE OPERATIONS (No changes needed for real-time, they trigger listeners)
// =================================================================

export async function addRescheduleRequest(userId: string, customerName: string, originalDate: Date, newDate: Date): Promise<RescheduleRequest | null> {
    if (!db) return null;
    const newRequest = {
        userId, customerName,
        originalLessonDate: format(originalDate, 'MMM dd, yyyy, h:mm a'),
        requestedRescheduleDate: format(newDate, 'MMM dd, yyyy, h:mm a'),
        status: 'Pending' as RescheduleRequestStatusType,
        requestTimestamp: new Date().toISOString(),
    };

    try {
        const docRef = await addDoc(collection(db, 'rescheduleRequests'), newRequest);
        return { id: docRef.id, ...newRequest };
    } catch(error: any) {
        console.error("Error adding reschedule request:", error);
        return null;
    }
};

export async function updateRescheduleRequestStatus(requestId: string, newStatus: RescheduleRequestStatusType): Promise<boolean> {
    if (!db) return false;
    try {
        const requestRef = doc(db, 'rescheduleRequests', requestId);
        await updateDoc(requestRef, { status: newStatus });
        if (newStatus === 'Approved') {
            const requestSnap = await getDoc(requestRef);
            if (!requestSnap.exists()) return false;
            const requestData = requestSnap.data() as RescheduleRequest;
            await updateDoc(doc(db, 'users', requestData.userId), { upcomingLesson: requestData.requestedRescheduleDate });
        }
        return true;
    } catch(error: any) {
        console.error("Error updating reschedule request:", error);
        return false;
    }
};

export async function addFeedback(customerId: string, customerName: string, trainerId: string, trainerName: string, rating: number, comment: string): Promise<boolean> {
    if (!db) return false;
    const newFeedback: Omit<Feedback, 'id'> = { customerId, customerName, trainerId, trainerName, rating, comment, submissionDate: new Date().toISOString() };
    try {
        await addDoc(collection(db, 'feedback'), newFeedback);
        await updateDoc(doc(db, 'users', customerId), { feedbackSubmitted: true });
        return true;
    } catch(error: any) {
        console.error("Error adding feedback:", error);
        return false;
    }
};

export async function updateReferralPayoutStatus(referralId: string, status: PayoutStatusType): Promise<boolean> {
    if (!db) return false;
    try {
        await updateDoc(doc(db, 'referrals', referralId), { payoutStatus: status });
        return true;
    } catch(error: any) {
        console.error("Error updating referral status:", error);
        return false;
    }
};


export async function addCourseModule(courseId: string, moduleData: Omit<CourseModule, 'id'>): Promise<Course | null> {
    if (!db) return null;
    try {
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);
        if (!courseSnap.exists()) return null;
        const course = courseSnap.data() as Course;
        const newModule = { ...moduleData, id: generateId() };
        const updatedModules = [...(course.modules || []), newModule];
        await updateDoc(courseRef, { modules: updatedModules });
        return { ...course, modules: updatedModules, id: courseId };
    } catch (error: any) {
        console.error("Error adding course module:", error);
        return null;
    }
};

export async function updateCourseModule(courseId: string, moduleId: string, moduleData: CourseModuleFormValues): Promise<Course | null> {
    if (!db) return null;
    try {
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);
        if (!courseSnap.exists()) return null;
        const course = courseSnap.data() as Course;
        const updatedModules = course.modules.map(m => m.id === moduleId ? { ...m, ...moduleData } : m);
        await updateDoc(courseRef, { modules: updatedModules });
        return { ...course, modules: updatedModules, id: courseId };
    } catch (error: any) {
        console.error("Error updating course module:", error);
        return null;
    }
};

export async function deleteCourseModule(courseId: string, moduleId: string): Promise<boolean> {
    if (!db) return false;
    try {
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);
        if (!courseSnap.exists()) return false;
        const course = courseSnap.data() as Course;
        const updatedModules = course.modules.filter(m => m.id !== moduleId);
        await updateDoc(courseRef, { modules: updatedModules });
        return true;
    } catch(error: any) {
        console.error("Error deleting course module:", error);
        return false;
    }
};

export async function updateQuizQuestion(quizSetId: string, questionId: string, data: QuizQuestionFormValues): Promise<QuizSet | null> {
    if (!db) return null;
    try {
        const setRef = doc(db, 'quizSets', quizSetId);
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
    } catch(error: any) {
        console.error("Error updating quiz question:", error);
        return null;
    }
};


export async function addFaq(data: FaqFormValues): Promise<FaqItem | null> {
    if (!db) return null;
    try {
        const docRef = await addDoc(collection(db, 'faqs'), data);
        return { id: docRef.id, ...data };
    } catch (error: any) {
        console.error("Error adding FAQ:", error);
        return null;
    }
}

export async function updateFaq(id: string, data: FaqFormValues): Promise<boolean> {
    if (!db) return false;
    try {
        await updateDoc(doc(db, 'faqs', id), data);
        return true;
    } catch (error: any) {
        console.error("Error updating FAQ:", error);
        return false;
    }
}

export async function deleteFaq(id: string): Promise<boolean> {
    if (!db) return false;
    try {
        await deleteDoc(doc(db, 'faqs', id));
        return true;
    } catch(error: any) {
        console.error("Error deleting FAQ:", error);
        return false;
    }
}

export async function addBlogPost(data: BlogPostFormValues): Promise<BlogPost | null> {
    if (!db) return null;
    try {
        let imageUrl = data.imageSrc || 'https://placehold.co/1200x800.png';
        if (data.imageFile) {
            imageUrl = await uploadFile(data.imageFile, 'blog_images');
        }

        const newPostData: Omit<BlogPost, 'slug'> = {
            title: data.title,
            category: data.category,
            excerpt: data.excerpt,
            content: data.content,
            author: data.author,
            date: format(new Date(), 'LLL d, yyyy'),
            imageSrc: imageUrl,
            imageHint: data.imageHint,
            tags: data.tags,
        };
        
        const docRef = doc(db, 'blogPosts', data.slug);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            throw new Error("A blog post with this slug already exists.");
        }

        await setDoc(docRef, newPostData);
        
        return {
            slug: docRef.id,
            ...newPostData
        };

    } catch (error: any) {
        console.error("Error adding blog post:", error);
        return null;
    }
};

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    if (!isFirebaseConfigured() || !db) return null;
    try {
        const docRef = doc(db!, 'blogPosts', slug);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) return null;
        return { slug: snapshot.id, ...snapshot.data() } as BlogPost;
    } catch (error: any) {
        console.error("Error fetching blog post by slug:", error);
        return null;
    }
};

export async function updateBlogPost(slug: string, data: BlogPostFormValues): Promise<boolean> {
    if (!db) return false;
    try {
        const docRef = doc(db, 'blogPosts', slug);
        const updateData: Partial<BlogPostFormValues> = { ...data };
        if(data.imageFile) {
            updateData.imageSrc = await uploadFile(data.imageFile, 'blog_images');
        }
        delete updateData.imageFile;

        await updateDoc(docRef, updateData as any);
        return true;
    } catch(error: any) {
        console.error("Error updating blog post:", error);
        return false;
    }
}

export async function deleteBlogPost(slug: string): Promise<boolean> {
    if (!db) return false;
    try {
        await deleteDoc(doc(db, 'blogPosts', slug));
        return true;
    } catch(error: any) {
        console.error("Error deleting blog post:", error);
        return false;
    }
}

export async function updateSiteBanner(id: string, data: VisualContentFormValues): Promise<boolean> {
    if (!db) return false;
    try {
        const updateData: Partial<VisualContentFormValues> = { ...data };
        if (data.imageFile) {
            updateData.imageSrc = await uploadFile(data.imageFile, 'site_visuals');
        }
        delete updateData.imageFile; // Always remove the file object before updating DB

        // Ensure all fields are included in the update
        await updateDoc(doc(db, 'siteBanners', id), {
            title: updateData.title,
            description: updateData.description,
            imageSrc: updateData.imageSrc,
            imageHint: updateData.imageHint,
        });
        return true;
    } catch (error: any) {
        console.error("Error updating site banner:", error);
        return false;
    }
};

export async function updatePromotionalPoster(id: string, data: VisualContentFormValues): Promise<boolean> {
    if (!db) return false;
    try {
        const updateData: Partial<VisualContentFormValues> = { ...data };
        if (data.imageFile) {
            updateData.imageSrc = await uploadFile(data.imageFile, 'site_visuals');
        }
        delete updateData.imageFile;

        // Ensure all fields are included in the update
        await updateDoc(doc(db, 'promotionalPosters', id), {
            title: updateData.title,
            description: updateData.description,
            imageSrc: updateData.imageSrc,
            imageHint: updateData.imageHint,
            href: updateData.href,
        });
        return true;
    } catch (error: any) {
        console.error("Error updating promotional poster:", error);
        return false;
    }
};

// This one-time fetch is still needed for pages that don't need real-time updates.
export async function fetchCourses(): Promise<Course[]> {
    if (!isFirebaseConfigured() || !db) {
      return [];
    }
    try {
        const snapshot = await getDocs(collection(db!, "courses"));
        const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Course);
        return reAssignCourseIcons(courses);
    } catch (error: any) {
        console.error("Error fetching courses:", error);
        return [];
    }
};

export async function fetchQuizSets(): Promise<QuizSet[]> {
    if (!isFirebaseConfigured() || !db) {
      return [];
    }
    try {
        const snapshot = await getDocs(collection(db!, "quizSets"));
        if (snapshot.empty) {
            return [];
        }
        const sets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as QuizSet);
        return sets;
    } catch (error: any) {
        console.error("Error fetching quiz sets:", error);
        return [];
    }
};


export async function fetchApprovedInstructors(filters: { location?: string; gender?: string } = {}): Promise<UserProfile[]> {
    if (!db) return [];
    try {
        const q = query(
            collection(db, "users"),
            where("approvalStatus", "==", "Approved"),
            where("subscriptionPlan", "==", "Trainer")
        );
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as UserProfile))
            .filter(u =>
                (!filters.location || u.location === filters.location) &&
                (!filters.gender || u.gender === filters.gender)
            );
    } catch (error: any) {
        console.error("Error fetching approved instructors:", error);
        return [];
    }
};

export async function fetchReferralsByUserId(userId: string | undefined): Promise<Referral[]> {
    if (!db || !userId) return [];
    try {
        const q = query(collection(db, "referrals"), where("referrerId", "==", userId));
        const querySnapshot = await getDocs(q);

        const referrals = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Referral));

        if (referrals.length === 0) return [];

        const refereeIds = referrals.map(r => r.refereeId);
        if(refereeIds.length === 0) return referrals;

        const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', refereeIds));
        const usersSnapshot = await getDocs(usersQuery);
        const usersMap = new Map<string, UserProfile>();
        usersSnapshot.forEach(doc => usersMap.set(doc.id, { id: doc.id, ...doc.data() } as UserProfile));

        return referrals.map(ref => {
            const referee = usersMap.get(ref.refereeId);
            return {
                ...ref,
                refereeUniqueId: referee?.uniqueId,
                refereeSubscriptionPlan: referee?.subscriptionPlan,
                refereeApprovalStatus: referee?.approvalStatus,
            };
        });
    } catch (error: any) {
        console.error("Error fetching user referrals:", error);
        return [];
    }
};
// =================================================================
// UTILITY & MOCK HELPERS
// =================================================================
const generateId = (): string => {
    return Math.random().toString(36).substring(2, 10);
};

const reAssignCourseIcons = (coursesToHydrate: Course[]): Course[] => {
    return coursesToHydrate.map(course => {
        let newIcon;
        if (course.id === 'course1') newIcon = Car;
        else if (course.id === 'course2') newIcon = Bike;
        else if (course.id === 'course3') newIcon = FileText;
        else newIcon = FileText; // Default icon
        return { ...course, icon: newIcon };
    });
};

    

    