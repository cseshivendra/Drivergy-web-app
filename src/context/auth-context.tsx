
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, googleProvider } from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';

// Define a GuestUser type
export interface GuestUser {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
  isGuest: true;
}

interface AuthContextType {
  user: User | GuestUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | GuestUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Ref to hold the current user state for access within onAuthStateChanged
  const userStateRef = useRef(user);
  useEffect(() => {
    userStateRef.current = user;
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const currentAppUser = userStateRef.current;
      const isCurrentAppUserGuest = 
        currentAppUser && 
        typeof currentAppUser === 'object' && 
        'isGuest' in currentAppUser && 
        currentAppUser.isGuest;

      if (firebaseUser) {
        setUser(firebaseUser); // Firebase user takes precedence
      } else {
        // No Firebase user. If current user is NOT a guest, then they are logged out.
        // If current user IS a guest, onAuthStateChanged(null) should not log them out.
        if (!isCurrentAppUserGuest) {
          setUser(null);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []); // Empty dependency array is correct for onAuthStateChanged listener setup.

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // User state will be updated by onAuthStateChanged
    } catch (error) {
      console.error("Error signing in with Google:", error);
      setLoading(false); // Ensure loading is false on error
    }
    // setLoading(false) is handled by onAuthStateChanged
  };

  const signInAsGuest = () => {
    setLoading(true);
    const guestUser: GuestUser = {
      uid: `guest-${new Date().getTime()}`,
      displayName: 'Guest User',
      email: null,
      photoURL: null, 
      isGuest: true,
    };
    setUser(guestUser);
    setLoading(false);
    // LoginPage useEffect will handle redirect to '/'
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const isGuestUser = user && typeof user === 'object' && 'isGuest' in user && user.isGuest;

      if (isGuestUser) {
        setUser(null); // Clear guest user
        setLoading(false); // Manually set loading for guest
      } else if (user) { // If it's a Firebase user
        await firebaseSignOut(auth);
        // onAuthStateChanged will handle setUser(null) and setLoading(false)
      } else {
        // No user to sign out, perhaps already null
        setLoading(false);
      }
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
      // Ensure loading is false on error, especially if Firebase signout fails
      const isGuestUser = user && typeof user === 'object' && 'isGuest' in user && user.isGuest;
      if (!isGuestUser) {
          setLoading(false);
      }
    }
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
