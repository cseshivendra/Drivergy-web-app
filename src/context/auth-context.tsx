
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { getLoginUser } from '@/lib/server-actions';

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithCredentials: (identifier: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    logInUser: (user: UserProfile, redirect?: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // User is signed in, fetch their profile from Firestore
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    // Firestore timestamps need to be converted to serializable format (ISO string)
                    if (userData.registrationTimestamp && typeof userData.registrationTimestamp.toDate === 'function') {
                        userData.registrationTimestamp = userData.registrationTimestamp.toDate().toISOString();
                    }
                    setUser({ id: userDoc.id, ...userData } as UserProfile);
                } else {
                    setUser(null);
                }
            } else {
                // User is signed out
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        setLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const firebaseUser = result.user;
            
            // Check if user exists in Firestore
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                // New user, create a profile in Firestore
                const newUserProfile: Omit<UserProfile, 'id' | 'registrationTimestamp'> & { registrationTimestamp: any } = {
                    uniqueId: `CU-${Date.now().toString().slice(-6)}`,
                    name: firebaseUser.displayName || 'Google User',
                    username: firebaseUser.displayName?.split(' ')[0].toLowerCase() || `user${Date.now().toString().slice(-4)}`,
                    contact: firebaseUser.email!,
                    phone: firebaseUser.phoneNumber || '',
                    photoURL: firebaseUser.photoURL || '',
                    subscriptionPlan: 'None',
                    approvalStatus: 'Pending',
                    gender: 'Prefer not to say', // Default value
                    registrationTimestamp: serverTimestamp(),
                };
                await setDoc(userDocRef, newUserProfile);
                
                const clientProfile: UserProfile = {
                  ...newUserProfile,
                  id: firebaseUser.uid,
                  registrationTimestamp: new Date().toISOString(),
                };

                setUser(clientProfile);
                toast({ title: 'Welcome!', description: 'Your account has been created.' });
                router.push('/#subscriptions');
            } else {
                 // Existing user
                const userProfileData = userDoc.data();
                 if (userProfileData.registrationTimestamp && typeof userProfileData.registrationTimestamp.toDate === 'function') {
                    userProfileData.registrationTimestamp = userProfileData.registrationTimestamp.toDate().toISOString();
                }
                const userProfile = { id: userDoc.id, ...userProfileData } as UserProfile;
                setUser(userProfile);
                toast({ title: 'Welcome Back!', description: 'Successfully signed in.' });
                router.push('/dashboard');
            }
        } catch (error: any) {
            toast({ title: 'Google Sign-In Failed', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const signInWithCredentials = async (identifier: string, password: string): Promise<void> => {
        setLoading(true);
        try {
            const userProfile = await getLoginUser(identifier);

            if (!userProfile) {
                throw new Error("Invalid credentials or user not found.");
            }

            // Use the email from the fetched profile to sign in
            await signInWithEmailAndPassword(auth, userProfile.contact, password);
            
            // onAuthStateChanged will handle setting the user state.
            toast({ title: 'Login Successful!', description: 'Redirecting to your dashboard...' });
            router.push('/dashboard');

        } catch (error: any) {
            console.error("Login error:", error);
            toast({ 
                title: 'Login Failed', 
                description: 'Invalid credentials or user not found.', 
                variant: 'destructive' 
            });
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        setLoading(true);
        await firebaseSignOut(auth);
        setUser(null);
        toast({ title: 'Logged Out', description: 'You have been successfully signed out.' });
        setLoading(false);
        router.push('/');
    };
    
    const logInUser = async (userToLog: UserProfile, redirect = true) => {
        setUser(userToLog);
        if (redirect) {
            router.push('/dashboard');
        }
    };

    const value: AuthContextType = {
        user,
        loading,
        signInWithGoogle,
        signInWithCredentials,
        signOut,
        logInUser
    };

    return (
        <AuthContext.Provider value={value}>
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
