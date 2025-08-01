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

// Initialize Firebase App
const app = isFirebaseConfigured() && !getApps().length
    ? initializeApp(firebaseConfig)
    : isFirebaseConfigured() ? getApp() : null;

// Conditionally initialize Firebase services
// This prevents them from being initialized on the server during the build process
let auth = null;
let db = null;

// Only initialize services if the app was successfully initialized
if (app) {
    // We check if we are in a browser environment before initializing
    if (typeof window !== 'undefined') {
        auth = getAuth(app);
        db = getFirestore(app);
    } else {
        // For server environments (like Server Actions), we can initialize.
        // The build process (a non-browser, non-interactive server env) will be skipped by the top-level `if (app)`
        auth = getAuth(app);
        db = getFirestore(app);
    }
}


export { app, auth, db };
