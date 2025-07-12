
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/types';
import { authenticateUserByCredentials, fetchUserById } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithCredentials: (username: string, password: string) => Promise<boolean>;
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
        if (!auth) {
            setLoading(false);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const profile = await fetchUserById(firebaseUser.uid);
                if (profile) {
                    setUser(profile);
                } else {
                    // This case might happen if a user exists in Auth but not Firestore.
                    // For this app, we'll treat them as logged out.
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        if (!auth) {
            toast({ title: "Configuration Error", description: "Firebase is not configured.", variant: "destructive" });
            return;
        }
        setLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            // onAuthStateChanged will handle setting the user and redirecting.
            toast({
                title: `Login Successful!`,
                description: 'Redirecting to your dashboard...',
            });
            router.push('/');
        } catch (error: any) {
            console.error("Google Sign-In Error:", error);
            toast({ title: "Sign-In Failed", description: error.message, variant: "destructive" });
            setLoading(false);
        }
    };

    const signInWithCredentials = async (username: string, password: string): Promise<boolean> => {
        setLoading(true);
        // This method does not create a Firebase Auth session and is intended for development/mock purposes.
        // Real users should use Google Sign-In for proper authentication with security rules.
        const userProfile = await authenticateUserByCredentials(username, password);
        if (userProfile) {
            logInUser(userProfile, true); // true to redirect
            return true;
        }
        setLoading(false);
        toast({
            title: 'Login Failed',
            description: 'Invalid username or password.',
            variant: 'destructive',
        });
        return false;
    };

    const signOut = async () => {
        setLoading(true);
        if (auth) {
            await firebaseSignOut(auth);
        }
        // For credential-based mock users who don't have a firebase auth session
        setUser(null);
        setLoading(false);
        toast({
            title: 'Logged Out',
            description: 'You have been successfully signed out.',
        });
        router.push('/site');
    };

    // This function is for mock/credential login, as Google Sign-In is handled by onAuthStateChanged
    const logInUser = (userProfile: UserProfile, isDirectLogin: boolean = false) => {
        setUser(userProfile);
        setLoading(false);

        if (isDirectLogin) {
            toast({
                title: `Welcome, ${userProfile.name}!`,
                description: 'You are now logged in.',
            });
            router.push('/');
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
