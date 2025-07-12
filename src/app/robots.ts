
import { MetadataRoute } from 'next';

// This file instructs search engine crawlers which pages they can or cannot access on your site.
// It's a standard practice for SEO and site management.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      // Rule for all crawlers (user-agent: *)
      userAgent: '*',
      // Allow crawlers to access all pages
      allow: '/',
      // Disallow crawlers from accessing the private application area and login pages,
      // as these are not intended for public search results.
      disallow: ['/app/', '/login/', '/create/'],
    },
    // Specify the location of the sitemap file.
    sitemap: 'https://drivergy.com/sitemap.xml',
  };
}
