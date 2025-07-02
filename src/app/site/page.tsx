'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Car, BookOpen, ShieldCheck, Users, Navigation, Lock, UserPlus, User, UserCog, ChevronDown, Bike, ClipboardCheck, Power, Star, Check, Sun, Moon, MessageSquareText, Quote, HelpCircle, LayoutDashboard, BookText, Facebook, Twitter, Instagram, Linkedin, MoveRight, CircleDot, TrendingUp, Target, KeyRound, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { useState, useEffect } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ChatWidget from '@/components/chatbot/chat-widget';


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

const slidesData = [
  {
    src: "https://placehold.co/1920x1080.png",
    hint: "driving lesson student",
    title: "Learn to Drive, Master the Road",
    description: "Join Drivergy for expert instruction, flexible scheduling, and the freedom to drive with confidence.",
  },
  {
    src: "https://placehold.co/1920x1080.png",
    hint: "driving instructor car",
    title: "Empowering Driving Instructors",
    description: "Access powerful tools to manage your schedule, track student progress, and grow your business.",
  },
  {
    src: "https://placehold.co/1920x1080.png",
    hint: "city road traffic",
    title: "Your Journey to a License Starts Here",
    description: "Comprehensive RTO assistance and test preparation to help you succeed.",
  },
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
    if (slidesData.length === 0) return;

    const timer = setTimeout(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === slidesData.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000); // Change image every 3 seconds

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
              <Link href="/site/blog">Blog</Link>
            </Button>
             <Button variant="ghost" asChild>
              <Link href="#subscriptions">Plans</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="#testimonials">Testimonials</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/site/faq">FAQ</Link>
            </Button>
             <Button variant="ghost" asChild>
              <Link href="#contact">Support</Link>
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
                <Button asChild>
                  <Link href="/site/register">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign Up
                  </Link>
                </Button>
                
                <Button asChild>
                  <Link href="/login">
                    <Lock className="mr-2 h-4 w-4" />
                    Login
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

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative h-[60vh] md:h-[70vh] flex flex-col items-center justify-center text-center text-white overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            {slidesData.map((slide, index) => (
              <Image
                key={index}
                src={slide.src}
                alt={`Background slide ${index + 1}`}
                layout="fill"
                objectFit="cover"
                className={cn(
                  "hero-bg-slide",
                  index === currentImageIndex && "active"
                )}
                priority={index === 0}
                data-ai-hint={slide.hint}
              />
            ))}
          </div>
          <div className="absolute inset-0 bg-black/60 z-[5] pointer-events-none"></div> {/* Darker overlay for better contrast */}
          
          <div className="relative z-10 p-4 container mx-auto flex flex-col justify-center items-center h-full">
            <div className="relative h-48 sm:h-56 w-full flex-grow flex items-center justify-center">
              {slidesData.map((slide, index) => (
                <div
                  key={index}
                  className={cn(
                    "absolute inset-0 flex flex-col items-center justify-center text-center p-4 transition-opacity duration-1000 ease-in-out",
                    index === currentImageIndex ? "opacity-100 animate-fade-in-up" : "opacity-0 pointer-events-none"
                  )}
                >
                  {/* Animated decorative icons */}
                  <div aria-hidden="true" className="absolute inset-0 w-full h-full pointer-events-none hidden md:block">
                    {index === 0 && (
                      <>
                        <Navigation className="absolute top-[20%] left-[15%] h-12 w-12 text-white/20 animate-float" style={{ animationDuration: '5s' }} />
                        <MoveRight className="absolute bottom-[25%] right-[20%] h-16 w-16 text-white/10 animate-float" style={{ animationDelay: '1s' }} />
                        <CircleDot className="absolute top-[50%] right-[10%] h-8 w-8 text-white/15 animate-pulse-subtle" />
                      </>
                    )}
                    {index === 1 && (
                      <>
                        <TrendingUp className="absolute top-[25%] right-[18%] h-14 w-14 text-white/20 animate-pulse-subtle" />
                        <Target className="absolute bottom-[20%] left-[15%] h-16 w-16 text-white/15 animate-spin-slow" style={{ animationDuration: '12s' }} />
                      </>
                    )}
                    {index === 2 && (
                      <>
                        <KeyRound className="absolute top-[22%] left-[20%] h-12 w-12 text-white/20 animate-float" />
                        <Award className="absolute bottom-[22%] right-[18%] h-16 w-16 text-white/25 animate-pulse-subtle" style={{ animationDelay: '0.5s', animationDuration: '4s' }} />
                        <Star className="absolute top-[40%] right-[30%] h-6 w-6 text-white/15 animate-spin-slow" />
                      </>
                    )}
                  </div>
                  
                  <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl drop-shadow-2xl font-headline">
                    {slide.title}
                  </h1>
                  <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-white/90 drop-shadow-sm">
                    {slide.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-auto pb-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
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
                className="w-full sm:w-auto border-red-500 bg-white text-red-500 hover:bg-red-500 hover:text-white font-semibold px-8 py-3 text-base transition-colors duration-300"
                asChild
              >
                <Link href="/site/register/trainer">Register as Trainer</Link>
              </Button>
            </div>
          </div>
        </section>


        {/* Services Section */}
        <section id="services" className="py-8 md:py-12 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in-up">
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
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in-up">
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
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-in-up">
            <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary mb-6">Flexible Subscription Plans</h2>
            <p className="text-lg text-muted-foreground mb-12 max-w-xl mx-auto">
              Choose a plan that fits your learning pace and budget. All plans include expert guidance and progress tracking.
            </p>
             <TooltipProvider>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <Card className="shadow-lg hover:shadow-xl flex flex-col transition-transform duration-300 hover:-translate-y-2">
                      <CardHeader className="pb-4">
                          <CardTitle className="text-2xl text-primary flex items-center justify-center">
                            Basic
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
                                <Link href="/site/payment?plan=Basic&price=3999">Choose Plan</Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Click to start your driving journey with the Basic plan.</p>
                            </TooltipContent>
                        </Tooltip>
                      </CardFooter>
                  </Card>
                  <Card className="shadow-xl hover:shadow-2xl border-2 border-primary relative overflow-hidden flex flex-col transform md:scale-105 z-10 bg-card transition-transform duration-300 hover:-translate-y-2">
                      <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-bl-lg shadow-md flex items-center">
                          <Star className="h-3 w-3 mr-1.5" /> POPULAR
                      </div>
                      <CardHeader className="pb-4">
                          <CardTitle className="text-2xl text-primary flex items-center justify-center">
                              Premium
                          </CardTitle>
                          <CardDescription>Our most comprehensive package.</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow space-y-4">
                          <div className="flex items-center justify-center gap-x-2 mb-2">
                              <p className="text-4xl font-bold">₹9,999</p>
                              <p className="text-xl font-medium text-muted-foreground line-through">₹10,999</p>
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
                                <Link href="/site/payment?plan=Premium&price=9999">Choose Plan</Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Get the best value and features with our Premium plan.</p>
                            </TooltipContent>
                        </Tooltip>
                      </CardFooter>
                  </Card>
                  <Card className="shadow-lg hover:shadow-xl flex flex-col transition-transform duration-300 hover:-translate-y-2">
                      <CardHeader className="pb-4">
                          <CardTitle className="text-2xl text-primary flex items-center justify-center">
                            Gold
                          </CardTitle>
                          <CardDescription>Excellent value with extra benefits.</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow space-y-4">
                          <div className="flex items-center justify-center gap-x-2 mb-2">
                              <p className="text-4xl font-bold">₹7,499</p>
                              <p className="text-xl font-medium text-muted-foreground line-through">₹8,499</p>
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
                                <Link href="/site/payment?plan=Gold&price=7499">Choose Plan</Link>
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
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in-up">
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
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background">
        {/* Contact Section moved into footer */}
        <section id="contact" className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-in-up">
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
                    <Link href="/site/faq">FAQ</Link>
                </Button>
            </div>
          </div>
        </section>

        
        {/* Final Copyright Footer */}
        <div className="border-t border-border/40 bg-background py-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground space-y-4">
                <div className="flex justify-center">
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
        </div>
      </footer>
      <ChatWidget />
    </div>
  );
}
