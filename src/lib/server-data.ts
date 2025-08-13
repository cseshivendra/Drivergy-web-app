
'use server';

import type { BlogPost } from '@/types';
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
