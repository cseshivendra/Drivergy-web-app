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

// ✅ Helper to initialize app (safe for SSR)
export const getFirebaseApp = () => {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) return null;
  return !getApps().length ? initializeApp(firebaseConfig) : getApp();
};

// ✅ Lazy accessors for Firebase services
export const getFirebaseAuth = () => {
  const app = getFirebaseApp();
  return app ? getAuth(app) : null;
};

export const getFirebaseDb = () => {
  const app = getFirebaseApp();
  return app ? getFirestore(app) : null;
};

export class isFirebaseConfigured {
}