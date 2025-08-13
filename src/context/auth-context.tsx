
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithCredentials: (identifier: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    logInUser: (user: UserProfile, redirect?: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // User is signed in, fetch their profile from Firestore
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUser({ id: userDoc.id, ...userDoc.data() } as UserProfile);
                } else {
                    // This case might happen if a user is created in Auth but not Firestore
                    // Or you might want to create a profile here for new sign-ups
                    setUser(null);
                }
            } else {
                // User is signed out
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        setLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const firebaseUser = result.user;
            
            // Check if user exists in Firestore
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                // New user, create a profile in Firestore
                const newUserProfile: UserProfile = {
                    id: firebaseUser.uid,
                    uniqueId: `CU-${Date.now().toString().slice(-6)}`,
                    name: firebaseUser.displayName || 'Google User',
                    contact: firebaseUser.email!,
                    phone: firebaseUser.phoneNumber || '',
                    photoURL: firebaseUser.photoURL || '',
                    subscriptionPlan: 'None',
                    registrationTimestamp: new Date().toISOString(),
                    approvalStatus: 'Pending',
                    gender: 'Prefer not to say', // Default value
                };
                await setDoc(userDocRef, newUserProfile);
                setUser(newUserProfile);
                toast({ title: 'Welcome!', description: 'Your account has been created.' });
                router.push('/#subscriptions');
            } else {
                 // Existing user
                const userProfile = { id: userDoc.id, ...userDoc.data() } as UserProfile;
                setUser(userProfile);
                toast({ title: 'Welcome Back!', description: 'Successfully signed in.' });
                router.push('/dashboard');
            }
        } catch (error: any) {
            toast({ title: 'Google Sign-In Failed', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const signInWithCredentials = async (identifier: string, password: string): Promise<void> => {
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, identifier, password);
            toast({ title: 'Login Successful!', description: 'Redirecting to your dashboard...' });
            router.push('/dashboard');
        } catch (error: any) {
             toast({ 
                title: 'Login Failed', 
                description: 'Invalid credentials or user not found.', 
                variant: 'destructive' 
            });
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        setLoading(true);
        await firebaseSignOut(auth);
        setUser(null);
        toast({ title: 'Logged Out', description: 'You have been successfully signed out.' });
        setLoading(false);
        router.push('/');
    };
    
    // This function is useful for manual state updates after server actions
    const logInUser = async (userToLog: UserProfile, redirect = true) => {
        setUser(userToLog);
        if (redirect) {
            router.push('/dashboard');
        }
    };

    const value: AuthContextType = {
        user,
        loading,
        signInWithGoogle,
        signInWithCredentials,
        signOut,
        logInUser
    };

    return (
        <AuthContext.Provider value={value}>
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
