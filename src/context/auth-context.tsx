
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { auth, googleProvider } from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import Loading from '@/app/loading';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // User state will be updated by onAuthStateChanged
      // router.push('/'); // Redirect is handled by AuthGuard or login page useEffect
    } catch (error) {
      console.error("Error signing in with Google:", error);
      // Handle error (e.g., show a toast notification)
    } finally {
      // setLoading(false); // Auth state change will set loading to false
      // Let onAuthStateChanged handle final loading state to ensure user is set
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      // setUser(null); // Handled by onAuthStateChanged
      router.push('/login'); // Redirect to login page after sign out
    } catch (error) {
      console.error("Error signing out:", error);
      // Handle error
    } finally {
      // setLoading(false); // Handled by onAuthStateChanged
    }
  };

  // The problematic conditional rendering that caused hydration mismatch is removed.
  // AuthGuard is responsible for showing Loading for protected routes during auth check.
  // LoginPage has its own loading/redirect logic.

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
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
