

'use server';

import type { BlogPost, UserProfile, ApprovalStatusType } from '@/types';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { collection, query, orderBy, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';

// This file is for server-side data fetching and data seeding logic only.

/**
 * Fetches all blog posts from Firestore for server-side operations like sitemap generation.
 * This uses the Firebase Admin SDK.
 * @returns A promise that resolves to an array of blog posts.
 */
export async function fetchBlogPosts(): Promise<BlogPost[]> {
    if (!adminDb) {
        console.error("Firebase Admin SDK not initialized. Cannot fetch blog posts for sitemap.");
        return [];
    }
    try {
        const snapshot = await getDocs(query(collection(adminDb, 'blogPosts'), orderBy('date', 'desc')));
        return snapshot.docs.map(d => ({ slug: d.id, ...d.data() } as BlogPost));
    } catch (error) {
        console.error("Error fetching blog posts for sitemap:", error);
        return [];
    }
}


// =================================================================
// SERVER-SIDE DATA SEEDING (RUNS ONCE)
// =================================================================
const ensureAdminExists = async () => {
    // This is now handled by the mock data, but we keep the function structure
    // in case we switch back to a live DB.
    if(process.env.NODE_ENV !== 'development') return;

    if (!adminDb) return;
    const adminRef = doc(adminDb, 'admins', 'default_admin');
    try {
        const adminSnap = await getDoc(adminRef);
        if (!adminSnap.exists()) {
            console.log("Default admin not found, creating one...");
            await setDoc(adminRef, {
                username: 'admin',
                password: 'admin' // In a real app, hash this password
            });
            console.log("Default admin created successfully.");
        }
    } catch (error) {
        console.error("Error ensuring admin exists:", error);
    }
};

const createSampleUser = async (userData: {
  email: string;
  name: string;
  role: 'customer' | 'trainer';
}) => {
    // This is now handled by the mock data, but we keep the function structure
    // in case we switch back to a live DB.
    if(process.env.NODE_ENV !== 'development') return;

    if (!adminAuth || !adminDb) return;
    const { email, name, role } = userData;

    try {
        // Check if user already exists in Firebase Auth
        try {
        await adminAuth.getUserByEmail(email);
        // console.log(`User ${email} already exists. Skipping creation.`);
        return; 
        } catch (error: any) {
        if (error.code !== 'auth/user-not-found') {
            throw error; // Re-throw other auth errors
        }
        }
        
        console.log(`Creating sample user in Firebase Auth: ${email}`);
        await adminAuth.createUser({
            email,
            password: 'password', // Set a default password
            displayName: name,
            emailVerified: true,
        });
        console.log(`Successfully created sample auth user: ${email}`);
    } catch (error) {
        console.error(`Failed to create sample auth user ${email}:`, error);
    }
};

// This IIFE will run once when the server starts up.
(async () => {
    try {
        await ensureAdminExists();
        await createSampleUser({ email: 'trainer@drivergy.com', name: 'Sample Trainer', role: 'trainer' });
        await createSampleUser({ email: 'customer@drivergy.com', name: 'Sample Customer', role: 'customer' });
    } catch(e) {
        console.error("Error during initial data seeding:", e);
    }
})();

    
