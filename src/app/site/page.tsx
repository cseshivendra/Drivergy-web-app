'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Car, BookOpen, ShieldCheck, Users, Navigation, LogIn, UserPlus, User, UserCog, ChevronDown, Bike, ClipboardCheck, Power, Star, Check, Sun, Moon, MessageSquareText, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { useState, useEffect } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


const SiteLogo = () => (
  <Link href="/site" className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-ring rounded-md">
    <div className="p-1.5 bg-primary/10 rounded-lg transition-all duration-300">
      <Car className="h-7 w-7 text-primary shrink-0 animate-car-slide-logo" />
    </div>
    <span className={cn(
      "font-headline text-2xl font-extrabold text-primary tracking-tighter",
      "animate-typing-drivergy"
    )}>
      Drivergy
    </span>
  </Link>
);

interface ServiceCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  imageSrc: string;
  imageHint: string;
}

function ServiceCard({ icon: Icon, title, description, imageSrc, imageHint }: ServiceCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out overflow-hidden flex flex-col">
      <div className="relative h-48 w-full">
        <Image 
          src={imageSrc} 
          alt={title} 
          layout="fill" 
          objectFit="cover" 
          data-ai-hint={imageHint}
        />
      </div>
      <CardHeader className="pb-3">
        <div className="flex items-center mb-2">
          <div className="p-2 bg-primary/10 rounded-md mr-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-headline text-xl font-semibold text-primary">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

const coursesData = [
  {
    id: "car-program",
    icon: Car,
    title: "Comprehensive Car Program",
    description: "Our flagship car driving program takes you from zero to hero. Learn essential car controls, traffic navigation, parking, and on-road practice with expert instructors.",
    imageSrc: "https://placehold.co/600x400.png",
    imageHint: "car driving lesson student"
  },
  {
    id: "motorcycle-course",
    icon: Bike,
    title: "Motorcycle Rider Course",
    description: "Become a skilled and safe motorcycle rider. Our course covers bike handling, balance, safety gear importance, and real-world riding scenarios.",
    imageSrc: "https://placehold.co/600x400.png",
    imageHint: "motorcycle training bike rider"
  },
  {
    id: "rto-assistance",
    icon: ClipboardCheck,
    title: "RTO License Assistance",
    description: "Successfully navigate the RTO licensing process. We provide guidance for learners' and permanent licenses, including documentation support and test preparation.",
    imageSrc: "https://placehold.co/600x400.png",
    imageHint: "license test exam RTO"
  }
];

const slideImages = [
  { src: "https://placehold.co/1920x1080.png", hint: "learner car driving" },
  { src: "https://placehold.co/1920x1080.png", hint: "driving test road" },
  { src: "https://placehold.co/1920x1080.png", hint: "city driving school" },
];

const testimonialsData = [
    {
      name: "Priya Sharma",
      role: "Customer, Bangalore",
      avatar: "https://placehold.co/100x100.png",
      avatarHint: "woman portrait",
      testimonial: "Drivergy made learning to drive so easy! My instructor was patient and professional. The scheduling system is fantastic. I passed my test on the first try. Highly recommended!",
      rating: 5,
    },
    {
      name: "Rohan Verma",
      role: "Trainer, Mumbai",
      avatar: "https://placehold.co/100x100.png",
      avatarHint: "man portrait",
      testimonial: "As an instructor, Drivergy's platform has streamlined my business. I can manage my bookings, track student progress, and receive payments all in one place. It lets me focus on what I do best - teaching.",
      rating: 5,
    },
    {
      name: "Anjali Mehta",
      role: "Customer, Delhi",
      avatar: "https://placehold.co/100x100.png",
      avatarHint: "female driver",
      testimonial: "I was nervous about driving in a big city, but the defensive driving course gave me the confidence I needed. The app is user-friendly and the support team is very responsive.",
      rating: 4,
    },
  ];

export default function PortfolioSitePage() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (slideImages.length === 0) return;

    const timer = setTimeout(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === slideImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Change image every 5 seconds

    return () => clearTimeout(timer); // Cleanup timer on component unmount
  }, [currentImageIndex]);


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header/Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto h-auto min-h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-2">
          <SiteLogo />
          <nav className="flex items-center flex-wrap gap-x-1 gap-y-2 sm:gap-x-2 justify-end">
            <Button variant="ghost" asChild>
              <Link href="#services">Services</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="#courses">Courses</Link>
            </Button>
             <Button variant="ghost" asChild>
              <Link href="#subscriptions">Plans</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="#testimonials">Testimonials</Link>
            </Button>
             <Button variant="ghost" asChild>
              <Link href="#contact">Support</Link>
            </Button>
            
            <>
              <Button asChild variant="outline">
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Register
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/site/register/customer">
                      <User className="mr-2 h-4 w-4" />
                      Register as Customer
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/site/register/trainer">
                      <UserCog className="mr-2 h-4 w-4" />
                      Register as Trainer
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>

            <Button variant="outline" asChild>
              <Link href="/">
                <LogIn className="mr-0 sm:mr-2 h-4 w-4" /> 
                <span className="hidden sm:inline">Admin Portal</span>
              </Link>
            </Button>
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

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center text-center text-white overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            {slideImages.map((image, index) => (
              <Image
                key={index}
                src={image.src}
                alt={`Background slide ${index + 1}`}
                layout="fill"
                objectFit="cover"
                className={cn(
                  "hero-bg-slide",
                  index === currentImageIndex && "active"
                )}
                priority={index === 0}
                data-ai-hint={image.hint}
              />
            ))}
          </div>
          <div className="absolute inset-0 bg-black/50 z-[5] pointer-events-none"></div> {/* Dark overlay */}
          
          <div className="relative z-10 p-4 container mx-auto"> {/* Content */}
            <div className="mt-16 flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 text-base" 
                asChild
              >
                <Link href="#courses">Explore Our Courses &rarr;</Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto border-white text-destructive hover:bg-white hover:text-primary font-semibold px-8 py-3 text-base" 
                asChild
              >
                <Link href="/site/register/trainer">Register as Trainer</Link>
              </Button>
            </div>
             <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl drop-shadow-sm">
              Start your driving journey with a school that makes it easy
            </p>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary">Our Services</h2>
              <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
                We offer a range of services tailored to meet your driving needs, from beginner lessons to advanced techniques.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <ServiceCard
                icon={Navigation}
                title="Personalized Driving Lessons"
                description="Tailored one-on-one training sessions with certified instructors for both two-wheelers and four-wheelers. Learn at your own pace, focusing on your specific needs and building confidence behind the wheel."
                imageSrc="https://placehold.co/600x400.png"
                imageHint="driving lesson car instructor"
              />
              <ServiceCard
                icon={BookOpen}
                title="RTO Exam Preparation"
                description="Ace your RTO exam with our comprehensive preparation module. We cover theory, traffic rules, and provide mock tests to ensure you're fully prepared for your driving license."
                imageSrc="https://placehold.co/600x400.png"
                imageHint="exam preparation book test"
              />
              <ServiceCard
                icon={ShieldCheck}
                title="Defensive Driving Courses"
                description="Master advanced driving techniques to navigate challenging road conditions and anticipate hazards. Our defensive driving course enhances your safety and awareness on the road."
                imageSrc="https://placehold.co/600x400.png"
                imageHint="safe driving shield road"
              />
            </div>
          </div>
        </section>

        {/* Courses Section */}
        <section id="courses" className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary">Our Driving School Courses</h2>
              <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
                Enroll in our top-rated driving courses designed for all skill levels. Get certified and drive with confidence.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {coursesData.map((course) => (
                <Card key={course.id} className="shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out overflow-hidden flex flex-col">
                  <div className="relative h-48 w-full">
                    <Image 
                      src={course.imageSrc} 
                      alt={course.title} 
                      layout="fill" 
                      objectFit="cover" 
                      data-ai-hint={course.imageHint}
                    />
                  </div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center mb-2">
                      <div className="p-2 bg-primary/10 rounded-md mr-3">
                        <course.icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="font-headline text-xl font-semibold text-primary">{course.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-muted-foreground text-sm">{course.description}</p>
                  </CardContent>
                  <CardFooter className="mt-auto pt-4 border-t border-border/50">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Subscription Plans Section */}
        <section id="subscriptions" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary mb-6">Flexible Subscription Plans</h2>
            <p className="text-lg text-muted-foreground mb-12 max-w-xl mx-auto">
              Choose a plan that fits your learning pace and budget. All plans include expert guidance and progress tracking.
            </p>
             <TooltipProvider>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <Card className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
                      <CardHeader className="pb-4">
                          <CardTitle className="text-2xl text-primary flex items-center justify-center">
                            Basic Start
                          </CardTitle>
                          <CardDescription>Perfect for beginners to get started.</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow space-y-4">
                          <div className="flex items-center justify-center gap-x-2 mb-2">
                              <p className="text-4xl font-bold">₹3,999</p>
                              <p className="text-xl font-medium text-muted-foreground line-through">₹4,999</p>
                          </div>
                          <ul className="space-y-2 text-muted-foreground text-sm text-left">
                              <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />10 Practical Driving Sessions</li>
                              <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Basic Theory Classes</li>
                              <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Learner's License Assistance</li>
                              <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Flexible Slot Booking</li>
                          </ul>
                      </CardContent>
                      <CardFooter className="mt-auto pt-6">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button className="w-full" asChild>
                                <Link href="/site/payment?plan=Basic%20Start&price=3999">Choose Plan</Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Click to start your driving journey with the Basic Start plan.</p>
                            </TooltipContent>
                        </Tooltip>
                      </CardFooter>
                  </Card>
                  <Card className="shadow-xl hover:shadow-2xl transition-shadow border-2 border-primary relative overflow-hidden flex flex-col transform scale-105 md:scale-110 z-10 bg-card">
                      <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-bl-lg shadow-md flex items-center">
                          <Star className="h-3 w-3 mr-1.5" /> POPULAR
                      </div>
                      <CardHeader className="pb-4">
                          <CardTitle className="text-2xl text-primary flex items-center justify-center">
                              Premium Pro
                          </CardTitle>
                          <CardDescription>Our most comprehensive package.</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow space-y-4">
                          <div className="flex items-center justify-center gap-x-2 mb-2">
                              <p className="text-4xl font-bold">₹7,499</p>
                              <p className="text-xl font-medium text-muted-foreground line-through">₹8,499</p>
                          </div>
                          <ul className="space-y-2 text-muted-foreground text-sm text-left">
                              <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />20 Practical Driving Sessions</li>
                              <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Advanced Theory & Defensive Driving</li>
                              <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />RTO Test Slot Booking</li>
                              <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Dedicated Instructor Support</li>
                              <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Road Safety Workshop</li>
                          </ul>
                      </CardContent>
                      <CardFooter className="mt-auto pt-6">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button className="w-full bg-primary hover:bg-primary/90" asChild>
                                <Link href="/site/payment?plan=Premium%20Pro&price=7499">Choose Plan</Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Get the best value and features with our Premium Pro plan.</p>
                            </TooltipContent>
                        </Tooltip>
                      </CardFooter>
                  </Card>
                  <Card className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
                      <CardHeader className="pb-4">
                          <CardTitle className="text-2xl text-primary flex items-center justify-center">
                            Gold Standard
                          </CardTitle>
                          <CardDescription>Excellent value with extra benefits.</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow space-y-4">
                          <div className="flex items-center justify-center gap-x-2 mb-2">
                              <p className="text-4xl font-bold">₹5,999</p>
                              <p className="text-xl font-medium text-muted-foreground line-through">₹6,999</p>
                          </div>
                          <ul className="space-y-2 text-muted-foreground text-sm text-left">
                              <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />15 Practical Driving Sessions</li>
                              <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Comprehensive Theory & Mock Tests</li>
                              <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Flexible Scheduling</li>
                              <li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Progress Tracking App Access</li>
                          </ul>
                      </CardContent>
                      <CardFooter className="mt-auto pt-6">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button className="w-full" asChild>
                                <Link href="/site/payment?plan=Gold%20Standard&price=5999">Choose Plan</Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>A balanced plan with great features and value.</p>
                            </TooltipContent>
                        </Tooltip>
                      </CardFooter>
                  </Card>
              </div>
            </TooltipProvider>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary">What Our Users Say</h2>
              <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
                Real stories from satisfied students and successful instructors.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonialsData.map((testimonial, index) => (
                <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
                    <CardContent className="pt-6 pb-4 flex-grow">
                        <Quote className="h-8 w-8 text-primary/30 mb-4" />
                        <p className="text-muted-foreground leading-relaxed italic">"{testimonial.testimonial}"</p>
                    </CardContent>
                    <CardFooter className="flex items-center gap-4 mt-auto pt-4 border-t">
                        <Image 
                            src={testimonial.avatar} 
                            alt={testimonial.name}
                            width={40}
                            height={40}
                            className="rounded-full"
                            data-ai-hint={testimonial.avatarHint}
                        />
                        <div className="flex-1">
                            <p className="font-semibold text-foreground">{testimonial.name}</p>
                            <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                        </div>
                        <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                key={i}
                                className={cn(
                                    "h-4 w-4",
                                    i < testimonial.rating
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-muted-foreground/30"
                                )}
                                />
                            ))}
                        </div>
                    </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

         {/* Contact Section Placeholder */}
        <section id="contact" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary mb-6">Get In Touch</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Have questions or ready to enroll? We'd love to hear from you! Reach out to our team for assistance or visit our FAQ page.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Link href="/contact">
                        <MessageSquareText />
                        Support
                    </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                    <Link href="/about">Learn More About Us</Link>
                </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <div className="flex justify-center mb-4">
            <SiteLogo />
          </div>
          <p className="mt-4 text-sm">
            &copy; {new Date().getFullYear()} Drivergy. All rights reserved.
          </p>
          <div className="mt-2 text-xs">
            <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <span className="mx-2">|</span>
            <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
