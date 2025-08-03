
'use server';

import type { BlogPost } from '@/types';
import { adminDb } from '@/lib/firebase/admin';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

// This file is for server-side data fetching logic only.

/**
 * Fetches all blog posts from Firestore for server-side operations like sitemap generation.
 * This uses the Firebase Admin SDK.
 * @returns A promise that resolves to an array of blog posts.
 */
export async function fetchBlogPosts(): Promise<BlogPost[]> {
    try {
        const snapshot = await getDocs(query(collection(adminDb, 'blogPosts'), orderBy('date', 'desc')));
        return snapshot.docs.map(d => ({ slug: d.id, ...d.data() } as BlogPost));
    } catch (error) {
        console.error("Error fetching blog posts for sitemap:", error);
        return [];
    }
}
