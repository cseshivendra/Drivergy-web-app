
import { MetadataRoute } from 'next';
import { listenToBlogPosts } from '@/lib/mock-data'; 
import { BlogPost } from '@/types';

// This file generates a sitemap, which is an XML file that lists the important pages on your website.
// It helps search engines like Google discover and index your content more efficiently.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://drivergy.com';

  // 1. Define static routes that are always present on the site.
  const staticRoutes = [
    '', // Homepage
    '/site',
    '/site/register',
    '/site/faq',
    '/site/career',
    '/site/rto-services',
    '/site/blog',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const, // How often the page content is likely to change
    priority: route === '' ? 1.0 : 0.8, // Priority of this URL relative to other URLs on your site
  }));

  // 2. Fetch dynamic routes, like blog posts, from the data source.
  const posts: BlogPost[] = await new Promise((resolve) => {
    // listenToBlogPosts uses a listener, so we wrap it in a promise
    // that resolves with the first batch of data.
    const unsubscribe = listenToBlogPosts((data) => {
      resolve(data);
      unsubscribe(); // Stop listening after we get the data
    });
  });

  const blogRoutes = posts.map((post) => ({
    url: `${baseUrl}/site/blog/${post.slug}`,
    lastModified: new Date(post.date).toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // 3. Combine static and dynamic routes into a single sitemap.
  return [...staticRoutes, ...blogRoutes];
}
