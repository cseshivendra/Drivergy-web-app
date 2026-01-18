
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { fetchBlogPostBySlug } from '@/lib/mock-data';
import type { BlogPost } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, ArrowLeft, AlertCircle, Tag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function BlogPostClientPage({ initialPost }: { initialPost: BlogPost }) {
    const router = useRouter();
    const [post, setPost] = useState<BlogPost>(initialPost);
    const [loading, setLoading] = useState(false); // Initial post is passed as prop

    // Optional: If you need to re-fetch on client side for some reason
    // useEffect(() => {
    //   if (params.slug) {
    //     setLoading(true);
    //     fetchBlogPostBySlug(params.slug).then(data => {
    //       setPost(data);
    //       setLoading(false);
    //     });
    //   }
    // }, [params.slug]);

    if (loading) {
        return (
            <div className="container mx-auto max-w-4xl p-4 py-8 sm:p-6 lg:p-8">
                <Skeleton className="h-10 w-36 mb-8" />
                <Card className="shadow-2xl overflow-hidden">
                    <Skeleton className="h-64 md:h-80 w-full" />
                    <CardHeader className="relative -mt-16 z-10 p-6 md:p-8">
                        <Skeleton className="h-6 w-24 mb-3" />
                        <Skeleton className="h-10 w-3/4" />
                        <div className="flex gap-6 mt-4">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-5 w-32" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8 space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="flex-grow flex items-center justify-center p-4">
                <Card className="text-center p-8 shadow-lg">
                    <CardHeader>
                        <AlertCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
                        <CardTitle className="text-3xl font-bold">Post Not Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mt-2">The blog post you're looking for doesn't exist or couldn't be loaded.</p>
                        <Button asChild className="mt-6">
                            <Link href="/blog">Back to Blog</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-4xl p-4 py-8 sm:p-6 lg:p-8">
            <Button variant="outline" onClick={() => router.back()} className="mb-8">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
            </Button>

            <Card className="shadow-2xl overflow-hidden">
                <div className="relative h-64 md:h-80 w-full bg-muted">
                    {post.imageSrc && (
                        <>
                            <Image
                                src={post.imageSrc}
                                alt={post.title}
                                fill
                                className="object-cover"
                                priority
                                data-ai-hint={post.imageHint}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        </>
                    )}
                </div>
                <CardHeader className="relative -mt-16 z-10 p-6 md:p-8">
                    <Badge variant="secondary" className="w-fit mb-3 text-sm">{post.category}</Badge>
                    <CardTitle as="h1" className="font-headline text-3xl md:text-4xl font-bold text-primary dark:text-white drop-shadow-lg">{post.title}</CardTitle>
                    <div className="flex items-center gap-6 text-sm text-primary dark:text-white/90 mt-4 drop-shadow-lg">
                        <div className="flex items-center">
                            <User className="h-4 w-4 mr-1.5" />
                            <span>{post.author}</span>
                        </div>
                        <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1.5" />
                            <span>{post.date}</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <article className="p-6 md:p-8 prose dark:prose-invert max-w-none text-base md:text-lg leading-relaxed">
                        {post.content}
                    </article>
                </CardContent>
                {post.tags && post.tags.length > 0 && (
                    <CardFooter className="p-6 md:p-8 pt-4 border-t">
                        <div className="flex flex-wrap items-center gap-2">
                            <Tag className="h-5 w-5 text-muted-foreground" />
                            {post.tags.split(',').map(tag => (
                                <Badge key={tag.trim()} variant="secondary" className="text-sm">
                                    {tag.trim()}
                                </Badge>
                            ))}
                        </div>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
