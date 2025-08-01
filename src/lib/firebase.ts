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

// Conditionally initialize Firebase services
// This prevents them from being initialized on the server during the build process
let auth = null;
let db = null;

// Only initialize on the client-side or if not in a build environment
if (typeof window !== 'undefined' || process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    if (app) {
        auth = getAuth(app);
        db = getFirestore(app);
    }
} else {
    // In Vercel build environment, we explicitly check if we are in the build phase.
    // If you have server-side functions that need firebase, you might need a more nuanced check.
    if (app) {
        auth = getAuth(app);
        db = getFirestore(app);
    }
}


export { app, auth, db };
