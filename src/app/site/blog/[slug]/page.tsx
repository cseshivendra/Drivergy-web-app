
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
import { Car, User, Calendar, Facebook, Twitter, Instagram, Linkedin, ArrowLeft, Youtube, AlertCircle, Tag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ChatWidget from '@/components/chatbot/chat-widget';
import SiteHeader from '@/components/layout/site-header';


const SiteLogo = () => (
    <Link href="/site" className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-ring rounded-md">
      <div className="p-1.5 bg-primary/10 rounded-lg transition-all duration-300">
        <Car className="h-7 w-7 text-primary shrink-0" />
      </div>
      <span className="font-headline text-2xl font-extrabold text-primary tracking-tighter">
        Drivergy
      </span>
    </Link>
);


export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.slug) {
      setLoading(true);
      fetchBlogPostBySlug(params.slug).then(data => {
        setPost(data);
        setLoading(false);
      });
    }
  }, [params.slug]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <SiteHeader />
        <main className="flex-grow">
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
        </main>
      </div>
    );
  }

  if (!post) {
    return (
       <div className="flex flex-col min-h-screen bg-background text-foreground">
        <SiteHeader />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
             <AlertCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
            <h1 className="text-3xl font-bold">Post Not Found</h1>
            <p className="text-muted-foreground mt-2">The blog post you're looking for doesn't exist.</p>
            <Button asChild className="mt-6">
              <Link href="/site/blog">Back to Blog</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }
  
  return (
     <div className="flex flex-col min-h-screen bg-background text-foreground">
      <SiteHeader />

        <main className="flex-grow">
            <div className="container mx-auto max-w-4xl p-4 py-8 sm:p-6 lg:p-8">
                <Button variant="outline" onClick={() => router.back()} className="mb-8">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Blog
                </Button>

                <Card className="shadow-2xl overflow-hidden">
                    <div className="relative h-64 md:h-80 w-full">
                        <Image
                            src={post.image}
                            alt={post.title}
                            layout="fill"
                            objectFit="cover"
                            priority
                            data-ai-hint={post.imageHint}
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    </div>
                    <CardHeader className="relative -mt-16 z-10 p-6 md:p-8">
                        <Badge variant="secondary" className="w-fit mb-3 text-sm">{post.category}</Badge>
                        <CardTitle className="font-headline text-3xl md:text-4xl font-bold text-primary dark:text-white drop-shadow-lg">{post.title}</CardTitle>
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
                    <CardContent className="p-6 md:p-8 prose dark:prose-invert max-w-none text-base md:text-lg leading-relaxed">
                        {post.content}
                    </CardContent>
                    {post.tags && (
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
        </main>
      
      <footer className="border-t border-border/40 bg-background py-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground space-y-4">
                <div className="flex justify-center mb-4">
                    <SiteLogo />
                </div>
                 <div className="flex justify-center items-center gap-6">
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Facebook className="h-5 w-5" />
                        <span className="sr-only">Facebook</span>
                    </a>
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Twitter className="h-5 w-5" />
                        <span className="sr-only">Twitter</span>
                    </a>
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Instagram className="h-5 w-5" />
                        <span className="sr-only">Instagram</span>
                    </a>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Linkedin className="h-5 w-5" />
                        <span className="sr-only">LinkedIn</span>
                    </a>
                    <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <Youtube className="h-5 w-5" />
                        <span className="sr-only">Youtube</span>
                    </a>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 pt-4">
                    {/* Startup India Badge */}
                    <div className="inline-flex items-center gap-2 rounded-md border bg-card p-2 px-3 text-sm shadow-sm">
                      <span className="font-bold" style={{ letterSpacing: '-0.5px' }}>
                          <span className="text-saffron">#startup</span><span className="text-india-blue">i</span><span className="text-foreground">ndia</span>
                      </span>
                    </div>

                    {/* Made in India Badge */}
                    <div className="inline-flex items-center gap-2 rounded-md border bg-card p-2 px-3 text-sm shadow-sm">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                            <rect x="3" y="5" width="18" height="4" fill="#FF9933"/>
                            <rect x="3" y="9" width="18" height="4" fill="white"/>
                            <rect x="3" y="13" width="18" height="4" fill="#138808"/>
                            <circle cx="12" cy="11" r="1.5" stroke="#000080" strokeWidth="0.5" fill="none"/>
                        </svg>
                        <span className="font-semibold text-foreground">Made in India</span>
                    </div>
                </div>
                <p className="text-sm pt-2">
                    &copy; {new Date().getFullYear()} Drivergy. All rights reserved.
                </p>
            </div>
        </footer>
        <ChatWidget />
    </div>
  );
}
