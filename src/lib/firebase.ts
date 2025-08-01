
import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const isFirebaseConfigured = () => {
  return !!firebaseConfig.apiKey && !!firebaseConfig.projectId;
};

// Initialize Firebase App
const app = isFirebaseConfigured() && typeof window !== 'undefined'
    ? getApps().length === 0
        ? initializeApp(firebaseConfig)
        : getApp()
    : null;

// Lazy-loaded services to be used throughout the app
const getDb = () => (app ? getFirestore(app) : null);
const getAuthInstance = () => (app ? getAuth(app) : null);

// Export instances for use, which will be null if not configured
export const db = getDb();
export const auth = getAuthInstance();

// Export the configuration check as well
export { isFirebaseConfigured };
