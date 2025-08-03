
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut, signInWithEmailAndPassword, type Auth } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/types';
import { fetchUserById } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { initializeFirebaseApp } from '@/lib/firebase/client';
import { doc, setDoc } from 'firebase/firestore';


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
    const [auth, setAuth] = useState<Auth | null>(null);
    const router = useRouter();
    const { toast } = useToast();
    
    useEffect(() => {
        try {
            const { auth: initializedAuth } = initializeFirebaseApp();
            setAuth(initializedAuth);

            const unsubscribe = onAuthStateChanged(initializedAuth, async (firebaseUser) => {
                if (firebaseUser) {
                    const profile = await fetchUserById(firebaseUser.uid);
                    setUser(profile);
                } else {
                    setUser(null);
                }
                setLoading(false);
            });
            return () => unsubscribe();
        } catch (error) {
            console.error("Firebase initialization failed in AuthContext:", error);
            toast({
                title: "Configuration Error",
                description: "Could not connect to services. Please check your setup.",
                variant: "destructive",
            });
            setLoading(false);
            return;
        }
    }, [toast]);

    const signInWithGoogle = async () => {
        if (!auth) return;
        try {
            const { db } = initializeFirebaseApp();
            const provider = new GoogleAuthProvider();

            setLoading(true);
            const result = await signInWithPopup(auth, provider);
            const firebaseUser = result.user;
            
            let profile = await fetchUserById(firebaseUser.uid);

            if (profile) {
                setUser(profile);
                toast({ title: `Welcome back, ${profile.name}!`, description: 'Redirecting to your dashboard...' });
            } else {
                const userRef = doc(db, "customers", firebaseUser.uid);
                const name = firebaseUser.displayName || 'New User';
                const email = firebaseUser.email;

                if (!email) {
                    throw new Error("Could not retrieve email from Google.");
                }

                const newUserProfile: Omit<UserProfile, 'id'> = {
                    uniqueId: `CU-${firebaseUser.uid.slice(-6).toUpperCase()}`,
                    name,
                    contact: email,
                    phone: firebaseUser.phoneNumber || '',
                    gender: 'Prefer not to say',
                    location: 'TBD',
                    subscriptionPlan: "None",
                    registrationTimestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    approvalStatus: 'Pending',
                    photoURL: firebaseUser.photoURL || `https://placehold.co/100x100.png?text=${name.charAt(0)}`,
                    myReferralCode: `${name.split(' ')[0].toUpperCase()}${uid.slice(-4)}`,
                    trainerPreference: 'Any',
                };
                
                await setDoc(userRef, newUserProfile);
                profile = { id: firebaseUser.uid, ...newUserProfile } as UserProfile;
                setUser(profile);
                toast({ title: "Welcome to Drivergy!", description: "Your account has been created." });
            }
            router.push('/dashboard');

        } catch (error: any) {
            if (error.code === 'auth/popup-closed-by-user') {
                return; // User closed popup, do not show error
            }
            if (error.code === 'auth/account-exists-with-different-credential') {
                 toast({ title: "Sign-In Failed", description: "An account with this email already exists using a different sign-in method.", variant: "destructive" });
            } else {
                toast({ title: "Sign-In Failed", description: error.message || "An error occurred.", variant: "destructive" });
            }
            console.error("Google Sign-in Error:", error);
        } finally {
            setLoading(false);
        }
    };
    
    const signInWithCredentials = async (identifier: string, password: string): Promise<void> => {
        if (!auth) return;
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, identifier, password);
            toast({ title: 'Login Successful!', description: 'Redirecting to your dashboard...' });
            router.push('/dashboard');
        } catch (error: any) {
            let description = 'An unexpected error occurred. Please try again.';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                 description = 'Invalid credentials. Please check your email and password.';
            }
            toast({
                title: 'Login Failed',
                description: description,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        if (!auth) return;
        try {
            setLoading(true);
            await firebaseSignOut(auth);
            setUser(null);
            toast({
                title: 'Logged Out',
                description: 'You have been successfully signed out.',
            });
            router.push('/');
        } catch(error) {
            console.error("Error signing out:", error);
            toast({ title: 'Logout Failed', description: 'An error occurred while signing out.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const logInUser = (user: UserProfile, redirect = true) => {
        setUser(user);
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
