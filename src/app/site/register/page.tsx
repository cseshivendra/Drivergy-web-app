'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import RegistrationForm from '@/components/forms/registration-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, User, UserCog, ArrowLeft, Facebook, Twitter, Instagram, Linkedin, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/theme-context';

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

const RoleSelectionCard = ({ icon: Icon, title, description, onClick }: { icon: React.ElementType, title: string, description: string, onClick: () => void }) => (
    <Card 
        className="text-center p-6 shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out cursor-pointer transform hover:-translate-y-2 border-2 border-transparent hover:border-primary"
        onClick={onClick}
    >
        <div className="mx-auto mb-4 flex items-center justify-center rounded-full bg-primary/10 p-4 w-fit">
            <Icon className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="font-headline text-xl font-bold">{title}</CardTitle>
        <CardDescription className="mt-2 text-muted-foreground">{description}</CardDescription>
    </Card>
);


export default function UnifiedRegisterPage() {
  const [selectedRole, setSelectedRole] = useState<'customer' | 'trainer' | null>(null);
  const searchParams = useSearchParams();
  const planFromUrl = searchParams.get('plan');
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (planFromUrl) {
      setSelectedRole('customer');
    }
  }, [planFromUrl]);


  const handleRoleSelection = (role: 'customer' | 'trainer') => {
    setSelectedRole(role);
  };

  const resetRoleSelection = () => {
    setSelectedRole(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <SiteLogo />
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/site">Back to Site</Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="container mx-auto max-w-3xl py-8 sm:py-6 lg:py-8">
          {!selectedRole ? (
            <Card className="shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="font-headline text-3xl font-bold">Join Drivergy</CardTitle>
                <CardDescription>First, let's get to know you. Are you here to learn or to teach?</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                <RoleSelectionCard 
                    icon={User}
                    title="I'm a Customer"
                    description="I want to find an instructor and learn how to drive."
                    onClick={() => handleRoleSelection('customer')}
                />
                <RoleSelectionCard 
                    icon={UserCog}
                    title="I'm a Trainer"
                    description="I'm a driving instructor looking to connect with students."
                    onClick={() => handleRoleSelection('trainer')}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-xl">
              <CardHeader className="relative text-center">
                <Button variant="ghost" size="sm" className="absolute left-4 top-4 text-muted-foreground" onClick={resetRoleSelection}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <div className="mx-auto mb-3 flex items-center justify-center rounded-full bg-primary/10 p-3 w-fit">
                  {selectedRole === 'customer' ? <User className="h-8 w-8 text-primary" /> : <UserCog className="h-8 w-8 text-primary" />}
                </div>
                <CardTitle className="font-headline text-3xl font-bold">
                  Register as a {selectedRole === 'customer' ? 'Customer' : 'Trainer'}
                </CardTitle>
                <CardDescription>
                  Join Drivergy! Fill in the details below to get started.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RegistrationForm userRole={selectedRole} />
              </CardContent>
            </Card>
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
              <div className="inline-flex items-center gap-2 rounded-md border bg-card p-2 px-3 text-sm shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-saffron">
                    <path d="M12.96,2.83,4.29,7.75a1,1,0,0,0-.54.88V15.37a1,1,0,0,0,.54.88l8.67,4.92a1,1,0,0,0,1.08,0l8.67-4.92a1,1,0,0,0,.54-.88V8.63a1,1,0,0,0-.54-.88L14.04,2.83A1,1,0,0,0,12.96,2.83ZM13.5,15.55a2.17,2.17,0,1,1,2.17-2.17A2.17,2.17,0,0,1,13.5,15.55Z" />
                  </svg>
                  <span className="font-semibold text-foreground">Startup India</span>
              </div>
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
    </div>
  );
}
