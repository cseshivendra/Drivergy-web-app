
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/types';
import { authenticateUserByCredentials, getOrCreateUser } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { format } from 'date-fns';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithCredentials: (email: string, password: string) => Promise<void>;
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
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // If a Firebase user is detected, fetch or create their profile.
        const profile = await getOrCreateUser(firebaseUser);
        if (profile) {
            setUser(profile);
        } else {
            // This case handles errors during profile creation
            setUser(null);
            toast({ title: "Login Error", description: "Could not create or fetch user profile.", variant: "destructive" });
            await firebaseSignOut(auth);
        }
      } else if (sessionStorage.getItem('mockAdmin') !== 'true') {
        // If no Firebase user and not a mock admin, clear the user.
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]); 
  
  const signInWithGoogle = async () => {
    if (!auth) {
      toast({ title: "Configuration Error", description: "Firebase is not configured.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle setting the user and redirecting.
       toast({
        title: `Login Successful!`,
        description: 'Redirecting to your dashboard...',
      });
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      // Don't show toast for user-closed popup
      if (error.code !== 'auth/popup-closed-by-user') {
          toast({ title: "Sign-In Failed", description: "An error occurred during Google sign-in.", variant: "destructive" });
      }
      setLoading(false);
    }
  };
  
  const signInWithCredentials = async (username: string, password: string): Promise<void> => {
    setLoading(true);

    // Hardcoded admin check
    if (username === 'admin' && password === 'admin') {
        const adminUser: UserProfile = {
            id: 'admin-user-id',
            uniqueId: 'AD-001',
            name: 'Admin User',
            username: 'admin',
            contact: 'admin@drivergy.in',
            subscriptionPlan: 'Admin',
            approvalStatus: 'Approved',
            registrationTimestamp: format(new Date(), 'MMM dd, yyyy'),
            location: 'HQ',
            gender: 'Other',
            isAdmin: true,
        };
        // Use a session storage flag for the mock admin
        sessionStorage.setItem('mockAdmin', 'true');
        logInUser(adminUser, true);
        return;
    }

    const userProfile = await authenticateUserByCredentials(username, password);
    if (userProfile) {
      logInUser(userProfile, true); 
    } else {
      setLoading(false);
      toast({
        title: 'Login Failed',
        description: 'Invalid username or password.',
        variant: 'destructive',
      });
    }
  };

  const signOut = async () => {
    setLoading(true);
    if (auth?.currentUser) {
        await firebaseSignOut(auth);
    }
    // Clear the mock admin flag on any sign out
    sessionStorage.removeItem('mockAdmin');
    setUser(null); 
    setLoading(false);
    toast({
      title: 'Logged Out',
      description: 'You have been successfully signed out.',
    });
    router.push('/site');
  };
  
  const logInUser = (userProfile: UserProfile, isDirectLogin: boolean = false) => {
    setUser(userProfile);
    setLoading(false);

    if (isDirectLogin) {
      toast({
        title: `Welcome, ${userProfile.name}!`,
        description: 'You are now logged in.',
      });
      router.push('/');
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
