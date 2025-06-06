
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Car, BookOpen, ShieldCheck, Users, Navigation, LogIn, UserPlus, User, UserCog, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const SiteLogo = () => (
  <Link href="/site" className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-ring rounded-md">
    <div className="p-1.5 bg-primary/10 rounded-lg transition-all duration-300">
      <Car className="h-7 w-7 text-primary shrink-0 animate-car-slide-logo" />
    </div>
    <span className={cn(
      "font-headline text-2xl font-extrabold text-primary tracking-tighter",
      "animate-typing-driverzy"
    )}>
      Driverzy
    </span>
  </Link>
);

export default function PortfolioSitePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header/Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <SiteLogo />
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <Button variant="ghost" asChild>
              <Link href="#services">Services</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="#courses">Courses</Link>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  <UserPlus className="mr-0 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Register</span>
                  <ChevronDown className="ml-1 h-4 w-4 hidden sm:inline" />
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

            <Button variant="outline" asChild>
              <Link href="/">
                <LogIn className="mr-0 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Admin Portal</span>
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <Image
              src="https://placehold.co/1920x1080.png"
              alt="Animated driving school background"
              layout="fill"
              objectFit="cover"
              className="animate-hero-bg"
              data-ai-hint="driving learning road abstract"
              priority
            />
          </div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <Car className="h-24 w-24 text-primary mx-auto mb-6 animate-pulse" />
            <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-primary">
              Welcome to Driverzy
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground">
              Your trusted partner for comprehensive driving education. Learn to drive with confidence and skill.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                <Link href="#courses">Explore Our Courses</Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                <Link href="#contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary">Our Services</h2>
              <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
                We offer a range of services tailored to meet your driving needs.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <ServiceCard
                icon={Navigation}
                title="Personalized Driving Lessons"
                description="One-on-one training with certified instructors for two-wheelers and four-wheelers."
                imageSrc="https://placehold.co/600x400.png"
                imageHint="driving lesson car"
              />
              <ServiceCard
                icon={BookOpen}
                title="RTO Exam Preparation"
                description="Comprehensive theory classes and mock tests to help you ace your RTO exam."
                imageSrc="https://placehold.co/600x400.png"
                imageHint="exam preparation book"
              />
              <ServiceCard
                icon={ShieldCheck}
                title="Defensive Driving Courses"
                description="Learn advanced techniques for safe driving in various road conditions."
                imageSrc="https://placehold.co/600x400.png"
                imageHint="safe driving shield"
              />
            </div>
          </div>
        </section>

        {/* Courses Section Placeholder */}
        <section id="courses" className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary mb-6">Our Courses</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Detailed information about our driving courses will be available here soon.
              We offer programs for all skill levels!
            </p>
            <Image 
              src="https://placehold.co/1200x300.png" 
              alt="Courses placeholder" 
              width={1200} 
              height={300} 
              className="rounded-lg shadow-lg mx-auto"
              data-ai-hint="online course education"
            />
            {/* Future: Link to /courses page from admin dashboard if content is similar, or create new portfolio course page */}
          </div>
        </section>

        {/* Subscription Plans Section Placeholder */}
        <section id="subscriptions" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary mb-6">Subscription Plans</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Choose from a variety of subscription plans designed to fit your learning pace and budget. Details coming soon!
            </p>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                        <CardTitle className="text-2xl text-primary">Basic Plan</CardTitle>
                        <CardDescription>Get started on your driving journey.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold mb-4">₹X,XXX</p>
                        <ul className="space-y-2 text-muted-foreground text-left">
                            <li>Feature 1</li>
                            <li>Feature 2</li>
                            <li>Feature 3</li>
                        </ul>
                         <Button className="w-full mt-6 bg-primary hover:bg-primary/90">Choose Plan</Button>
                    </CardContent>
                </Card>
                 <Card className="shadow-lg hover:shadow-xl transition-shadow border-2 border-primary relative overflow-hidden">
                     <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-bl-lg">Popular</div>
                    <CardHeader>
                        <CardTitle className="text-2xl text-primary">Premium Plan</CardTitle>
                        <CardDescription>Our most comprehensive package.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold mb-4">₹Y,YYY</p>
                        <ul className="space-y-2 text-muted-foreground text-left">
                            <li>All Basic Features</li>
                            <li>Premium Feature A</li>
                            <li>Premium Feature B</li>
                        </ul>
                         <Button className="w-full mt-6 bg-primary hover:bg-primary/90">Choose Plan</Button>
                    </CardContent>
                </Card>
                 <Card className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                        <CardTitle className="text-2xl text-primary">Gold Plan</CardTitle>
                        <CardDescription>Value with extra benefits.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold mb-4">₹Z,ZZZ</p>
                        <ul className="space-y-2 text-muted-foreground text-left">
                            <li>Most Basic Features</li>
                            <li>Gold Feature X</li>
                            <li>Gold Feature Y</li>
                        </ul>
                         <Button className="w-full mt-6 bg-primary hover:bg-primary/90">Choose Plan</Button>
                    </CardContent>
                </Card>
            </div>
          </div>
        </section>

         {/* Contact Section Placeholder */}
        <section id="contact" className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary mb-6">Get In Touch</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Have questions? We'd love to hear from you! Our contact form and details will be here.
            </p>
            <Button size="lg" variant="outline">Contact Us Placeholder</Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <SiteLogo />
          <p className="mt-4 text-sm">
            &copy; {new Date().getFullYear()} Driverzy. All rights reserved.
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
