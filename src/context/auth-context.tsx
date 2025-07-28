
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/types';
import { authenticateUserByCredentials, fetchUserById } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithCredentials: (email: string, password: string) => Promise<void>;
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
    // In mock mode, we check session storage for a logged-in user.
    const storedUserId = sessionStorage.getItem('mockUserId');
    if (storedUserId) {
      fetchUserById(storedUserId).then(userProfile => {
        if (userProfile) {
          setUser(userProfile);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);
  
  const signInWithGoogle = async () => {
    toast({ title: "Offline Mode", description: "Google Sign-In is disabled in offline mode. Please use mock credentials.", variant: "destructive" });
  };
  
  const signInWithCredentials = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    const userProfile = authenticateUserByCredentials(email, password);
    if (userProfile) {
        logInUser(userProfile, true);
    } else {
        setLoading(false);
        toast({
            title: 'Login Failed',
            description: 'Invalid email or password.',
            variant: 'destructive',
        });
    }
  };

  const signUpWithCredentials = async (email: string, password: string, additionalData: Partial<UserProfile>) => {
    toast({ title: "Offline Mode", description: "This is a mock sign-up. The user will not be persisted.", variant: "destructive" });
    // This would typically interact with a mock user creation function, but for now we'll just log it.
    console.log("Mock sign up with:", email, additionalData);
    router.push('/login');
  };

  const signOut = async () => {
    setLoading(true);
    setUser(null); 
    sessionStorage.removeItem('mockUserId');
    setLoading(false);
    toast({
      title: 'Logged Out',
      description: 'You have been successfully signed out.',
    });
    router.push('/site');
  };
  
  const logInUser = (userProfile: UserProfile, isDirectLogin: boolean = false) => {
    setUser(userProfile);
    sessionStorage.setItem('mockUserId', userProfile.id);
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
