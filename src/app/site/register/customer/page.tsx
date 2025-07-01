
import Link from 'next/link';
import Image from 'next/image';
import RegistrationForm from '@/components/forms/registration-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, User, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { cn } from '@/lib/utils';

// Replicated SiteLogo for this page, could be a shared component later
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

export default function SiteRegisterCustomerPage() {
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
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="container mx-auto max-w-3xl py-8 sm:py-6 lg:py-8">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 flex items-center justify-center rounded-full bg-primary/10 p-3 w-fit">
                <User className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="font-headline text-3xl font-bold">Register as a Customer</CardTitle>
              <CardDescription>
                Join Drivergy! Fill in the details below to get started on your driving journey.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegistrationForm userRole="customer" />
            </CardContent>
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
          </div>
          <div className="flex items-center justify-center gap-x-8 pt-4">
              <Image 
                  src="https://placehold.co/100x30.png"
                  alt="Startup India Logo"
                  width={100}
                  height={30}
                  data-ai-hint="startup india logo"
              />
              <Image 
                  src="https://placehold.co/100x30.png"
                  alt="Made in India Logo"
                  width={100}
                  height={30}
                  data-ai-hint="made in india logo"
              />
          </div>
          <p className="text-sm pt-2">
            &copy; {new Date().getFullYear()} Drivergy. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
