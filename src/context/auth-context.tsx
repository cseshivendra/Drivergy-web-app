
'use client';

import type { User as FirebaseUser } from 'firebase/auth'; // Keep for type compatibility if needed elsewhere, but not functionally used for Firebase auth
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Define a User type that can be a simulated regular user or a GuestUser
export interface SimulatedUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isGuest?: false; // Explicitly not a guest
}

export interface GuestUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isGuest: true;
}

type AppUser = SimulatedUser | GuestUser;

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>; // Kept for UI consistency, mocks Google sign-in
  signInAsGuest: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true); // Start true to mimic initial auth check
  const router = useRouter();

  useEffect(() => {
    // Simulate checking for a stored session (e.g., in localStorage)
    // For this mock, we'll just assume no user is logged in initially.
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

  const signInWithGoogle = async () => {
    setLoading(true);
    // Simulate Google sign-in
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    const mockGoogleUser: SimulatedUser = {
      uid: `mock-google-${new Date().getTime()}`,
      displayName: 'Mock Google User',
      email: 'googleuser@example.com',
      photoURL: 'https://placehold.co/100x100.png?text=GU', // Placeholder avatar
      isGuest: false,
    };
    setUser(mockGoogleUser);
    storeUserInSession(mockGoogleUser);
    setLoading(false);
    router.push('/');
  };

  const signInAsGuest = () => {
    setLoading(true);
    const guestUser: GuestUser = {
      uid: `guest-${new Date().getTime()}`,
      displayName: 'Guest User',
      email: null,
      photoURL: 'https://placehold.co/100x100.png?text=GU', // Placeholder for guest
      isGuest: true,
    };
    setUser(guestUser);
    storeUserInSession(guestUser);
    setLoading(false);
    router.push('/');
  };

  const signOut = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate sign-out delay
    setUser(null);
    storeUserInSession(null);
    setLoading(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInAsGuest, signOut }}>
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
