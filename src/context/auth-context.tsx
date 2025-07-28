'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/types';
import { authenticateUserByCredentials, fetchUserById } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { format } from 'date-fns';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithCredentials: (identifier: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  logInUser: (userProfile: UserProfile, isDirectLogin?: boolean) => void;
  signUpWithCredentials: (email: string, password: string, additionalData: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isFirebaseConfigured() || !auth) {
        // Fallback to mock data if Firebase isn't configured
        const storedUserId = sessionStorage.getItem('mockUserId');
        if (storedUserId) {
          fetchUserById(storedUserId).then(userProfile => {
            if (userProfile) setUser(userProfile);
            setLoading(false);
          });
        } else {
            setLoading(false);
        }
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const profile = await fetchUserById(firebaseUser.uid);
            if (profile) {
                setUser(profile);
            }
        } else {
            setUser(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);
  
  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured() || !auth) {
        toast({ title: "Offline Mode", description: "Google Sign-In is disabled in offline mode. Please use mock credentials.", variant: "destructive" });
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
        if (error.code !== 'auth/popup-closed-by-user') {
            toast({ title: "Sign-In Failed", description: "An error occurred during Google sign-in.", variant: "destructive" });
        }
        setLoading(false);
    }
  };
  
  const signInWithCredentials = async (identifier: string, password: string): Promise<void> => {
    setLoading(true);
    const userProfile = await authenticateUserByCredentials(identifier, password);
    if (userProfile) {
        // In a real Firebase Auth scenario, you'd use signInWithEmailAndPassword
        // For now, we are just setting the user state based on Firestore lookup.
        logInUser(userProfile, true);
    } else {
        setLoading(false);
        toast({
            title: 'Login Failed',
            description: 'Invalid credentials. Please check your email/username and password.',
            variant: 'destructive',
        });
    }
  };

  const signUpWithCredentials = async (email: string, password: string, additionalData: Partial<UserProfile>) => {
    toast({ title: "Live Mode", description: "This will create a real user account.", variant: "default" });
     if (!isFirebaseConfigured() || !auth) {
        toast({ title: "Configuration Error", description: "Firebase is not configured.", variant: "destructive" });
        return;
    }
    // In a real app, you would use createUserWithEmailAndPassword from Firebase Auth.
    // The current implementation in server-actions handles user creation in Firestore.
    console.log("Sign up attempt with:", email, additionalData);
    router.push('/login');
  };

  const signOut = async () => {
    setLoading(true);
    if (isFirebaseConfigured() && auth?.currentUser) {
        await firebaseSignOut(auth);
    }
    setUser(null); 
    sessionStorage.removeItem('mockUserId'); // Clear mock session
    setLoading(false);
    toast({
      title: 'Logged Out',
      description: 'You have been successfully signed out.',
    });
    router.push('/site');
  };
  
  const logInUser = (userProfile: UserProfile, isDirectLogin: boolean = false) => {
    setUser(userProfile);
    if (!isFirebaseConfigured()) {
        sessionStorage.setItem('mockUserId', userProfile.id);
    }
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
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, logInUser, signInWithCredentials, signUpWithCredentials }}>
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
