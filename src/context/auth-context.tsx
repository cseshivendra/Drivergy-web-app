
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/types';
import { authenticateUserByCredentials, fetchUserById } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { auth, isFirebaseConfigured } from '@/lib/firebase';

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithCredentials: (identifier: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    logInUser: (userProfile: UserProfile, isDirectLogin?: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        // This function now handles both Firebase and mock user setup.
        const initializeAuth = () => {
            if (isFirebaseConfigured() && auth) {
                const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                    if (firebaseUser) {
                        const profile = await fetchUserById(firebaseUser.uid);
                        if (profile) {
                            setUser(profile);
                        } else {
                            // This can happen if a user is authenticated with Firebase but has no profile document.
                            setUser(null);
                        }
                    } else {
                        setUser(null);
                    }
                    setLoading(false);
                });
                return unsubscribe;
            } else {
                console.warn("Firebase is not configured. Authentication will not work.");
                setLoading(false);
                return () => {};
            }
        };

        const unsubscribe = initializeAuth();
        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        if (!isFirebaseConfigured() || !auth) {
            toast({ title: "Offline Mode", description: "Google Sign-In is disabled. Please check your Firebase configuration.", variant: "destructive" });
            return;
        }
        setLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const firebaseUser = result.user;
            
            // Immediately fetch profile to see if user needs to complete registration
            const profile = await fetchUserById(firebaseUser.uid);
            
            if (profile) {
                setUser(profile);
                toast({ title: `Welcome, ${profile.name}!`, description: 'Redirecting to your dashboard...' });
                router.push('/dashboard');
            } else {
                // This is a new user via Google, they need to register fully.
                // We'll sign them out of firebase to force them through the registration flow
                // where their profile document will be created.
                await firebaseSignOut(auth);
                toast({ title: "Registration Incomplete", description: "Welcome! Please complete your registration to continue.", });
                router.push('/register'); // Redirect to unified registration page
            }
        } catch (error: any) {
            if (error.code !== 'auth/popup-closed-by-user') {
                toast({ title: "Sign-In Failed", description: "An error occurred during Google sign-in.", variant: "destructive" });
                console.error("Google Sign-in Error:", error);
            }
            setLoading(false);
        }
    };

    const signInWithCredentials = async (identifier: string, password: string): Promise<void> => {
        setLoading(true);
        const userProfile = await authenticateUserByCredentials(identifier, password);
        if (userProfile) {
            logInUser(userProfile, true);
        } else {
            setLoading(false);
            toast({
                title: 'Login Failed',
                description: 'Invalid credentials. Please check your email/username and password.',
                variant: 'destructive',
            });
        }
    };

    const signOut = async () => {
        setLoading(true);
        try {
            if (isFirebaseConfigured() && auth?.currentUser) {
                await firebaseSignOut(auth);
            }
        } catch(error) {
            console.error("Error signing out:", error);
        } finally {
            setUser(null);
            setLoading(false);
            toast({
                title: 'Logged Out',
                description: 'You have been successfully signed out.',
            });
            router.push('/');
        }
    };

    const logInUser = (userProfile: UserProfile, isDirectLogin: boolean = false) => {
        setUser(userProfile);
        setLoading(false);

        if (isDirectLogin) {
            toast({
                title: `Welcome, ${userProfile.name}!`,
                description: 'You are now logged in.',
            });
            router.push('/dashboard');
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, logInUser, signInWithCredentials }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
