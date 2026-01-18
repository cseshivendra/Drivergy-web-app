
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
                // User is signed in. Check both 'users' and 'trainers' collections.
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const trainerDocRef = doc(db, 'trainers', firebaseUser.uid);
                
                const userDoc = await getDoc(userDocRef);
                let profileDoc;

                if (userDoc.exists()) {
                    profileDoc = userDoc;
                } else {
                    profileDoc = await getDoc(trainerDocRef);
                }

                if (profileDoc && profileDoc.exists()) {
                    const userData = profileDoc.data();
                    if (userData.registrationTimestamp && typeof userData.registrationTimestamp.toDate === 'function') {
                        userData.registrationTimestamp = userData.registrationTimestamp.toDate().toISOString();
                    }
                    setUser({ id: profileDoc.id, ...userData } as UserProfile);
                } else {
                    // This case might happen if a user exists in Auth but not in Firestore.
                    console.warn(`No Firestore profile found for auth user ${firebaseUser.uid}`);
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
            
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const trainerDocRef = doc(db, "trainers", firebaseUser.uid);
            
            const userDoc = await getDoc(userDocRef);
            const trainerDoc = await getDoc(trainerDocRef);

            if (!userDoc.exists() && !trainerDoc.exists()) {
                const newUserProfile: Omit<UserProfile, 'id' | 'registrationTimestamp'> & { registrationTimestamp: any } = {
                    uniqueId: `CU-${Date.now().toString().slice(-6)}`,
                    name: firebaseUser.displayName || 'Google User',
                    username: firebaseUser.displayName?.split(' ')[0].toLowerCase() || `user${Date.now().toString().slice(-4)}`,
                    contact: firebaseUser.email!,
                    phone: firebaseUser.phoneNumber || '',
                    photoURL: firebaseUser.photoURL || '',
                    subscriptionPlan: 'None',
                    approvalStatus: 'Pending',
                    gender: 'Prefer not to say',
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
            } else {
                const profileDoc = userDoc.exists() ? userDoc : trainerDoc;
                const userProfile = { id: profileDoc.id, ...profileDoc.data() } as UserProfile;
                setUser(userProfile);
                toast({ title: 'Welcome Back!', description: 'Successfully signed in.' });
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
            const result = await getLoginUser(identifier);

            if (!result.success || !result.user) {
                throw new Error(result.error || "Invalid credentials or user not found.");
            }

            await signInWithEmailAndPassword(auth, result.user.contact, password);
            
            // onAuthStateChanged will handle setting the user state.
            toast({ title: 'Login Successful!', description: 'You are now logged in.' });

        } catch (error: any) {
            console.error("Login error:", error);
            let description = 'An unexpected error occurred. Please try again.';
            if (error.code === 'auth/user-not-found' || error.message.includes("User not found")) {
                description = 'No account found with that email or username.';
            } else if (error.code === 'auth/wrong-password' || error.message.includes("Invalid password")) {
                description = 'The password you entered is incorrect.';
            } else if (error.message.includes("Invalid credentials")) {
                description = 'Invalid credentials or user not found.';
            }
            
            toast({ 
                title: 'Login Failed', 
                description, 
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
    
    const logInUser = (userToLog: UserProfile, redirect = true) => {
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
