
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, getAuth, type Auth } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile, RegistrationFormValues } from '@/types';
import { fetchUserById } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { isFirebaseConfigured, initializeFirebaseApp } from '@/lib/firebase';
import { doc, getDoc, setDoc, getFirestore } from 'firebase/firestore';
import type { FirebaseOptions } from 'firebase/app';


interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithCredentials: (identifier: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// The provider now accepts the config
export const AuthProvider = ({ children, firebaseConfig }: { children: ReactNode, firebaseConfig: FirebaseOptions }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();
    
    // State to hold the initialized auth and db instances
    const [firebaseAuth, setFirebaseAuth] = useState<Auth | null>(null);

    useEffect(() => {
        if (isFirebaseConfigured(firebaseConfig)) {
            const { auth, db } = initializeFirebaseApp(firebaseConfig);
            setFirebaseAuth(auth);
            
            const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                if (firebaseUser) {
                    const profile = await fetchUserById(firebaseUser.uid);
                    if (profile) {
                        setUser(profile);
                    } else {
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
                setLoading(false);
            });

            return () => unsubscribe();
        } else {
            console.warn("Firebase is not configured. Authentication will be unavailable.");
            setLoading(false);
        }
    }, [firebaseConfig]);

    const signInWithGoogle = async () => {
        if (!firebaseAuth) {
            toast({ title: "Offline Mode", description: "Google Sign-In is disabled. Please check your Firebase configuration.", variant: "destructive" });
            return;
        }
        setLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(firebaseAuth, provider);
            const firebaseUser = result.user;

            // Re-initialize db here to ensure it's available
            const { db } = initializeFirebaseApp(firebaseConfig);
            const userRef = doc(db, "customers", firebaseUser.uid);
            const userSnap = await getDoc(userRef);

            let profileToSet: UserProfile;

            if (userSnap.exists()) {
                profileToSet = { id: userSnap.id, ...userSnap.data() } as UserProfile;
                toast({ title: `Welcome back, ${profileToSet.name}!`, description: 'Redirecting to your dashboard...' });
            } else {
                const name = firebaseUser.displayName || 'New User';
                const email = firebaseUser.email;

                if (!email) {
                    throw new Error("Could not retrieve email from Google. Please try registering with email and password.");
                }

                const newUser: Omit<UserProfile, 'id'> = {
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

                await setDoc(userRef, newUser);
                profileToSet = { id: firebaseUser.uid, ...newUser };
                toast({ title: "Welcome to Drivergy!", description: "Your account has been created successfully." });
            }

            setUser(profileToSet);
            router.push('/dashboard');

        } catch (error: any) {
            if (error.code !== 'auth/popup-closed-by-user') {
                toast({ title: "Sign-In Failed", description: error.message || "An error occurred during Google sign-in.", variant: "destructive" });
                console.error("Google Sign-in Error:", error);
            }
        } finally {
            setLoading(false);
        }
    };

    const signInWithCredentials = async (identifier: string, password: string): Promise<void> => {
        if (!firebaseAuth) {
            toast({ title: 'Error', description: 'Authentication is not configured.', variant: 'destructive' });
            return;
        }
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(firebaseAuth, identifier, password);
            toast({ title: "Login Successful!", description: "Redirecting to your dashboard..."});
            router.push('/dashboard');
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
        if (!firebaseAuth) return;
        setLoading(true);
        try {
            await firebaseSignOut(firebaseAuth);
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
