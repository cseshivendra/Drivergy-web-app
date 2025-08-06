
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { allUsers, fetchUserById } from '@/lib/mock-data';

// Mock users for demonstration
const mockCustomer: UserProfile = {
    id: 'mock-customer-1',
    uniqueId: 'CU-MOCK01',
    name: 'Priya Sharma',
    username: 'priya',
    contact: 'customer@drivergy.com',
    password: 'password',
    phone: '1234567890',
    gender: 'Female',
    location: 'Gurugram',
    subscriptionPlan: 'Premium',
    registrationTimestamp: 'Jul 20, 2024',
    approvalStatus: 'Approved',
    photoURL: 'https://placehold.co/100x100.png?text=P',
    myReferralCode: 'PRIYA1234',
    trainerPreference: 'Any',
    assignedTrainerId: 'mock-trainer-1',
    assignedTrainerName: 'Rajesh Kumar',
    upcomingLesson: 'Aug 01, 2024, 9:00 AM',
    subscriptionStartDate: 'Jul 22, 2024',
    totalLessons: 20,
    completedLessons: 5,
    feedbackSubmitted: false,
    totalReferralPoints: 100,
};

const mockTrainer: UserProfile = {
    id: 'mock-trainer-1',
    uniqueId: 'TR-MOCK01',
    name: 'Rajesh Kumar',
    username: 'rajesh',
    contact: 'trainer@drivergy.com',
    password: 'password',
    phone: '9876543210',
    gender: 'Male',
    location: 'Gurugram',
    subscriptionPlan: 'Trainer',
    registrationTimestamp: 'Jul 15, 2024',
    approvalStatus: 'Approved',
    photoURL: `https://placehold.co/100x100.png?text=R`,
    myReferralCode: `RAJESH5678`,
    vehicleInfo: 'Car (Manual)',
    specialization: 'Car',
    yearsOfExperience: 5,
};

const mockAdmin: UserProfile = {
    id: 'admin',
    uniqueId: 'ADMIN-001',
    name: 'Admin',
    username: 'admin',
    isAdmin: true,
    contact: 'admin@drivergy.com',
    password: 'admin',
    location: 'HQ',
    subscriptionPlan: 'Admin',
    approvalStatus: 'Approved',
    registrationTimestamp: new Date().toISOString(),
    gender: 'Any'
};

// Add the initial mock users to the main list if they don't already exist.
if (!allUsers.find(u => u.id === 'mock-customer-1')) {
    allUsers.push(mockCustomer);
}
if (!allUsers.find(u => u.id === 'mock-trainer-1')) {
    allUsers.push(mockTrainer);
}
if (!allUsers.find(u => u.id === 'admin')) {
    allUsers.push(mockAdmin);
}


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
        // Check session storage to see if a user was previously "logged in"
        const storedUser = sessionStorage.getItem('mockUser');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const signInWithGoogle = async () => {
        setLoading(true);
        toast({ title: "Simulating Google Sign-In...", description: "Logging in as the sample customer." });
        setTimeout(() => {
            sessionStorage.setItem('mockUser', JSON.stringify(mockCustomer));
            setUser(mockCustomer);
            setLoading(false);
            router.push('/dashboard');
        }, 1000);
    };

    const signInWithCredentials = async (identifier: string, password: string): Promise<void> => {
        setLoading(true);
        
        // Find user by email or username in our mock database
        const userToLogin = allUsers.find(u => 
            (u.contact.toLowerCase() === identifier.toLowerCase() || (u.username && u.username.toLowerCase() === identifier.toLowerCase())) &&
            u.password === password
        );

        setTimeout(() => {
            if (userToLogin) {
                sessionStorage.setItem('mockUser', JSON.stringify(userToLogin));
                setUser(userToLogin);
                toast({ title: 'Login Successful!', description: 'Redirecting to your dashboard...' });
                router.push('/dashboard');
            } else {
                toast({ 
                    title: 'Login Failed', 
                    description: 'Invalid credentials. Please try again or register.', 
                    variant: 'destructive' 
                });
            }
            setLoading(false);
        }, 1000);
    };

    const signOut = async () => {
        setLoading(true);
        sessionStorage.removeItem('mockUser');
        setUser(null);
        toast({ title: 'Logged Out', description: 'You have been successfully signed out.' });
        setLoading(false);
        router.push('/');
    };
    
    const logInUser = (user: UserProfile, redirect = true) => {
        setUser(user);
        sessionStorage.setItem('mockUser', JSON.stringify(user));
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
