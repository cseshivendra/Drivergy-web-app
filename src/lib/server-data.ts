
'use server';

import type { BlogPost, UserProfile, Course, QuizSet } from '@/types';
import { adminAuth, adminDb } from './firebase/admin';

// This file is for server-side data fetching and data seeding logic only.

/**
 * Creates default users for admin, customer, and trainer roles if they don't exist.
 * This is useful for seeding the database for development and testing.
 */
const createDefaultUsers = async () => {
    if (!adminAuth || !adminDb) {
        console.error("Admin SDK not initialized. Cannot create default users.");
        return;
    }

    const usersToCreate = [
        {
            email: 'admin@drivergy.com',
            password: 'password',
            displayName: 'Admin User',
            role: 'Admin',
            profileData: {
                uniqueId: 'AD-ADMIN', name: 'Admin User', username: 'admin',
                contact: 'admin@drivergy.com', phone: '0000000000',
                gender: 'Prefer not to say', subscriptionPlan: 'Admin',
                approvalStatus: 'Approved', isAdmin: true,
            }
        },
        {
            email: 'customer@drivergy.com',
            password: 'password',
            displayName: 'Demo Customer',
            role: 'Customer',
            profileData: {
                uniqueId: 'CU-CUSTOMER', name: 'Demo Customer', username: 'democustomer',
                contact: 'customer@drivergy.com', phone: '1111111111',
                gender: 'Female', location: 'Gurugram', subscriptionPlan: 'Premium',
                approvalStatus: 'Approved', totalLessons: 20, completedLessons: 5,
                upcomingLesson: "Jul 30, 2024, 9:00 AM",
                assignedTrainerId: "TR-TRAINER", assignedTrainerName: "Demo Trainer", assignedTrainerPhone: "2222222222",
                assignedTrainerExperience: 5, assignedTrainerVehicleDetails: 'Car (Manual) - DL01XY1234'
            }
        },
        {
            email: 'trainer@drivergy.com',
            password: 'password',
            displayName: 'Demo Trainer',
            role: 'Trainer',
            profileData: {
                uniqueId: 'TR-TRAINER', name: 'Demo Trainer', username: 'demotrainer',
                contact: 'trainer@drivergy.com', phone: '2222222222',
                gender: 'Male', location: 'Gurugram', subscriptionPlan: 'Trainer',
                approvalStatus: 'Approved', yearsOfExperience: 5, specialization: 'Car',
                vehicleInfo: 'Car (Manual) - DL01XY1234'
            }
        }
    ];

    for (const user of usersToCreate) {
        try {
            await adminAuth.getUserByEmail(user.email);
            // console.log(`Default ${user.role} user already exists.`);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                try {
                    const userRecord = await adminAuth.createUser({
                        email: user.email,
                        emailVerified: true,
                        password: user.password,
                        displayName: user.displayName,
                        disabled: false,
                    });
                    console.log(`Successfully created new ${user.role} user:`, userRecord.uid);
                    
                    const profile = {
                        ...user.profileData,
                        registrationTimestamp: new Date().toISOString(),
                    };
                    
                    await adminDb.collection('users').doc(userRecord.uid).set(profile);
                    if (user.role === 'Trainer') {
                        await adminDb.collection('users').doc('TR-TRAINER').set({ id: userRecord.uid, ...profile });
                    }
                    console.log(`Successfully created ${user.role} profile in Firestore.`);
                } catch (creationError) {
                    console.error(`Error creating default ${user.role} user:`, creationError);
                }
            } else {
                console.error(`Error checking for ${user.role} user:`, error);
            }
        }
    }
};


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

// Call the seeding functions when the server starts up.
const initializeServerData = async () => {
    await createDefaultUsers();
};
initializeServerData();


/**
 * Fetches all blog posts for server-side operations like sitemap generation.
 * This now fetches from the live Firestore database.
 * @returns A promise that resolves to an array of blog posts.
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
 * @returns A promise that resolves to an array of courses.
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
 * @returns A promise that resolves to an array of quiz sets.
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
 * Fetches a single user profile from Firestore by their document ID.
 * @param userId The UID of the user to fetch.
 * @returns A promise that resolves to the user profile or null if not found.
 */
export async function fetchUserById(userId: string): Promise<UserProfile | null> {
    if (!adminDb) {
        console.error("Admin DB not initialized. Cannot fetch user.");
        return null;
    }

    try {
        const userDocRef = adminDb.collection('users').doc(userId);
        const userDoc = await userDocRef.get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            // Ensure timestamp is a string
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
 * @param slug The slug of the blog post to fetch.
 * @returns A promise that resolves to the blog post or null if not found.
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
