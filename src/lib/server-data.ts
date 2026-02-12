
'use server';

import type { BlogPost, UserProfile, Course, QuizSet, Product, Feedback, FaqItem } from '@/types';
import { adminAuth, adminDb } from './firebase/admin';
import { format } from 'date-fns';

// This file is for server-side data fetching and data seeding logic only.

/**
 * Creates a default admin user in Firebase Auth and Firestore if it doesn't exist.
 */
const createDefaultAdmin = async () => {
    if (!adminAuth || !adminDb) {
        console.error("Admin SDK not initialized. Cannot create default admin.");
        return;
    }

    const adminEmail = 'admin@drivergy.com';
    const adminPassword = 'password';

    try {
        await adminAuth.getUserByEmail(adminEmail);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            try {
                const userRecord = await adminAuth.createUser({
                    email: adminEmail,
                    emailVerified: true,
                    password: adminPassword,
                    displayName: 'Admin User',
                    disabled: false,
                });

                const adminProfile: Omit<UserProfile, 'id'> = {
                    uniqueId: `AD-${userRecord.uid.slice(0, 6).toUpperCase()}`,
                    name: 'Admin User',
                    username: 'admin',
                    contact: adminEmail,
                    phone: '0000000000',
                    gender: 'Prefer not to say',
                    subscriptionPlan: 'Admin',
                    registrationTimestamp: new Date().toISOString(),
                    approvalStatus: 'Approved',
                    isAdmin: true,
                    userRole: 'admin',
                };

                await adminDb.collection('users').doc(userRecord.uid).set(adminProfile);
            } catch (creationError) {
                console.error('Error creating default admin user:', creationError);
            }
        }
    }
};

/**
 * Creates a Content Manager user with limited dashboard access.
 */
const createContentManager = async () => {
    if (!adminAuth || !adminDb) return;

    const managerEmail = 'content@drivergy.in';
    const managerPassword = 'password';

    try {
        await adminAuth.getUserByEmail(managerEmail);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            try {
                const userRecord = await adminAuth.createUser({
                    email: managerEmail,
                    emailVerified: true,
                    password: managerPassword,
                    displayName: 'Content Manager',
                    disabled: false,
                });

                const managerProfile: Omit<UserProfile, 'id'> = {
                    uniqueId: `CM-${userRecord.uid.slice(0, 6).toUpperCase()}`,
                    name: 'Content Manager',
                    username: 'contentmanager',
                    contact: managerEmail,
                    phone: '1111111111',
                    gender: 'Prefer not to say',
                    subscriptionPlan: 'Admin',
                    registrationTimestamp: new Date().toISOString(),
                    approvalStatus: 'Approved',
                    isAdmin: true,
                    userRole: 'admin',
                };

                await adminDb.collection('users').doc(userRecord.uid).set(managerProfile);
                console.log('Successfully created Content Manager user.');
            } catch (e) {
                console.error('Error seeding content manager:', e);
            }
        }
    }
}

/**
 * Creates a Revenue Manager user with limited dashboard access.
 */
const createRevenueManager = async () => {
    if (!adminAuth || !adminDb) return;

    const managerEmail = 'revenue@drivergy.in';
    const managerPassword = 'password';

    try {
        await adminAuth.getUserByEmail(managerEmail);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            try {
                const userRecord = await adminAuth.createUser({
                    email: managerEmail,
                    emailVerified: true,
                    password: managerPassword,
                    displayName: 'Revenue Manager',
                    disabled: false,
                });

                const managerProfile: Omit<UserProfile, 'id'> = {
                    uniqueId: `RM-${userRecord.uid.slice(0, 6).toUpperCase()}`,
                    name: 'Revenue Manager',
                    username: 'revenuemanager',
                    contact: managerEmail,
                    phone: '2222222222',
                    gender: 'Prefer not to say',
                    subscriptionPlan: 'Admin',
                    registrationTimestamp: new Date().toISOString(),
                    approvalStatus: 'Approved',
                    isAdmin: true,
                    userRole: 'admin',
                };

                await adminDb.collection('users').doc(userRecord.uid).set(managerProfile);
                console.log('Successfully created Revenue Manager user.');
            } catch (e) {
                console.error('Error seeding revenue manager:', e);
            }
        }
    }
}

/**
 * Creates an Operations Manager user with specialized dashboard access.
 */
const createOperationsManager = async () => {
    if (!adminAuth || !adminDb) return;

    const managerEmail = 'operations@drivergy.in';
    const managerPassword = 'password';

    try {
        await adminAuth.getUserByEmail(managerEmail);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            try {
                const userRecord = await adminAuth.createUser({
                    email: managerEmail,
                    emailVerified: true,
                    password: managerPassword,
                    displayName: 'Operations Manager',
                    disabled: false,
                });

                const managerProfile: Omit<UserProfile, 'id'> = {
                    uniqueId: `OM-${userRecord.uid.slice(0, 6).toUpperCase()}`,
                    name: 'Operations Manager',
                    username: 'operationsmanager',
                    contact: managerEmail,
                    phone: '3333333333',
                    gender: 'Prefer not to say',
                    subscriptionPlan: 'Admin',
                    registrationTimestamp: new Date().toISOString(),
                    approvalStatus: 'Approved',
                    isAdmin: true,
                    userRole: 'admin',
                };

                await adminDb.collection('users').doc(userRecord.uid).set(managerProfile);
                console.log('Successfully created Operations Manager user.');
            } catch (e) {
                console.error('Error seeding operations manager:', e);
            }
        }
    }
}

export const seedPromotionalPosters = async () => {
    if (!adminDb) {
        console.error("Admin DB not initialized. Cannot seed promotional posters.");
        return;
    }

    const postersRef = adminDb.collection('promotionalPosters');
    const snapshot = await postersRef.limit(1).get();

    if (snapshot.empty) {
        console.log("Seeding promotional posters...");
        const posters = [
            {
                id: 'poster-1',
                href: '/#subscriptions',
                imageSrc: 'https://placehold.co/600x800/ef4444/ffffff.png',
                imageHint: 'discount offer driving',
                title: 'Monsoon Special!',
                description: 'Get 20% off on all Premium driving courses. Limited time offer!',
            },
            {
                id: 'poster-2',
                href: '/#courses',
                imageSrc: 'https://placehold.co/600x800/3b82f6/ffffff.png',
                imageHint: 'motorcycle safety gear',
                title: 'New Bike Safety Course',
                description: 'Master the two-wheeler with our new advanced safety course.',
            },
            {
                id: 'poster-3',
                href: '/dashboard/referrals/invite',
                imageSrc: 'https://placehold.co/600x800/22c55e/ffffff.png',
                imageHint: 'friends sharing gift',
                title: 'Refer a Friend, Get Rewards!',
                description: 'Invite your friends to Drivergy and earn points for every successful referral.',
            }
        ];

        const batch = adminDb.batch();
        posters.forEach(poster => {
            const docRef = postersRef.doc(poster.id);
            batch.set(docRef, poster);
        });
        await batch.commit();
        console.log("Promotional posters seeded successfully.");
    }
};

const seedStoreProducts = async () => {
    if (!adminDb) {
        console.error("Admin DB not initialized. Cannot seed store products.");
        return;
    }

    const productsRef = adminDb.collection('storeProducts');
    const snapshot = await productsRef.limit(1).get();

    if (snapshot.empty) {
        console.log("Seeding store products...");
        const products: Product[] = [
            {
                id: 'prod-1',
                title: 'Magnetic Car Phone Holder',
                description: 'A sturdy and reliable magnetic phone holder that mounts on your dashboard or windshield. Keeps your phone secure for easy navigation.',
                imageSrc: 'https://placehold.co/600x400/3b82f6/ffffff?text=Phone+Holder',
                imageHint: 'car phone mount',
                amazonId: 'B07Y62883J',
                flipkartId: 'MOBG937GZJ4H3G3Y',
            },
            {
                id: 'prod-2',
                title: 'Blind Spot Mirrors (2-Pack)',
                description: 'Increase your field of view and reduce blind spots with these easy-to-install, adjustable convex mirrors for your car\'s side mirrors.',
                imageSrc: 'https://placehold.co/600x400/ef4444/ffffff?text=Blind+Spot+Mirror',
                imageHint: 'car blind spot',
                amazonId: 'B01CV4ANCC',
                flipkartId: 'ACCG2HFYHHGZSZQY',
            },
            {
                id: 'prod-3',
                title: 'Digital Tyre Pressure Gauge',
                description: 'Ensure your tyres are properly inflated for safety and fuel efficiency with this easy-to-use digital pressure gauge.',
                imageSrc: 'https://placehold.co/600x400/22c55e/ffffff?text=Tyre+Gauge',
                imageHint: 'tyre pressure gauge',
                amazonId: 'B073733564',
                flipkartId: 'ACCGV5Z8GZ5GJZJG',
            },
        ];

        const batch = adminDb.batch();
        products.forEach(product => {
            const docRef = productsRef.doc(product.id);
            batch.set(docRef, product);
        });
        await batch.commit();
        console.log("Store products seeded successfully.");
    }
};

const seedFaqs = async () => {
    if (!adminDb) return;
    const faqsRef = adminDb.collection('faqs');
    const snapshot = await faqsRef.limit(1).get();

    if (snapshot.empty) {
        console.log("Seeding FAQs...");
        const faqData = [
            {
                id: "faq1",
                question: "What documents do I need to enroll in a driving course?",
                answer: "For customer registration, you'll need a valid photo ID (like Aadhaar, PAN card, or Passport). If you already have a Learner's or Permanent License, you'll be asked to provide its details. Trainers need to provide their professional certifications and vehicle documents.",
            },
            {
                id: "faq2",
                question: "Can I choose my driving instructor?",
                answer: "Yes! Our platform allows you to specify your preference for a male or female instructor during registration. We do our best to accommodate your choice based on instructor availability in your location.",
            },
            {
                id: "faq3",
                question: "How do I book a driving lesson slot?",
                answer: "Once your registration is approved and you have an active subscription, you can log in to your customer dashboard. From there, you'll be able to view available slots for your chosen instructor and book them according to your convenience.",
            },
            {
                id: "faq4",
                question: "What types of vehicles are available for training?",
                answer: "We offer training for both two-wheelers (scooters, motorcycles) and four-wheelers (manual and automatic cars). You can select your vehicle preference during registration.",
            },
            {
                id: "faq5",
                question: "What if I need to cancel or reschedule a driving lesson?",
                answer: "You can manage your bookings through your dashboard. Please refer to our cancellation policy for details on timelines to avoid any charges. We recommend rescheduling at least 24 hours in advance.",
            },
            {
                id: "faq6",
                question: "How do I redeem a coupon code for a driving course discount?",
                answer: "You can apply a coupon or referral code on the payment page when you subscribe to a plan. Look for the 'Referral/Discount Code' field, enter your code, and click 'Apply' to see the discount on your total amount.",
            },
            {
                id: "faq7",
                question: "How can I use the points earned from referrals?",
                answer: "Referral points you earn can be used to get discounts on your subscription renewals or for other services within the Drivergy platform. Currently, points cannot be withdrawn as cash but offer great value towards your learning journey.",
            },
            {
                id: "faq8",
                question: "Is the driving school completion certificate valid at the RTO?",
                answer: "Drivergy Certificates are valid at RTO office as we are authorized partner.",
            }
        ];

        const batch = adminDb.batch();
        faqData.forEach(faq => {
            batch.set(faqsRef.doc(faq.id), faq);
        });
        await batch.commit();
        console.log("FAQs seeded successfully.");
    }
};

// Call the seeding functions when the server starts up.
const initializeServerData = async () => {
    await createDefaultAdmin();
    await createContentManager();
    await createRevenueManager();
    await createOperationsManager();
    await seedStoreProducts();
    await seedFaqs();
};
initializeServerData();


/**
 * Fetches all blog posts for server-side operations like sitemap generation.
 */
export async function fetchBlogPosts(): Promise<BlogPost[]> {
    if (!adminDb) {
        console.error("Admin DB not initialized. Cannot fetch blog posts for sitemap.");
        return [];
    }
    
    try {
        const snapshot = await adminDb.collection('blog').orderBy('date', 'desc').get();
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => ({ slug: doc.id, ...doc.data() } as BlogPost));
    } catch (error) {
        console.error("Error fetching blog posts for sitemap:", error);
        return [];
    }
}

/**
 * Fetches all courses from Firestore.
 */
export async function fetchCourses(): Promise<Course[]> {
    if (!adminDb) {
        console.error("Admin DB not initialized. Cannot fetch courses.");
        return [];
    }
    
    try {
        const snapshot = await adminDb.collection('courses').get();
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
    } catch (error) {
        console.error("Error fetching courses:", error);
        return [];
    }
}

/**
 * Fetches all quiz sets from Firestore.
 */
export async function fetchQuizSets(): Promise<QuizSet[]> {
    if (!adminDb) {
        console.error("Admin DB not initialized. Cannot fetch quiz sets.");
        return [];
    }

    try {
        const snapshot = await adminDb.collection('quizSets').get();
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizSet));
    } catch (error) {
        console.error("Error fetching quiz sets:", error);
        return [];
    }
}

/**
 * Fetches all products from the storeProducts collection.
 */
export async function fetchStoreProducts(): Promise<Product[]> {
    if (!adminDb) {
        console.error("Admin DB not initialized. Cannot fetch store products.");
        return [];
    }
    
    try {
        const snapshot = await adminDb.collection('storeProducts').get();
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error) {
        console.error("Error fetching store products:", error);
        return [];
    }
}


/**
 * Fetches a single user profile from Firestore by their document ID.
 */
export async function fetchUserById(userId: string): Promise<UserProfile | null> {
    if (!adminDb) {
        console.error("Admin DB not initialized. Cannot fetch user.");
        return null;
    }

    try {
        const userDocRef = adminDb.collection('users').doc(userId);
        const trainerDocRef = adminDb.collection('trainers').doc(userId);
        
        let userDoc = await userDocRef.get();
        if (!userDoc.exists) {
            userDoc = await trainerDocRef.get();
        }

        if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData?.registrationTimestamp && typeof userData.registrationTimestamp.toDate === 'function') {
                userData.registrationTimestamp = userData.registrationTimestamp.toDate().toISOString();
            }
            return { id: userDoc.id, ...userData } as UserProfile;
        } else {
            console.log(`No user found with ID: ${userId}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching user by ID ${userId}:`, error);
        return null;
    }
}

/**
 * Fetches a single blog post by its slug (document ID).
 */
export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    if (!adminDb) {
        console.error("Admin DB not initialized. Cannot fetch blog post.");
        return null;
    }
    try {
        const docRef = adminDb.collection('blog').doc(slug);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            return { slug: docSnap.id, ...docSnap.data() } as BlogPost;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching blog post by slug ${slug}:`, error);
        return null;
    }
}

export async function fetchTrainerDashboardData(trainerId: string): Promise<{ trainerProfile: UserProfile | null, students: UserProfile[], feedback: Feedback[] }> {
    if (!adminDb) {
        console.error('Firestore not initialized.');
        return { trainerProfile: null, students: [], feedback: [] };
    }

    try {
        const [trainerProfileSnap, studentsSnap, feedbackSnap] = await Promise.all([
            adminDb.collection('trainers').doc(trainerId).get(),
            adminDb.collection('users').where('assignedTrainerId', '==', trainerId).get(),
            adminDb.collection('feedback').where('trainerId', '==', trainerId).get()
        ]);

        let trainerProfile: UserProfile | null = null;
        if (trainerProfileSnap.exists) {
            const data = trainerProfileSnap.data();
             if (data?.registrationTimestamp && typeof data.registrationTimestamp.toDate === 'function') {
                data.registrationTimestamp = data.registrationTimestamp.toDate().toISOString();
            }
            trainerProfile = { id: trainerProfileSnap.id, ...data } as UserProfile;
        }

        const students = studentsSnap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                upcomingLesson: data.upcomingLesson,
                registrationTimestamp: data.registrationTimestamp?.toDate ? data.registrationTimestamp.toDate().toISOString() : data.registrationTimestamp,
            } as UserProfile;
        });

        const feedback = feedbackSnap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                submissionDate: data.submissionDate?.toDate ? format(data.submissionDate.toDate(), 'PP') : 'N/A',
            } as Feedback;
        });

        return { trainerProfile, students, feedback };

    } catch (error) {
        console.error("Error fetching trainer dashboard data:", error);
        return { trainerProfile: null, students: [], feedback: [] };
    }
}
