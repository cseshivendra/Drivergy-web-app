import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Function to check if the Firebase config is validly populated
export const isFirebaseConfigured = () => {
    return !!firebaseConfig.apiKey && !!firebaseConfig.projectId;
}

// Initialize Firebase
const app = isFirebaseConfigured() 
    ? getApps().length 
        ? getApp() 
        : initializeApp(firebaseConfig) 
    : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export { app };
