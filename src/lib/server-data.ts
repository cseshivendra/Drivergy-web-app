
'use server';

import type { BlogPost, UserProfile } from '@/types';
import { adminDb } from './firebase/admin';

// This file is for server-side data fetching and data seeding logic only.

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
            return { id: userDoc.id, ...userDoc.data() } as UserProfile;
        } else {
            console.log(`No user found with ID: ${userId}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching user by ID ${userId}:`, error);
        return null;
    }
}
