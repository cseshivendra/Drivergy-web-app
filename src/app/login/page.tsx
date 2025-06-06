
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car, Smartphone, ShieldAlert, UserCircle, Sun, Moon } from 'lucide-react'; // Added UserCircle, Sun, Moon
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import Image from 'next/image';

export default function LoginPage() {
  const { user, signInWithGoogle, signInAsGuest, loading } = useAuth(); // Added signInAsGuest
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
      <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
    </svg>
  );

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Car className="h-16 w-16 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <div className="absolute top-4 right-4 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
      </div>
       <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
       <Card className="w-full max-w-md shadow-2xl z-10 rounded-xl border-border/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <Car className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl font-bold text-primary">Welcome to DriveView</CardTitle>
          <CardDescription className="text-muted-foreground pt-1">Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4"> {/* Adjusted space-y */}
          <Button 
            variant="outline" 
            className="w-full h-12 text-base border-border hover:bg-accent/50"
            onClick={signInWithGoogle}
            disabled={loading}
          >
            <GoogleIcon /> Sign in with Google
          </Button>

          <Button 
            variant="outline" 
            className="w-full h-12 text-base border-border hover:bg-accent/50"
            onClick={signInAsGuest}
            disabled={loading}
          >
            <UserCircle className="mr-2 h-5 w-5" /> Sign in as Guest
          </Button>
          
          <div className="relative my-4"> {/* Adjusted margin */}
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="phone" className="text-muted-foreground">Phone Number (OTP)</Label>
              <div className="relative mt-1">
                 <Input 
                  id="phone" 
                  type="tel" 
                  placeholder="Enter your phone number" 
                  className="h-12 text-base pl-10"
                  disabled 
                />
                <Smartphone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
            <Button 
              variant="default" 
              className="w-full h-12 text-base bg-primary hover:bg-primary/90"
              disabled // OTP not implemented
            >
              Send OTP
            </Button>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm flex items-start">
            <ShieldAlert className="h-5 w-5 mr-2 shrink-0"/>
            <span>OTP login is currently under development. Please use Google Sign-In or Guest Sign-In.</span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
            <p className="text-xs text-muted-foreground">
                By signing in, you agree to our Terms of Service.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
