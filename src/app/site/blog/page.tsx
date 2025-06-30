'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, User, Calendar, BookText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

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

const blogPosts = [
  {
    title: "10 Essential RTO Tips to Pass Your Driving Test First Try",
    category: "RTO Tips",
    excerpt: "Nervous about your driving test? We've compiled the top 10 tips, from pre-test checks to on-road etiquette, to help you ace your RTO exam with confidence.",
    author: "Rohan Sharma",
    date: "July 26, 2024",
    image: "https://placehold.co/600x400.png",
    imageHint: "driving test exam"
  },
  {
    title: "Mastering Parallel Parking: A Step-by-Step Guide",
    category: "Driving Skills",
    excerpt: "Parallel parking can be intimidating, but it doesn't have to be. Follow our simple, step-by-step guide to master this essential driving maneuver and park like a pro every time.",
    author: "Priya Mehta",
    date: "July 22, 2024",
    image: "https://placehold.co/600x400.png",
    imageHint: "parallel parking car"
  },
  {
    title: "Understanding Indian Road Signs: A Visual Guide",
    category: "RTO Knowledge",
    excerpt: "From mandatory signs to cautionary warnings, understanding road signs is crucial for safety. This visual guide will help you decode the most common signs you'll encounter on Indian roads.",
    author: "Anjali Verma",
    date: "July 18, 2024",
    image: "https://placehold.co/600x400.png",
    imageHint: "road signs traffic"
  },
  {
    title: "Defensive Driving 101: How to Stay Safe in City Traffic",
    category: "Driving Skills",
    excerpt: "City driving presents unique challenges. Learn the core principles of defensive driving to anticipate hazards, avoid accidents, and navigate busy urban environments safely.",
    author: "Vikram Singh",
    date: "July 15, 2024",
    image: "https://placehold.co/600x400.png",
    imageHint: "city traffic car"
  },
  {
    title: "Choosing Your First Car: A Beginner's Guide",
    category: "Car Maintenance",
    excerpt: "Buying your first car is a huge milestone. This guide covers everything from budget to insurance to help you make a smart choice.",
    author: "Rohan Sharma",
    date: "July 12, 2024",
    image: "https://placehold.co/600x400.png",
    imageHint: "new car dealership"
  },
  {
    title: "Night Driving: Tips for Staying Safe After Dark",
    category: "Driving Skills",
    excerpt: "Driving at night comes with its own set of risks. Learn how to improve visibility and stay alert on the road after sunset.",
    author: "Priya Mehta",
    date: "July 08, 2024",
    image: "https://placehold.co/600x400.png",
    imageHint: "night road car lights"
  },
  {
    title: "How to Handle a Tire Blowout Calmly and Safely",
    category: "Safety",
    excerpt: "A tire blowout can be a frightening experience. Know the steps to take to maintain control of your vehicle and pull over safely.",
    author: "Anjali Verma",
    date: "July 05, 2024",
    image: "https://placehold.co/600x400.png",
    imageHint: "flat tire car"
  },
  {
    title: "The Ultimate Pre-Road Trip Vehicle Checklist",
    category: "Car Maintenance",
    excerpt: "Before you hit the open road, it's crucial to ensure your vehicle is in top condition. Follow our checklist for a worry-free trip.",
    author: "Vikram Singh",
    date: "July 01, 2024",
    image: "https://placehold.co/600x400.png",
    imageHint: "car road trip"
  },
  {
    title: "Navigating Roundabouts in India: A Simple How-To",
    category: "Driving Skills",
    excerpt: "Roundabouts can be confusing for new drivers. This guide breaks down the rules and etiquette for safely navigating them.",
    author: "Rohan Sharma",
    date: "June 28, 2024",
    image: "https://placehold.co/600x400.png",
    imageHint: "traffic roundabout aerial"
  },
  {
    title: "Understanding Your Car's Dashboard Warning Lights",
    category: "Car Maintenance",
    excerpt: "What does that little light mean? We decode the most common dashboard warning lights so you know when to take action.",
    author: "Priya Mehta",
    date: "June 24, 2024",
    image: "https://placehold.co/600x400.png",
    imageHint: "car dashboard lights"
  },
  {
    title: "The Importance of Regular Oil Changes",
    category: "Car Maintenance",
    excerpt: "Learn why regular oil changes are the single most important thing you can do to keep your car's engine running smoothly for years to come.",
    author: "Anjali Verma",
    date: "June 20, 2024",
    image: "https://placehold.co/600x400.png",
    imageHint: "car engine oil"
  },
  {
    title: "Monsoon Driving Tips: How to Drive Safely in Heavy Rain",
    category: "Safety",
    excerpt: "Driving in the monsoon presents serious challenges. Learn how to prepare your car and drive safely through waterlogged roads and low visibility.",
    author: "Vikram Singh",
    date: "June 17, 2024",
    image: "https://placehold.co/600x400.png",
    imageHint: "rainy road car"
  }
];

const POSTS_PER_PAGE = 6;

export default function BlogPage() {
  const [currentPage, setCurrentPage] = useState(1);

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


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8">
                <SiteLogo />
                <Button variant="outline" asChild>
                    <Link href="/site">Back to Site</Link>
                </Button>
            </div>
        </header>

        <main className="flex-grow">
            <div className="container mx-auto max-w-7xl p-4 py-8 sm:p-6 lg:p-8">
                <Card className="shadow-lg overflow-hidden mb-12">
                    <div className="relative h-56 w-full bg-primary/10">
                        <Image 
                            src="https://placehold.co/1200x300.png" 
                            alt="Banner for blog page with driving theme" 
                            layout="fill" 
                            objectFit="cover"
                            data-ai-hint="library books driving manual"
                        />
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center p-4">
                            <div className="p-3 bg-background/80 rounded-full mb-3 backdrop-blur-sm">
                                <BookText className="h-10 w-10 text-primary" />
                            </div>
                            <h1 className="font-headline text-4xl md:text-5xl font-bold text-white drop-shadow-md">Drivergy Blog</h1>
                            <p className="mt-2 text-lg text-white/90 max-w-2xl mx-auto drop-shadow-sm">
                                Your source for RTO exam tips, expert driving tricks, and road safety advice.
                            </p>
                        </div>
                    </div>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {currentPosts.map((post, index) => (
                        <Card key={index} className="shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out flex flex-col overflow-hidden rounded-xl border border-border/70">
                            <div className="relative h-56 w-full">
                                <Image
                                    src={post.image}
                                    alt={post.title}
                                    layout="fill"
                                    objectFit="cover"
                                    data-ai-hint={post.imageHint}
                                />
                            </div>
                            <CardHeader>
                                <Badge variant="secondary" className="w-fit mb-2">{post.category}</Badge>
                                <CardTitle className="font-headline text-xl font-semibold text-primary">{post.title}</CardTitle>
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
                                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-2">
                                    Read More
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                 {totalPages > 1 && (
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
        </main>

        <footer className="border-t border-border/40 bg-background py-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
                <div className="flex justify-center mb-4">
                    <SiteLogo />
                </div>
                <p className="text-sm">
                    &copy; {new Date().getFullYear()} Drivergy. All rights reserved.
                </p>
            </div>
        </footer>
    </div>
  );
}
