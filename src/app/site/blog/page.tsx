
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, BookText, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { listenToBlogPosts } from '@/lib/mock-data';
import type { BlogPost } from '@/types';

const POSTS_PER_PAGE = 6;

export default function BlogPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToBlogPosts(data => {
      setBlogPosts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const totalPages = Math.ceil(blogPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const currentPosts = blogPosts.slice(startIndex, endIndex);

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const renderSkeletons = () => (
    Array.from({ length: POSTS_PER_PAGE }).map((_, i) => (
      <Card key={`skeleton-${i}`} className="shadow-lg flex flex-col overflow-hidden rounded-xl border border-border/70 h-full">
        <Skeleton className="h-56 w-full" />
        <CardHeader>
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-6 w-full" />
        </CardHeader>
        <CardContent className="flex-grow">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full mt-2" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardContent>
        <CardFooter className="mt-auto pt-4 border-t border-border/50">
           <Skeleton className="h-5 w-32" />
        </CardFooter>
      </Card>
    ))
  );

  return (
    <div className="container mx-auto max-w-7xl p-4 py-8 sm:p-6 lg:p-8">
        <Card className="shadow-lg overflow-hidden mb-12">
            <div className="relative h-56 w-full bg-primary/10">
                <Image 
                    src="https://placehold.co/1200x300/dc2626/ffffff.png" 
                    alt="Banner with books and driving manuals for the Drivergy blog" 
                    layout="fill" 
                    objectFit="cover"
                    data-ai-hint="library books driving manual"
                />
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center p-4">
                    <div className="p-3 bg-background/80 rounded-full mb-3 backdrop-blur-sm">
                        <BookText className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="font-headline text-4xl md:text-5xl font-bold text-white drop-shadow-md">The Drivergy Blog</h1>
                    <p className="mt-2 text-lg text-white/90 max-w-2xl mx-auto drop-shadow-sm">
                        Your expert source for RTO exam tips, safe driving tricks, and road safety news in India.
                    </p>
                </div>
            </div>
        </Card>
        
        {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {renderSkeletons()}
            </div>
        ) : currentPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {currentPosts.map((post) => (
                  <Link key={post.slug} href={`/site/blog/${post.slug}`} className="group block">
                    <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out flex flex-col overflow-hidden rounded-xl border border-border/70 h-full">
                        <div className="relative h-56 w-full">
                            <Image
                                src={post.imageSrc}
                                alt={post.title}
                                layout="fill"
                                objectFit="cover"
                                data-ai-hint={post.imageHint}
                            />
                        </div>
                        <CardHeader>
                            <Badge variant="secondary" className="w-fit mb-2">{post.category}</Badge>
                            <CardTitle as="h2" className="font-headline text-xl font-semibold text-primary group-hover:underline">{post.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-muted-foreground text-sm">{post.excerpt}</p>
                        </CardContent>
                        <CardFooter className="mt-auto pt-4 border-t border-border/50 flex flex-col items-start gap-4">
                            <div className="flex items-center text-xs text-muted-foreground w-full justify-between">
                                <div className="flex items-center">
                                    <User className="h-4 w-4 mr-1.5" />
                                    <span>{post.author}</span>
                                </div>
                                <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1.5" />
                                    <span>{post.date}</span>
                                </div>
                            </div>
                            {post.tags && (
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {post.tags.split(',').slice(0, 3).map(tag => (
                                        <Badge key={tag.trim()} variant="outline" className="text-xs font-normal">
                                            {tag.trim()}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            <p className="text-sm font-semibold text-primary group-hover:underline mt-2">
                              Read More &rarr;
                            </p>
                        </CardFooter>
                    </Card>
                  </Link>
                ))}
            </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground h-64">
            <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-lg">No blog posts found.</p>
          </div>
        )}

          {totalPages > 1 && !loading && (
            <div className="flex items-center justify-center mt-12 space-x-4">
                <Button onClick={handlePrevious} disabled={currentPage === 1} variant="outline">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                </Button>
                <span className="text-sm font-medium text-muted-foreground">
                    Page {currentPage} of {totalPages}
                </span>
                <Button onClick={handleNext} disabled={currentPage === totalPages} variant="outline">
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
            </div>
        )}
    </div>
  );
}
