
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile, RegistrationFormValues } from '@/types';
import { authenticateUserByCredentials, fetchUserById, createNewUser } from '@/lib/mock-data';
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
                            // This case is handled by the signInWithGoogle flow for new users.
                            // For existing sessions, if no profile, treat as not fully logged in.
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
            setLoading(false);
        }
    };

    const signInWithCredentials = async (identifier: string, password: string): Promise<void> => {
        if (!auth) {
            toast({ title: 'Error', description: 'Authentication is not configured.', variant: 'destructive' });
            return;
        }
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, identifier, password);
            // onAuthStateChanged will handle setting the user and redirecting
        } catch (error: any) {
            // Fallback for non-firebase auth for now.
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
