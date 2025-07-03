
'use client';

import type { User as FirebaseUser } from 'firebase/auth'; // Keep for type compatibility if needed elsewhere, but not functionally used for Firebase auth
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/types'; // Import UserProfile
import { authenticateUserByCredentials, fetchUserById } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';

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
  signInAsGuest: () => void;
  signInAsSampleCustomer: () => Promise<void>;
  signInAsSampleTrainer: () => Promise<void>;
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
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    const mockGoogleUser: SimulatedUser = {
      uid: `mock-google-${new Date().getTime()}`,
      uniqueId: 'ADMIN-GOOGLE',
      displayName: 'Mock Google User',
      email: 'googleuser@example.com',
      photoURL: 'https://placehold.co/100x100.png?text=GU',
      isGuest: false,
    };
    handleSuccessfulSignIn(mockGoogleUser);
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

  const signInAsGuest = () => {
    setLoading(true);
    const guestUser: GuestUser = {
      uid: `guest-${new Date().getTime()}`,
      uniqueId: 'ADMIN-GUEST',
      displayName: 'Guest User',
      email: null,
      photoURL: 'https://placehold.co/100x100.png?text=GU',
      isGuest: true,
    };
    handleSuccessfulSignIn(guestUser);
  };

  const signInAsSampleCustomer = async () => {
    setLoading(true);
    // In a real DB setup, you'd fetch a user with a known email or ID.
    // For this demo, we'll try to log in with the sample user's credentials.
    const loggedIn = await signInWithCredentials('shivendra', 'password123');
    if (!loggedIn) {
        setLoading(false);
        toast({
            title: 'Login Error',
            description: 'Sample customer not found. Please register the sample customer first.',
            variant: 'destructive',
        });
    }
  };
  
  const signInAsSampleTrainer = async () => {
    setLoading(true);
    // In a real DB setup, you'd fetch a user with a known email or ID.
    const loggedIn = await signInWithCredentials('rajesh.trainer', 'password123');
    if (!loggedIn) {
        setLoading(false);
        toast({
            title: 'Login Error',
            description: 'Sample trainer not found. Please register the sample trainer first.',
            variant: 'destructive',
        });
    }
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
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInAsGuest, signOut, logInUser, signInAsSampleCustomer, signInAsSampleTrainer, signInWithCredentials }}>
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
