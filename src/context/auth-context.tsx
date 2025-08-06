
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { allUsers, fetchUserById } from '@/lib/mock-data';

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
        const mockCustomer = allUsers.find(u => u.id === 'mock-customer-1');
        setTimeout(() => {
            if (mockCustomer) {
                logInUser(mockCustomer);
            }
            setLoading(false);
        }, 1000);
    };

    const signInWithCredentials = async (identifier: string, password: string): Promise<void> => {
        setLoading(true);
        
        const userToLogin = allUsers.find(u => 
            (u.contact.toLowerCase() === identifier.toLowerCase() || (u.username && u.username.toLowerCase() === identifier.toLowerCase())) &&
            u.password === password
        );

        setTimeout(() => {
            if (userToLogin) {
                logInUser(userToLogin);
                toast({ title: 'Login Successful!', description: 'Redirecting to your dashboard...' });
            } else {
                toast({ 
                    title: 'Login Failed', 
                    description: 'Invalid credentials. Please try again or register a new account.', 
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
    
    const logInUser = (userToLog: UserProfile, redirect = true) => {
        setUser(userToLog);
        sessionStorage.setItem('mockUser', JSON.stringify(userToLog));
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
