
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Car, BookOpen, ShieldCheck, Users, Navigation, UserPlus, Bike, ClipboardCheck, Star, Check, MessageSquareText, Quote, MoveRight, CircleDot, TrendingUp, Target, KeyRound, Award, LogIn, Clock, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { listenToSiteBanners } from '@/lib/mock-data';
import type { SiteBanner } from '@/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect } from 'react';
import PromotionalPopup from '@/components/popups/promotional-popup';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


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
          <CardTitle as="h3" className="font-headline text-xl font-semibold text-primary">{title}</CardTitle>
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
    imageSrc: "https://res.cloudinary.com/dssbgilba/image/upload/v1753180604/Gemini_Generated_Image_zcrb88zcrb88zcrb_s6hlap.png",
    imageHint: "car driving lesson student",
    details: [
        "1-on-1 Personalized Training",
        "Manual & Automatic Options",
        "Highway Driving Practice",
        "Night Driving Session",
        "Basic Vehicle Maintenance"
    ]
  },
  {
    id: "motorcycle-course",
    icon: Bike,
    title: "Motorcycle Rider Course",
    description: "Become a skilled and safe motorcycle rider. Our course covers bike handling, balance, safety gear importance, and real-world riding scenarios.",
    imageSrc: "https://res.cloudinary.com/dssbgilba/image/upload/v1753180604/Gemini_Generated_Image_4j07z44j07z44j07_nhtkry.png",
    imageHint: "motorcycle training bike rider",
    details: [
        "Scooter & Geared Bike Training",
        "Advanced Braking Techniques",
        "Slalom & Cone Weaving Drills",
        "Group Riding Etiquette",
        "All Safety Gear Provided"
    ]
  },
  {
    id: "rto-assistance",
    icon: ClipboardCheck,
    title: "RTO License Assistance",
    description: "Successfully navigate the RTO licensing process. We provide guidance for learners' and permanent licenses, including documentation support and test preparation.",
    imageSrc: "https://res.cloudinary.com/dssbgilba/image/upload/v1753180603/Gemini_Generated_Image_7pzsi77pzsi77pzs_um61ih.png",
    imageHint: "license test exam RTO",
    details: [
        "Learner's License Application Help",
        "Permanent License Slot Booking",
        "RTO Mock Test Simulation",
        "Documentation Checklist",
        "Test Day Guidance"
    ]
  }
];

const testimonialsData = [
    {
      name: "Priya Sharma",
      role: "Customer, Bangalore",
      avatar: "https://placehold.co/100x100/f472b6/ffffff.png",
      avatarHint: "happy female driver",
      testimonial: "Drivergy made learning to drive so easy! My instructor was patient and professional. The scheduling system is fantastic. I passed my test on the first try. Highly recommended!",
      rating: 5,
    },
    {
      name: "Rohan Verma",
      role: "Trainer, Mumbai",
      avatar: "https://placehold.co/100x100/818cf8/ffffff.png",
      avatarHint: "professional driving instructor",
      testimonial: "As an instructor, Drivergy's platform has streamlined my business. I can manage my bookings, track student progress, and receive payments all in one place. It lets me focus on what I do best - teaching.",
      rating: 5,
    },
    {
      name: "Anjali Mehta",
      role: "Customer, Delhi",
      avatar: "https://placehold.co/100x100/a78bfa/ffffff.png",
      avatarHint: "confident woman driver",
      testimonial: "I was nervous about driving in a big city, but the defensive driving course gave me the confidence I needed. The app is user-friendly and the support team is very responsive.",
      rating: 4,
    },
];

const skillModules = [
    {
        title: "City Driving",
        skills: [
            "Bumper to bumper traffic",
            "Navigating flyovers, intersections and roundabouts",
            "Maintaining and changing lanes",
            "Evening driving",
        ],
        duration: "4 hours"
    },
    {
        title: "Flyover Driving",
        skills: [
            "Flyover entry/exit with maintaining speed limit",
            "Changing lanes",
            "Safe overtaking",
            "Steering on curves",
        ],
        duration: "2 hours"
    },
    {
        title: "Parking",
        skills: [
            "Entry/exit parking spots",
            "Parallel parking",
            "Perpendicular parking",
            "On-road parking",
        ],
        duration: "4 hours"
    },
    {
        title: "Driving on slopes",
        skills: [
            "Uphill and downhill driving",
            "Speed control on slopes",
            "Driving through bends",
        ],
        duration: "2 hours"
    },
];

const DrivergyLogoMini = ({className} : {className?: string}) => (
    <div className={cn("inline-flex items-center justify-center p-1 rounded-full bg-primary/10 shadow-inner", className)}>
        <Car className="h-4 w-4 text-primary" />
    </div>
);


export default function PortfolioSitePage() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);

  const heroSlides: SiteBanner[] = [
    {
        id: "banner-1",
        title: "India's #1 Driving School",
        description: "Join thousands of students who have successfully learned to drive with our expert instructors and state-of-the-art platform. Start your car driving lessons today.",
        imageSrc: "https://res.cloudinary.com/dssbgilba/image/upload/v1753180604/Gemini_Generated_Image_zcrb88zcrb88zcrb_s6hlap.png",
        imageHint: "driving road car sunset",
    },
    {
        id: "banner-2",
        title: "Become a Certified Driving Trainer",
        description: "Empower the next generation of drivers. Join our platform to manage your schedule, connect with students, and grow your business.",
        imageSrc: "https://res.cloudinary.com/dssbgilba/image/upload/v1753180604/Gemini_Generated_Image_4j07z44j07z44j07_nhtkry.png",
        imageHint: "driving instructor teaching student",
    },
    {
        id: "banner-3",
        title: "Master Indian Roads with Confidence",
        description: "Our advanced courses will equip you with defensive driving techniques and skills for all road conditions. Sign up now!",
        imageSrc: "https://res.cloudinary.com/dssbgilba/image/upload/v1753180603/Gemini_Generated_Image_7pzsi77pzsi77pzs_um61ih.png",
        imageHint: "city traffic modern car",
    }
  ];

  useEffect(() => {
    const popupShown = sessionStorage.getItem('promotionalPopupShown');
    if (!popupShown) {
      const popupTimer = setTimeout(() => {
        setIsPopupOpen(true);
        sessionStorage.setItem('promotionalPopupShown', 'true');
      }, 2000); 
      
      return () => clearTimeout(popupTimer);
    }
  }, []);

  useEffect(() => {
    if (heroSlides.length === 0) return;
    const slideInterval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(slideInterval);
  }, [heroSlides]);


  return (
    <>
      <PromotionalPopup isOpen={isPopupOpen} onOpenChange={setIsPopupOpen} />
      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[70vh] flex flex-col items-center justify-center text-center text-white overflow-hidden">
        {/* Background container for images and overlay */}
        <div className="absolute inset-0">
          {/* Image Slideshow */}
          {heroSlides.length > 0 && heroSlides.map((slide, index) => (
              <div
                  key={slide.id}
                  className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${index === currentSlide ? "opacity-100" : "opacity-0"}`}
                  style={{ backgroundImage: `url(${slide.imageSrc})` }}
                  role="img"
                  aria-label={slide.description}
              />
          ))}
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60" />
        </div>
        
        {/* Text Content */}
        <div className="relative z-10 p-4 container mx-auto flex flex-col justify-center items-center h-full">
            {heroSlides.length > 0 && (
            <div className="relative text-center w-full flex-grow flex flex-col items-center justify-center">
              {heroSlides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={cn(
                    "absolute inset-0 flex flex-col items-center justify-center p-4 transition-all duration-1000 ease-in-out",
                    currentSlide === index ? "opacity-100 scale-100" : "opacity-0 scale-95"
                  )}
                >
                    <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl drop-shadow-2xl font-headline">
                      {slide.title}
                    </h1>
                    <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-white/90 drop-shadow-sm">
                      {slide.description}
                    </p>
                </div>
              ))}
            </div>
          )}

          {/* Buttons (static) */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-auto pb-8 z-20 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Button 
              size="lg" 
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 text-base" 
              asChild
            >
              <Link href="#courses">Explore Driving Courses &rarr;</Link>
            </Button>
            <Button 
              size="lg" 
              variant="secondary" 
              className="w-full sm:w-auto font-semibold px-8 py-3 text-base transition-colors duration-300"
              asChild
            >
              <Link href="/register">Become a Driving Trainer</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-8 md:py-12 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in-up">
          <div className="text-center mb-12">
            <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary">Your Journey to Safe Driving Starts Here</h2>
            <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
              We offer a complete range of driving services, including lessons for women and men, RTO assistance, and advanced defensive driving.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ServiceCard
              icon={Navigation}
              title="Expert Driving Lessons"
              description="Tailored one-on-one training sessions with certified instructors for both two-wheelers and four-wheelers. Learn at your own pace, focusing on your specific needs and building confidence behind the wheel."
              imageSrc="https://res.cloudinary.com/dssbgilba/image/upload/v1753184436/ChatGPT_Image_Jul_22_2025_05_10_07_PM_of3qij.png"
              imageHint="car driving lesson instructor"
            />
            <ServiceCard
              icon={BookOpen}
              title="RTO Exam Preparation"
              description="Ace your RTO exam with our comprehensive preparation module. We cover theory, traffic rules, and provide mock tests to ensure you're fully prepared for your driving license."
              imageSrc="https://res.cloudinary.com/dssbgilba/image/upload/v1753185386/WhatsApp_Image_2025-07-22_at_17.24.27_cfa7cd37_nqwyhb.jpg"
              imageHint="exam preparation book test"
            />
            <ServiceCard
              icon={ShieldCheck}
              title="Defensive Driving Courses"
              description="Master advanced driving techniques to navigate challenging road conditions and anticipate hazards. Our defensive driving course enhances your safety and awareness on the road."
              imageSrc="https://res.cloudinary.com/dssbgilba/image/upload/v1753180602/Gemini_Generated_Image_3vqnhu3vqnhu3vqn_bzdhmq.png"
              imageHint="safe driving shield road"
            />
          </div>
        </div>
      </section>

      {/* New Skills Section */}
        <section id="skills" className="py-16 md:py-24 bg-muted/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in-up">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary">What You'll Master</h2>
                    <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
                        Our curriculum is designed to build your confidence by focusing on real-world driving skills.
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {skillModules.map((mod) => (
                        <Card key={mod.title} className="shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 overflow-hidden bg-card border-l-4 border-primary flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3 font-headline text-2xl font-bold text-primary">
                                    <DrivergyLogoMini />
                                    {mod.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 flex-grow">
                                <Accordion type="single" collapsible defaultValue="item-1">
                                    <AccordionItem value="item-1" className="border rounded-md px-4 bg-muted/50 border-border">
                                        <AccordionTrigger className="py-2.5 font-semibold hover:no-underline text-foreground">
                                          What will we ace together?
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-2 pb-2">
                                            <ul className="space-y-2 list-disc pl-5 text-muted-foreground">
                                                {mod.skills.map((skill, i) => (
                                                    <li key={i}>{skill}</li>
                                                ))}
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                                 <div className="flex items-center justify-between gap-2 pt-2 text-foreground">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-6 w-6 opacity-70 text-primary" />
                                        <span className="font-semibold">Duration:</span>
                                        <span className="font-bold text-lg">{mod.duration}</span>
                                    </div>
                                    <p className="text-2xl font-bold text-primary">₹999</p>
                                </div>
                            </CardContent>
                            <CardFooter className="mt-auto pt-4 border-t border-border/50">
                                <Button className="w-full" asChild>
                                    <Link href="/register">Ride Now</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

    {/* Courses Section */}
    <section id="courses" className="py-16 md:py-24 bg-background">
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
                <Image src={course.imageSrc} alt={course.title} layout="fill" objectFit="cover" data-ai-hint={course.imageHint} />
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-center mb-2">
                  <div className="p-2 bg-primary/10 rounded-md mr-3">
                    <course.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle as="h3" className="font-headline text-xl font-semibold text-primary">{course.title}</CardTitle>
                </div>
                 <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                 <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="details" className="border-b-0">
                        <AccordionTrigger className="text-sm font-semibold hover:no-underline py-2">
                            View Course Details
                        </AccordionTrigger>
                        <AccordionContent className="text-sm px-1 pb-3">
                           <ul className="space-y-2 text-muted-foreground">
                              {course.details.map((detail, index) => (
                                <li key={index} className="flex items-center">
                                    <Check className="h-4 w-4 mr-2 text-green-500 shrink-0" />
                                    <span>{detail}</span>
                                </li>
                               ))}
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
              </CardContent>
              <CardFooter className="mt-auto pt-4 border-t border-border/50">
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                  <Link href="/register">Enroll Now</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>

      {/* Subscription Plans Section */}
        <section id="subscriptions" className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-in-up">
            <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary mb-6">Affordable Driving Lesson Prices</h2>
            <p className="text-lg text-muted-foreground mb-12 max-w-xl mx-auto">
                Choose a plan that fits your learning pace and budget. All plans include expert guidance and progress tracking.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                {/* Basic Plan */}
                <div className="perspective-1000 h-[32rem]">
                    <div className={cn("relative w-full h-full transform-style-3d transition-transform duration-700", { 'rotate-y-180': flippedCardId === 'basic-plan' })}>
                        <Card className="absolute w-full h-full backface-hidden shadow-lg hover:shadow-xl flex flex-col transition-transform duration-300 hover:-translate-y-2">
                            <CardHeader className="pb-4"><CardTitle as="h3" className="text-2xl text-primary flex items-center justify-center">Basic</CardTitle><CardDescription>Perfect for beginners to get started.</CardDescription></CardHeader>
                            <CardContent className="flex-grow space-y-4">
                                <div className="text-center mb-2"><p className="text-4xl font-bold">₹3,999</p><p className="text-sm text-muted-foreground line-through">₹4,999</p></div>
                                <ul className="space-y-2 text-muted-foreground text-sm text-left"><li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />10 Practical Driving Sessions</li><li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Basic Theory Classes</li><li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Learner's License Assistance</li><li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Flexible Slot Booking</li><li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Free 15 Sets of RTO test Quiz</li></ul>
                            </CardContent>
                            <CardFooter className="mt-auto pt-6 flex gap-2"><Button className="w-full" variant="outline" onClick={() => setFlippedCardId('basic-plan')}>Details</Button><Button className="w-full" asChild><Link href="/payment?plan=Basic&price=3999">Buy Course</Link></Button></CardFooter>
                        </Card>
                        <Card className="absolute w-full h-full backface-hidden rotate-y-180 shadow-lg flex flex-col p-6 bg-primary text-primary-foreground">
                            <CardHeader><CardTitle as="h3" className="font-headline text-xl font-semibold">Basic Plan Details</CardTitle></CardHeader>
                            <CardContent className="flex-grow"><ul className="space-y-3"><li><Check className="h-5 w-5 mr-3 mt-0.5 shrink-0 inline-block"/>Great for new learners.</li><li><Check className="h-5 w-5 mr-3 mt-0.5 shrink-0 inline-block"/>Focus on fundamental driving skills.</li><li><Check className="h-5 w-5 mr-3 mt-0.5 shrink-0 inline-block"/>Ideal for city driving practice.</li></ul></CardContent>
                            <CardFooter className="flex gap-2"><Button variant="secondary" onClick={() => setFlippedCardId(null)}>Back</Button><Button variant="secondary" asChild><Link href="/payment?plan=Basic&price=3999">Buy Course</Link></Button></CardFooter>
                        </Card>
                    </div>
                </div>

                {/* Premium Plan - Corrected */}
                 <div className="relative z-10">
                    <div className="perspective-1000 h-[32rem] w-full transform md:scale-105">
                        <div className={cn("relative w-full h-full transform-style-3d transition-transform duration-700", { 'rotate-y-180': flippedCardId === 'premium-plan' })}>
                            {/* Front */}
                            <Card className="absolute w-full h-full backface-hidden shadow-xl hover:shadow-2xl border-2 border-primary overflow-hidden flex flex-col bg-card transition-transform duration-300 hover:-translate-y-2">
                                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-bl-lg shadow-md flex items-center"><Star className="h-3 w-3 mr-1.5" /> POPULAR</div>
                                <CardHeader className="pb-4"><CardTitle as="h3" className="text-2xl text-primary flex items-center justify-center">Premium</CardTitle><CardDescription>Our most comprehensive package.</CardDescription></CardHeader>
                                <CardContent className="flex-grow space-y-4">
                                    <div className="text-center mb-2"><p className="text-4xl font-bold">₹9,999</p><p className="text-sm text-muted-foreground line-through">₹12,999</p></div>
                                    <ul className="space-y-2 text-muted-foreground text-sm text-left"><li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />20 Practical Driving Sessions</li><li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Advanced Theory & Defensive Driving</li><li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />RTO Test Slot Booking</li><li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Dedicated Instructor Support</li><li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Road Safety Workshop</li><li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Free 15 Sets of RTO test Quiz</li></ul>
                                </CardContent>
                                <CardFooter className="mt-auto pt-6 flex gap-2"><Button className="w-full" variant="outline" onClick={() => setFlippedCardId('premium-plan')}>Details</Button><Button className="w-full bg-primary hover:bg-primary/90" asChild><Link href="/payment?plan=Premium&price=9999">Buy Course</Link></Button></CardFooter>
                            </Card>
                            {/* Back */}
                            <Card className="absolute w-full h-full backface-hidden rotate-y-180 shadow-lg flex flex-col p-6 bg-primary text-primary-foreground">
                                <CardHeader><CardTitle as="h3" className="font-headline text-xl font-semibold">Premium Plan Details</CardTitle></CardHeader>
                                <CardContent className="flex-grow"><ul className="space-y-3"><li><Check className="h-5 w-5 mr-3 mt-0.5 shrink-0 inline-block"/>For those who want to master driving.</li><li><Check className="h-5 w-5 mr-3 mt-0.5 shrink-0 inline-block"/>Includes advanced safety techniques.</li><li><Check className="h-5 w-5 mr-3 mt-0.5 shrink-0 inline-block"/>Full RTO and test support.</li></ul></CardContent>
                                <CardFooter className="flex gap-2"><Button variant="secondary" onClick={() => setFlippedCardId(null)}>Back</Button><Button variant="secondary" asChild><Link href="/payment?plan=Premium&price=9999">Buy Course</Link></Button></CardFooter>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Gold Plan */}
                <div className="perspective-1000 h-[32rem]">
                    <div className={cn("relative w-full h-full transform-style-3d transition-transform duration-700", { 'rotate-y-180': flippedCardId === 'gold-plan' })}>
                        <Card className="absolute w-full h-full backface-hidden shadow-lg hover:shadow-xl flex flex-col transition-transform duration-300 hover:-translate-y-2">
                            <CardHeader className="pb-4"><CardTitle as="h3" className="text-2xl text-primary flex items-center justify-center">Gold</CardTitle><CardDescription>Excellent value with extra benefits.</CardDescription></CardHeader>
                            <CardContent className="flex-grow space-y-4">
                                <div className="text-center mb-2"><p className="text-4xl font-bold">₹7,499</p><p className="text-sm text-muted-foreground line-through">₹9,999</p></div>
                                <ul className="space-y-2 text-muted-foreground text-sm text-left"><li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />15 Practical Driving Sessions</li><li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Comprehensive Theory & Mock Tests</li><li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Flexible Scheduling</li><li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Progress Tracking App Access</li><li className="flex items-center"><Check className="h-4 w-4 mr-2 text-green-500" />Free 15 Sets of RTO test Quiz</li></ul>
                            </CardContent>
                            <CardFooter className="mt-auto pt-6 flex gap-2"><Button className="w-full" variant="outline" onClick={() => setFlippedCardId('gold-plan')}>Details</Button><Button className="w-full" asChild><Link href="/payment?plan=Gold&price=7499">Buy Course</Link></Button></CardFooter>
                        </Card>
                         <Card className="absolute w-full h-full backface-hidden rotate-y-180 shadow-lg flex flex-col p-6 bg-primary text-primary-foreground">
                            <CardHeader><CardTitle as="h3" className="font-headline text-xl font-semibold">Gold Plan Details</CardTitle></CardHeader>
                            <CardContent className="flex-grow"><ul className="space-y-3"><li><Check className="h-5 w-5 mr-3 mt-0.5 shrink-0 inline-block"/>A balanced approach to learning.</li><li><Check className="h-5 w-5 mr-3 mt-0.5 shrink-0 inline-block"/>More practice sessions than Basic.</li><li><Check className="h-5 w-5 mr-3 mt-0.5 shrink-0 inline-block"/>Includes mock tests for confidence.</li></ul></CardContent>
                            <CardFooter className="flex gap-2"><Button variant="secondary" onClick={() => setFlippedCardId(null)}>Back</Button><Button variant="secondary" asChild><Link href="/payment?plan=Gold&price=7499">Buy Course</Link></Button></CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 md:py-24 bg-background">
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
                          alt={testimonial.avatarHint}
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
      {/* Contact Section */}
      <section id="contact" className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-in-up">
          <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary mb-6">Questions About Driving Lessons?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Have questions or ready to enroll in the best driving school in India? We'd love to hear from you! Reach out to our team for assistance or visit our FAQ page.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link href="/contact">
                      <MessageSquareText />
                      Support
                  </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                  <Link href="/faq">FAQ</Link>
              </Button>
          </div>
        </div>
      </section>
    </>
  );
}
