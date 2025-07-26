'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut, signInWithEmailAndPassword } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/types';
import { getOrCreateUser } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';

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
  
  const signInWithCredentials = async (email: string, password: string): Promise<void> => {
    if (!auth) {
      toast({ title: "Configuration Error", description: "Firebase is not configured.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will fetch the profile and set the user state.
      // We just need to show a success message and let the effect handle the redirect.
      if (userCredential.user) {
        toast({
            title: `Welcome back!`,
            description: 'You are now logged in.',
        });
        router.push('/');
      }
    } catch (error: any) {
        console.error("Credential Sign-In Error:", error);
        let description = 'An unexpected error occurred.';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            description = 'Invalid email or password. Please try again.';
        } else if (error.code === 'auth/invalid-email') {
            description = 'Please enter a valid email address.';
        }
        toast({
            title: 'Login Failed',
            description,
            variant: 'destructive',
        });
        setLoading(false); // Make sure to stop loading on failure
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
  
  // This function is now mostly for cases where user data is updated elsewhere
  // and we need to refresh the context state without a full login cycle.
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