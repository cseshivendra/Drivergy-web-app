
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut, signInWithEmailAndPassword } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/types';
import { fetchUserById } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { initializeFirebaseApp } from '@/lib/firebase/client';
import { doc, setDoc } from 'firebase/firestore';
import type { FirebaseOptions } from 'firebase/app';


interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithCredentials: (identifier: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    logInUser: (user: UserProfile, redirect?: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const sampleAdmin: UserProfile = {
  id: 'admin-001',
  uniqueId: 'AD-ADMIN1',
  name: 'Admin User',
  username: 'admin',
  isAdmin: true,
  contact: 'admin@drivergy.com',
  phone: '1234567890',
  location: 'Gurugram',
  subscriptionPlan: 'Admin',
  registrationTimestamp: 'Jan 01, 2024',
  approvalStatus: 'Approved',
  gender: 'Prefer not to say',
  photoURL: 'https://placehold.co/100x100/4f46e5/ffffff.png'
};

const sampleTrainer: UserProfile = {
  id: 'trainer-001',
  uniqueId: 'TR-TRAINER1',
  name: 'Sample Trainer',
  username: 'trainer',
  contact: 'trainer@drivergy.com',
  phone: '1234567890',
  location: 'Gurugram',
  subscriptionPlan: 'Trainer',
  registrationTimestamp: 'Jan 01, 2024',
  approvalStatus: 'Approved',
  gender: 'Male',
  photoURL: 'https://placehold.co/100x100/facc15/44403c.png',
  specialization: 'Car',
  yearsOfExperience: 5
};

const sampleCustomer: UserProfile = {
  id: 'customer-001',
  uniqueId: 'CU-CUSTOMER1',
  name: 'Sample Customer',
  username: 'customer',
  contact: 'customer@drivergy.com',
  phone: '1234567890',
  location: 'Noida',
  subscriptionPlan: 'Premium',
  registrationTimestamp: 'Jan 01, 2024',
  approvalStatus: 'Approved',
  gender: 'Female',
  photoURL: 'https://placehold.co/100x100/60a5fa/ffffff.png',
  assignedTrainerId: 'trainer-001',
  assignedTrainerName: 'Sample Trainer',
  upcomingLesson: 'Jul 28, 2024, 10:00 AM',
  totalLessons: 20,
  completedLessons: 5,
  feedbackSubmitted: false,
  subscriptionStartDate: 'Jul 20, 2024',
  flatHouseNumber: 'A-123',
  street: 'Main Road',
  district: 'Noida',
  state: 'Uttar Pradesh',
  pincode: '201301',
  dlStatus: 'New Learner'
};

const sampleUsers = [
    { username: 'admin', password: 'Admin@1234', profile: sampleAdmin },
    { username: 'trainer', password: 'Trainer@1234', profile: sampleTrainer },
    { username: 'customer', password: 'Customer@1234', profile: sampleCustomer },
];

export const AuthProvider = ({ children, firebaseConfig }: { children: ReactNode, firebaseConfig: FirebaseOptions }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();
    
    useEffect(() => {
        try {
            const { auth } = initializeFirebaseApp(firebaseConfig);
            const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                const isSampleUser = user && sampleUsers.some(su => su.profile.id === user.id);

                if (firebaseUser) {
                    const profile = await fetchUserById(firebaseUser.uid);
                    setUser(profile);
                } else if (!isSampleUser) { // Only set user to null if it's NOT a sample user
                    setUser(null);
                }
                setLoading(false);
            });
            return () => unsubscribe();
        } catch (error) {
            console.warn("Firebase initialization failed in AuthContext:", error);
            setLoading(false);
            return;
        }
    }, [firebaseConfig, user]);

    const signInWithGoogle = async () => {
        try {
            const { auth, db } = initializeFirebaseApp(firebaseConfig);
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
        setLoading(true);

        const matchedUser = sampleUsers.find(
            (u) => u.username === identifier && u.password === password
        );

        if (matchedUser) {
            setUser(matchedUser.profile);
            toast({ title: 'Login Successful!', description: 'Redirecting to your dashboard...' });
            router.push('/dashboard');
            setLoading(false);
            return;
        }

        try {
            const { auth } = initializeFirebaseApp(firebaseConfig);
            await signInWithEmailAndPassword(auth, identifier, password);
            // onAuthStateChanged will handle setting the user and redirecting
            toast({ title: 'Login Successful!', description: 'Redirecting to your dashboard...' });
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
        // Check if the current user is a sample user
        const isSampleUser = user && sampleUsers.some(su => su.profile.id === user.id);

        if (isSampleUser) {
            setUser(null);
            toast({
                title: 'Logged Out',
                description: 'You have been successfully signed out.',
            });
            router.push('/');
        } else {
            try {
                const { auth } = initializeFirebaseApp(firebaseConfig);
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
