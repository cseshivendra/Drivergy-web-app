
import type { Metadata } from 'next';
import { fetchBlogPostBySlug } from '@/lib/mock-data';
import BlogPostClientPage from './blog-post-client-page';
import { notFound } from 'next/navigation';

// Dynamically generate metadata for each blog post
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const post = await fetchBlogPostBySlug(params.slug);

    if (!post) {
        return {
            title: 'Post Not Found',
            description: 'The blog post you are looking for does not exist.',
        };
    }

    return {
        title: post.title,
        description: post.excerpt,
        keywords: post.tags?.split(',').map(tag => tag.trim()),
        authors: [{ name: post.author }],
        openGraph: {
            title: post.title,
            description: post.excerpt,
            type: 'article',
            publishedTime: new Date(post.date).toISOString(),
            authors: [post.author],
            images: [
                {
                    url: post.imageSrc,
                    width: 1200,
                    height: 800,
                    alt: post.title,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.excerpt,
            images: [post.imageSrc],
        },
    };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
    const post = await fetchBlogPostBySlug(params.slug);

    if (!post) {
        notFound();
    }

    return <BlogPostClientPage initialPost={post} />;
}
