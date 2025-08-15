
import { MetadataRoute } from 'next';

// This file generates a sitemap, which is an XML file that lists the important pages on your website.
// It helps search engines like Google discover and index your content more efficiently.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://drivergy.in';

  // 1. Define static routes that are always present on the site.
  const staticRoutes = [
    '', // Homepage
    '/register',
    '/login',
    '/faq',
    '/career',
    '/rto-services',
    '/about',
    '/blog',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const, // How often the page content is likely to change
    priority: route === '' ? 1.0 : 0.8, // Priority of this URL relative to other URLs on your site
  }));

  // Temporarily removing dynamic blog post fetching to fix build.
  const blogRoutes: MetadataRoute.Sitemap = [];
  
  // 3. Combine static and dynamic routes into a single sitemap.
  return [...staticRoutes, ...blogRoutes];
}
