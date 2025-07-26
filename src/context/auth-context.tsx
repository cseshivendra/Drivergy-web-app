
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
  signInWithCredentials: (email: string, password: string) => Promise<boolean>;
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
        const profile = await getOrCreateUser(firebaseUser);
        if (profile) {
            setUser(profile);
        } else {
            setUser(null);
            toast({ title: "Login Error", description: "Could not create or fetch user profile.", variant: "destructive" });
            await firebaseSignOut(auth);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const signInWithGoogle = async () => {
    if (!auth) {
      toast({ title: "Configuration Error", description: "Firebase is not configured.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the rest
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      if (error.code !== 'auth/popup-closed-by-user') {
          toast({ title: "Sign-In Failed", description: "An error occurred during Google sign-in.", variant: "destructive" });
      }
      setLoading(false);
    }
  };
  
  const signInWithCredentials = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);

    // This is the direct, mocked admin login for the live site.
    if (username === 'admin' && password === 'admin') {
        const adminUser: UserProfile = {
            id: 'admin-user-id',
            uniqueId: 'AD-001',
            name: 'Admin User',
            username: 'admin',
            contact: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@drivergy.in',
            subscriptionPlan: 'Admin',
            approvalStatus: 'Approved',
            registrationTimestamp: format(new Date(), 'MMM dd, yyyy'),
            location: 'HQ',
            gender: 'Other',
            isAdmin: true,
        };
        logInUser(adminUser, true);
        return true;
    }
    
    // For all other users, authenticate against Firebase.
    const userProfile = await authenticateUserByCredentials(username, password);
    if (userProfile) {
      logInUser(userProfile, true); 
      return true;
    } else {
      setLoading(false);
      toast({
        title: 'Login Failed',
        description: 'Invalid username or password.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const signOut = async () => {
    setLoading(true);
    if (auth?.currentUser) {
        await firebaseSignOut(auth);
    }
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
