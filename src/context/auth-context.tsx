
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut, signInWithEmailAndPassword } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/types';
import { fetchUserById } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { isFirebaseConfigured, getClientAuth, getClientFirestore } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { FirebaseOptions } from 'firebase/app';


interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithCredentials: (identifier: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children, firebaseConfig }: { children: ReactNode, firebaseConfig: FirebaseOptions }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();
    
    useEffect(() => {
        if (!isFirebaseConfigured(firebaseConfig)) {
            console.warn("Firebase is not configured. Authentication will be unavailable.");
            setLoading(false);
            return;
        }
        
        const auth = getClientAuth();
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const profile = await fetchUserById(firebaseUser.uid);
                setUser(profile);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [firebaseConfig]);

    const signInWithGoogle = async () => {
        if (!isFirebaseConfigured(firebaseConfig)) {
            toast({ title: "Offline Mode", description: "Google Sign-In is disabled.", variant: "destructive" });
            return;
        }
        
        setLoading(true);
        const auth = getClientAuth();
        const provider = new GoogleAuthProvider();

        try {
            const result = await signInWithPopup(auth, provider);
            const firebaseUser = result.user;
            
            let profile = await fetchUserById(firebaseUser.uid);

            if (profile) {
                setUser(profile);
                toast({ title: `Welcome back, ${profile.name}!`, description: 'Redirecting to your dashboard...' });
            } else {
                const db = getClientFirestore();
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
                    myReferralCode: `${name.split(' ')[0].toUpperCase()}${firebaseUser.uid.slice(-4)}`,
                    trainerPreference: 'Any',
                };
                
                await setDoc(userRef, newUserProfile);
                profile = { id: firebaseUser.uid, ...newUserProfile } as UserProfile;
                setUser(profile);
                toast({ title: "Welcome to Drivergy!", description: "Your account has been created." });
            }
            router.push('/dashboard');

        } catch (error: any) {
            if (error.code !== 'auth/popup-closed-by-user') {
                toast({ title: "Sign-In Failed", description: error.message || "An error occurred.", variant: "destructive" });
                console.error("Google Sign-in Error:", error);
            }
        } finally {
            setLoading(false);
        }
    };
    
    const signInWithCredentials = async (identifier: string, password: string): Promise<void> => {
        if (!isFirebaseConfigured(firebaseConfig)) {
            toast({ title: 'Error', description: 'Authentication is not configured.', variant: 'destructive' });
            return;
        }
        setLoading(true);
        const auth = getClientAuth();
        try {
            await signInWithEmailAndPassword(auth, identifier, password);
            toast({ title: "Login Successful!", description: "Redirecting to your dashboard..."});
            // The onAuthStateChanged listener will handle setting user and redirecting
        } catch (error) {
            setLoading(false);
            toast({
                title: 'Login Failed',
                description: 'Invalid credentials. Please check your email/username and password.',
                variant: 'destructive',
            });
        }
    };

    const signOut = async () => {
        if (!isFirebaseConfigured(firebaseConfig)) return;
        setLoading(true);
        const auth = getClientAuth();
        try {
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

    const value: AuthContextType = {
        user,
        loading,
        signInWithGoogle,
        signInWithCredentials,
        signOut,
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
