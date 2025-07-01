
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
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 pt-4">
              {/* Startup India Badge */}
              <div className="inline-flex items-center gap-2 rounded-md border bg-card p-2 px-3 text-sm shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-saffron">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  <span className="font-semibold text-foreground">Startup India</span>
              </div>

              {/* Made in India Badge */}
              <div className="inline-flex items-center gap-2 rounded-md border bg-card p-2 px-3 text-sm shadow-sm">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-india-blue">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                      <path d="M12 3V21M3 12H21M6.34 6.34L17.66 17.66M6.34 17.66L17.66 6.34" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                  </svg>
                  <span className="font-semibold text-foreground">Made in India</span>
              </div>
          </div>
          <p className="text-sm pt-2">
            &copy; {new Date().getFullYear()} Drivergy. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
