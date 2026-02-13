import type { Metadata } from 'next';
import BlogClient from './blog-client';

export const metadata: Metadata = {
  title: 'Driving School Blog | RTO Tips, Safety Rules | Drivergy',
  description: 'The Drivergy blog is your expert source for RTO exam tips, safe driving tricks, car maintenance guides, and road safety news in India. Learn to be a better driver with us.',
  openGraph: {
    title: 'Driving School Blog | Drivergy',
    description: 'Expert driving tips and RTO exam preparation.',
    type: 'website',
    url: 'https://drivergy.in/blog',
  },
};

export default function BlogPage() {
  return <BlogClient />;
}
