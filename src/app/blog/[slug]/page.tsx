
import BlogPostClientPage from './blog-post-client-page';

// This page is now fully client-rendered to avoid build-time data fetching.
export default function BlogPostPage({ params }: { params: { slug: string } }) {
    // The client page will handle all data fetching.
    // We pass the slug to it so it knows which post to fetch.
    return <BlogPostClientPage slug={params.slug} />;
}
