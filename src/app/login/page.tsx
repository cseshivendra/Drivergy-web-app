
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car, ShieldAlert, Sun, Moon, Home } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
    const { user, signInWithGoogle, signInWithCredentials, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect');

    const { theme, toggleTheme } = useTheme();
    const [isMounted, setIsMounted] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        setIsMounted(true);
        if (user && !loading) {
            router.push(redirect || '/'); // Redirect to intended page or dashboard after login
        }
    }, [user, loading, router, redirect]);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            toast({ title: 'Error', description: 'Please enter both username and password.', variant: 'destructive' });
            return;
        }
        const loggedIn = await signInWithCredentials(username, password);
        if (loggedIn) {
            router.push(redirect || '/');
        }
    };

    const handleGoogleSignIn = async () => {
        await signInWithGoogle();
        // The onAuthStateChanged listener in AuthContext will handle the redirect
    }

    const GoogleIcon = () => (
        <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
        </svg>
    );

    if (loading || (user && isMounted)) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Car className="h-16 w-16 animate-pulse text-primary" />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-full">
            <Image
                src="https://placehold.co/1920x1080/1f2937/ffffff.png"
                alt="Scenic driving route"
                layout="fill"
                objectFit="cover"
                className="z-0 opacity-50 dark:opacity-30 transition-opacity duration-500 ease-in-out"
                data-ai-hint="road learning earning"
                priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/80 to-background z-10 transition-colors duration-500 ease-in-out"></div>

            <div className="absolute top-6 right-6 z-30 flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="icon"
                    asChild
                    className="bg-card/80 backdrop-blur-sm hover:bg-accent/80"
                >
                    <Link href="/site" aria-label="Back to site">
                        <Home className="h-5 w-5" />
                    </Link>
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                    className="bg-card/80 backdrop-blur-sm hover:bg-accent/80"
                >
                    {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </Button>
            </div>

            <div className="relative z-20 flex min-h-screen flex-col items-center justify-center p-4">
                <Card className={`
          w-full max-w-md bg-card/90 backdrop-blur-md shadow-2xl rounded-xl border-border/50
          transition-all duration-700 ease-out
          ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
        `}>
                    <CardHeader className="text-center p-6 space-y-2">
                        <div className="mx-auto mb-3 flex items-center justify-center rounded-full bg-primary/10 p-3 w-fit">
                            <Car className="h-16 w-16 text-primary animate-pulse" />
                        </div>
                        <CardTitle className="font-headline text-4xl font-extrabold text-primary tracking-tight">Drivergy</CardTitle>
                        <p className="text-xl font-semibold text-foreground/90 mt-1">Steer Your Success</p>
                        <CardDescription className="text-muted-foreground pt-1 px-2">
                            Sign in to access your dashboard and unlock new opportunities.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-2">
                        <form onSubmit={handleSignIn} className="space-y-3">
                            <div>
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-12 text-base bg-primary hover:bg-primary/90"
                                disabled={loading}
                            >
                                Sign In
                            </Button>
                        </form>

                        <div className="relative my-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full h-12 text-base border-border hover:bg-accent/50"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                        >
                            <GoogleIcon /> Sign in with Google
                        </Button>
                    </CardContent>
                    <CardFooter className="flex flex-col items-center justify-center pt-4 pb-6 gap-3">
                        <p className="text-sm text-muted-foreground">
                            Don't have an account?{' '}
                            <Link href="/site/register" className="font-semibold text-primary hover:underline">
                                Sign Up
                            </Link>
                        </p>
                        <p className="text-xs text-muted-foreground">
                            By signing in, you agree to our Terms of Service.
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
