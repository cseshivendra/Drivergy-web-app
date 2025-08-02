
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile, RegistrationFormValues } from '@/types';
import { authenticateUserByCredentials, fetchUserById } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { auth, isFirebaseConfigured, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';


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
        if (!isFirebaseConfigured() || !auth) {
            console.warn("Firebase is not configured. Authentication will be unavailable.");
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const profile = await fetchUserById(firebaseUser.uid);
                if (profile) {
                    setUser(profile);
                } else {
                    // This can happen for a new Google Sign-In before the profile is created,
                    // or if a user exists in Firebase Auth but not Firestore.
                    // The signInWithGoogle flow will handle profile creation.
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
        if (!isFirebaseConfigured() || !auth || !db) {
            toast({ title: "Offline Mode", description: "Google Sign-In is disabled. Please check your Firebase configuration.", variant: "destructive" });
            return;
        }
        setLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const firebaseUser = result.user;

            const userRef = doc(db, "customers", firebaseUser.uid);
            const userSnap = await getDoc(userRef);

            let profileToSet: UserProfile;

            if (userSnap.exists()) {
                // Existing user
                profileToSet = { id: userSnap.id, ...userSnap.data() } as UserProfile;
                toast({ title: `Welcome back, ${profileToSet.name}!`, description: 'Redirecting to your dashboard...' });
            } else {
                // New user via Google Sign-In
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
        if (!isFirebaseConfigured() || !auth) {
            toast({ title: 'Error', description: 'Authentication is not configured.', variant: 'destructive' });
            return;
        }

        setLoading(true);

        try {
            // First, try signing in with Firebase Auth directly
            const userCredential = await signInWithEmailAndPassword(auth, identifier, password);
            // onAuthStateChanged will handle setting the user and redirecting.
            // We just need to wait for the state to update.
            toast({ title: "Login Successful!", description: "Redirecting to your dashboard..."});
            router.push('/dashboard');

        } catch (error) {
            // If Firebase Auth fails, try the mock data as a fallback.
            // This allows login for users created before the transition to Firebase Auth.
            console.log("Firebase Auth failed, trying mock data fallback...");
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
        }
    };

    const signOut = async () => {
        setLoading(true);
        try {
            if (isFirebaseConfigured() && auth?.currentUser) {
                await firebaseSignOut(auth);
            }
            // If not using Firebase or already signed out, just clear local state.
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

    // This function is for mock authentication fallback
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
