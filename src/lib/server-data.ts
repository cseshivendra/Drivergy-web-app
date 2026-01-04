

'use server';

import type { BlogPost, UserProfile, Course, QuizSet, Product, Feedback } from '@/types';
import { adminAuth, adminDb } from './firebase/admin';
import { format } from 'date-fns';

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
                    userRole: 'admin',
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


// Call the seeding functions when the server starts up.
const initializeServerData = async () => {
    await createDefaultAdmin();
    await seedStoreProducts();
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
 * Fetches all products from the storeProducts collection in Firestore.
 * @returns A promise that resolves to an array of products.
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
        const trainerDocRef = adminDb.collection('trainers').doc(userId);
        
        let userDoc = await userDocRef.get();
        if (!userDoc.exists) {
            userDoc = await trainerDocRef.get();
        }

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

export async function fetchTrainerDashboardData(trainerId: string): Promise<{ trainerProfile: UserProfile | null, students: UserProfile[], feedback: Feedback[] }> {
    if (!adminDb) {
        console.error('Firestore not initialized.');
        return { trainerProfile: null, students: [], feedback: [] };
    }

    try {
        // Fetch trainer profile, students, and feedback in parallel
        const [trainerProfileSnap, studentsSnap, feedbackSnap] = await Promise.all([
            adminDb.collection('trainers').doc(trainerId).get(),
            adminDb.collection('users').where('assignedTrainerId', '==', trainerId).get(),
            adminDb.collection('feedback').where('trainerId', '==', trainerId).get()
        ]);

        // Process trainer profile
        let trainerProfile: UserProfile | null = null;
        if (trainerProfileSnap.exists) {
            const data = trainerProfileSnap.data();
             if (data?.registrationTimestamp && typeof data.registrationTimestamp.toDate === 'function') {
                data.registrationTimestamp = data.registrationTimestamp.toDate().toISOString();
            }
            trainerProfile = { id: trainerProfileSnap.id, ...data } as UserProfile;
        }

        // Process students
        const students = studentsSnap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                upcomingLesson: data.upcomingLesson, // Ensure this field is passed through
                registrationTimestamp: data.registrationTimestamp?.toDate ? data.registrationTimestamp.toDate().toISOString() : data.registrationTimestamp,
            } as UserProfile;
        });

        // Process feedback
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

    