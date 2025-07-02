'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, User, Calendar, BookText, ChevronLeft, ChevronRight, Facebook, Twitter, Instagram, Linkedin, LogIn, UserPlus, Power, LayoutDashboard, Moon, Sun, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import ChatWidget from '@/components/chatbot/chat-widget';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


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
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

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
        <div className="container mx-auto h-auto min-h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-2">
          <SiteLogo />
          <nav className="flex items-center flex-wrap gap-x-1 gap-y-2 sm:gap-x-2 justify-end">
            <Button variant="ghost" asChild>
              <Link href="/site#services">Services</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/site#courses">Courses</Link>
            </Button>
             <Button variant="ghost" asChild>
              <Link href="/site/blog">Blog</Link>
            </Button>
             <Button variant="ghost" asChild>
              <Link href="/site#subscriptions">Plans</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/site#testimonials">Testimonials</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/site/faq">FAQ</Link>
            </Button>
             <Button variant="ghost" asChild>
              <Link href="/site#contact">Support</Link>
            </Button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                     <Avatar className="h-6 w-6">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                        <AvatarFallback>{user.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    <span>{user.displayName}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      My Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <Power className="mr-2 h-4 w-4" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/site/register">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Register
                  </Link>
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
          </nav>
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
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 pt-4">
                    {/* Startup India Badge */}
                    <div className="inline-flex items-center gap-2 rounded-md border bg-card p-2 px-3 text-sm shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-saffron">
                          <path d="M12.96,2.83,4.29,7.75a1,1,0,0,0-.54.88V15.37a1,1,0,0,0,.54.88l8.67,4.92a1,1,0,0,0,1.08,0l8.67-4.92a1,1,0,0,0,.54-.88V8.63a1,1,0,0,0-.54-.88L14.04,2.83A1,1,0,0,0,12.96,2.83ZM13.5,15.55a2.17,2.17,0,1,1,2.17-2.17A2.17,2.17,0,0,1,13.5,15.55Z" />
                        </svg>
                        <span className="font-semibold text-foreground">Startup India</span>
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
