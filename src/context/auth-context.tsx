
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithCredentials: (identifier: string, password: string) => Promise<void>;
    signInWithPhone: (phoneNumber: string, appVerifier: RecaptchaVerifier) => Promise<ConfirmationResult | null>;
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
                    // This case can happen with phone auth where user doesn't have a profile yet
                    // Or you might want to create a profile here for new sign-ups
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
                    // Use serverTimestamp() for Firestore to handle date creation server-side
                    registrationTimestamp: serverTimestamp(),
                };
                await setDoc(userDocRef, newUserProfile);
                
                // For client-side state, create a serializable user object immediately
                const clientProfile: UserProfile = {
                  ...newUserProfile,
                  id: firebaseUser.uid,
                  registrationTimestamp: new Date().toISOString(), // Use client date for immediate state update
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
        let emailToSignIn = identifier;

        try {
            // Step 1: Check if the identifier is a username.
            if (!identifier.includes('@')) {
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('username', '==', identifier), limit(1));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    // Username found, get the corresponding email
                    emailToSignIn = querySnapshot.docs[0].data().contact;
                } else {
                    // If not a username, we'll proceed assuming it's an email.
                    // Firebase will throw an error if it's not a valid email format or user.
                }
            }

            // Step 2: Attempt to sign in with the resolved email.
            await signInWithEmailAndPassword(auth, emailToSignIn, password);
            toast({ title: 'Login Successful!', description: 'Redirecting to your dashboard...' });
            router.push('/dashboard');

        } catch (error: any) {
            console.error("Login error:", error.code); // Log error code for debugging
            toast({ 
                title: 'Login Failed', 
                description: 'Invalid credentials or user not found.', 
                variant: 'destructive' 
            });
        } finally {
            setLoading(false);
        }
    };
    
    const signInWithPhone = async (phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult | null> => {
        setLoading(true);
        try {
            const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            return confirmationResult;
        } catch (error: any) {
            console.error("Phone sign-in error:", error);
            toast({ title: 'Phone Sign-In Failed', description: "Could not send OTP. Please check the phone number or try again later.", variant: 'destructive' });
            return null;
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
    
    // This function is useful for manual state updates after server actions
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
        signInWithPhone,
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
