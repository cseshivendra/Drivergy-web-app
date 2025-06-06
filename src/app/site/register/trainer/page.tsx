
import Link from 'next/link';
import RegistrationForm from '@/components/forms/registration-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';

// Replicated SiteLogo for this page, could be a shared component later
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

export default function SiteRegisterTrainerPage() {
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
                <UserCog className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="font-headline text-3xl font-bold">Register as a Trainer</CardTitle>
              <CardDescription>
                Become a Driverzy Trainer! Fill in your details to start connecting with students.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegistrationForm userRole="trainer" />
            </CardContent>
          </Card>
        </div>
      </main>
       <footer className="border-t border-border/40 bg-background py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
           <div className="flex justify-center mb-4">
            <SiteLogo />
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Driverzy. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
