
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
import { verifyAdminCredentials } from '@/lib/server-actions';


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
                    // Check for hardcoded admin user session
                    if (sessionStorage.getItem('isAdmin') === 'true') {
                        setUser({
                            id: 'admin',
                            uniqueId: 'ADMIN-001',
                            name: 'Admin',
                            isAdmin: true,
                            contact: 'admin@drivergy.com',
                            location: 'HQ',
                            subscriptionPlan: 'Admin',
                            approvalStatus: 'Approved',
                            registrationTimestamp: new Date().toISOString(),
                            gender: 'Any'
                        });
                    } else {
                        const profile = await fetchUserById(firebaseUser.uid);
                        setUser(profile);
                    }
                } else {
                    setUser(null);
                    sessionStorage.removeItem('isAdmin');
                }
                setLoading(false);
            });
            return () => unsubscribe();
        } catch (error) {
            console.error("Firebase initialization failed in AuthContext:", error);
            toast({
                title: "Configuration Error",
                description: "Could not connect to services. This usually means your environment variables are not set correctly. See the README for instructions on setting up Firebase credentials.",
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
                    location: 'TBD', // To be determined
                    subscriptionPlan: "None",
                    registrationTimestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    approvalStatus: 'Pending',
                    photoURL: firebaseUser.photoURL || `https://placehold.co/100x100.png?text=${name.charAt(0)}`,
                    myReferralCode: `${name.split(' ')[0].toUpperCase()}${firebaseUser.uid.slice(-4)}`,
                    trainerPreference: 'Any',
                    // Set default values for all dashboard-related fields
                    totalLessons: 0,
                    completedLessons: 0,
                    upcomingLesson: '',
                    feedbackSubmitted: false,
                    totalReferralPoints: 0,
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
        setLoading(true);

        // Step 1: Check if the identifier is 'admin'.
        if (identifier.toLowerCase() === 'admin') {
            const adminCheck = await verifyAdminCredentials({ username: identifier, password });

            if (adminCheck.isAdmin) {
                const adminUser: UserProfile = {
                    id: 'admin',
                    uniqueId: 'ADMIN-001',
                    name: 'Admin',
                    isAdmin: true,
                    contact: 'admin@drivergy.com',
                    location: 'HQ',
                    subscriptionPlan: 'Admin',
                    approvalStatus: 'Approved',
                    registrationTimestamp: new Date().toISOString(),
                    gender: 'Any'
                };
                sessionStorage.setItem('isAdmin', 'true');
                setUser(adminUser);
                toast({ title: 'Admin Login Successful!', description: 'Redirecting to your dashboard...' });
                router.push('/dashboard');
                setLoading(false);
                return;
            } else {
                toast({ title: 'Login Failed', description: adminCheck.error || 'Invalid admin credentials.', variant: 'destructive' });
                setLoading(false);
                return;
            }
        }

        // Step 2: If not admin, proceed with standard Firebase email/password auth
        if (!auth) {
            setLoading(false);
            return;
        };

        try {
            // Here, identifier must be an email for Firebase to work
            await signInWithEmailAndPassword(auth, identifier, password);
            toast({ title: 'Login Successful!', description: 'Redirecting to your dashboard...' });
            router.push('/dashboard');
        } catch (error: any) {
            let description = 'An unexpected error occurred. Please try again.';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                description = 'Invalid credentials. Please check your email and password.';
            } else if (error.code === 'permission-denied') {
                description = 'Database access was denied. This is likely a cloud configuration issue. Please see the README file for instructions on fixing "Permission Denied" errors by granting the "Service Usage Consumer" role to your service account.'
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
        // Clear admin session flag
        sessionStorage.removeItem('isAdmin');

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
