
'use server';

import type { BlogPost, UserProfile } from '@/types';
import { adminAuth, adminDb } from './firebase/admin';

// This file is for server-side data fetching and data seeding logic only.

/**
 * Creates a default admin user in Firebase Auth and Firestore if it doesn't exist.
 * This is useful for seeding the database for development and testing.
 */
const createDefaultAdmin = async () => {
    if (!adminAuth || !adminDb) {
        console.error("Admin SDK not initialized. Cannot create default admin.");
        return;
    }

    const adminEmail = 'admin@drivergy.com';
    const adminPassword = 'password';

    try {
        // Check if the admin user already exists in Firebase Auth
        await adminAuth.getUserByEmail(adminEmail);
        // console.log("Default admin user already exists.");
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            // User does not exist, so create them
            try {
                const userRecord = await adminAuth.createUser({
                    email: adminEmail,
                    emailVerified: true,
                    password: adminPassword,
                    displayName: 'Admin User',
                    disabled: false,
                });

                console.log('Successfully created new admin user:', userRecord.uid);

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
                };

                await adminDb.collection('users').doc(userRecord.uid).set(adminProfile);
                console.log('Successfully created admin profile in Firestore.');

            } catch (creationError) {
                console.error('Error creating default admin user:', creationError);
            }
        } else {
            // Some other error occurred
            console.error('Error checking for admin user:', error);
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
    await createDefaultAdmin();
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
