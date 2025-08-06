
'use server';

import type { BlogPost } from '@/types';
import { listenToBlogPosts } from './mock-data';

// This file is for server-side data fetching and data seeding logic only.

/**
 * Fetches all blog posts for server-side operations like sitemap generation.
 * This is now a mock function.
 * @returns A promise that resolves to an array of blog posts.
 */
export async function fetchBlogPosts(): Promise<BlogPost[]> {
    console.log("Mock fetchBlogPosts called for sitemap.");
    return new Promise((resolve) => {
        const unsubscribe = listenToBlogPosts((posts) => {
            resolve(posts);
            unsubscribe();
        });
    });
}
