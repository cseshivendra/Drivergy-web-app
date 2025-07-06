
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/types';
import { authenticateUserByCredentials, fetchUserById } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';

// Define a User type that can be a simulated regular user or a GuestUser
export interface SimulatedUser {
  uid: string;
  uniqueId: string; // Add uniqueId to identify role
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isGuest?: false; // Explicitly not a guest
}

export interface GuestUser {
  uid: string;
  uniqueId: string; // Add uniqueId to identify role
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isGuest: true;
}

type AppUser = SimulatedUser | GuestUser;

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithCredentials: (username: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  logInUser: (userProfile: UserProfile, isDirectLogin?: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true); // Start true to mimic initial auth check
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Simulate checking for a stored session (e.g., in localStorage)
    const storedUser = sessionStorage.getItem('mockUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const storeUserInSession = (userToStore: AppUser | null) => {
    if (userToStore) {
      sessionStorage.setItem('mockUser', JSON.stringify(userToStore));
    } else {
      sessionStorage.removeItem('mockUser');
    }
  };

  const handleSuccessfulSignIn = (newUser: AppUser) => {
    setUser(newUser);
    storeUserInSession(newUser);
    setLoading(false);
    toast({
      title: `Welcome to Drivergy, ${newUser.displayName}!`,
      description: 'You are now logged in.',
    });
    router.push('/site');
  };

  const signInWithGoogle = async () => {
    if (!auth || !db) {
      toast({
        title: "Configuration Error",
        description: "Firebase is not configured. Cannot sign in with Google.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      const userDocRef = doc(db, 'users', googleUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      let userProfile: UserProfile;

      if (userDocSnap.exists()) {
        userProfile = { id: userDocSnap.id, ...userDocSnap.data() } as UserProfile;
      } else {
        const newUserProfileData: Omit<UserProfile, 'id'> = {
          uniqueId: `ADMIN-${googleUser.uid.slice(0, 6).toUpperCase()}`,
          name: googleUser.displayName || 'Google User',
          contact: googleUser.email!,
          location: 'N/A',
          subscriptionPlan: 'Admin',
          registrationTimestamp: new Date().toISOString(),
          approvalStatus: 'Approved',
          gender: 'Other',
          photoURL: googleUser.photoURL || `https://placehold.co/100x100.png?text=${googleUser.displayName?.charAt(0) || 'G'}`,
        };
        await setDoc(userDocRef, newUserProfileData);
        userProfile = { id: googleUser.uid, ...newUserProfileData };
      }

      logInUser(userProfile, true);

    } catch (error) {
      console.error("Google Sign-In Error:", error);
      toast({
        title: "Sign-In Failed",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const signInWithCredentials = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    const userProfile = await authenticateUserByCredentials(username, password);
    if (userProfile) {
      logInUser(userProfile, true); // true to redirect
      return true;
    }
    setLoading(false);
    toast({
      title: 'Login Failed',
      description: 'Invalid username or password.',
      variant: 'destructive',
    });
    return false;
  };

  const signOut = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    setUser(null);
    storeUserInSession(null);
    setLoading(false);
    toast({
      title: 'Logged Out',
      description: 'You have been successfully signed out.',
    });
    router.push('/site');
  };

  const logInUser = (userProfile: UserProfile, isDirectLogin: boolean = false) => {
    setLoading(true);
    const newUser: SimulatedUser = {
      uid: userProfile.id,
      uniqueId: userProfile.uniqueId,
      displayName: userProfile.name,
      email: userProfile.contact,
      photoURL: userProfile.photoURL || `https://placehold.co/100x100.png?text=${userProfile.name.charAt(0)}`,
      isGuest: false,
    };
    setUser(newUser);
    storeUserInSession(newUser);
    setLoading(false);

    if (isDirectLogin) {
      toast({
        title: `Welcome to Drivergy, ${newUser.displayName}!`,
        description: 'You are now logged in.',
      });
      router.push('/site');
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
