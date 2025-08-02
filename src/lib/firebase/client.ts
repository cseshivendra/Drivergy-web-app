
'use client';

import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// This function now constructs the config object itself, ensuring it's always fresh.
const getFirebaseConfig = (): FirebaseOptions => {
  const firebaseConfig: FirebaseOptions = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Basic check to see if the necessary keys are provided.
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error("Firebase config is missing or incomplete. Check your .env file.");
    // Return a dummy object or throw an error to prevent partial initialization.
    return {};
  }
  return firebaseConfig;
}


// This function is now responsible for initializing the client-side Firebase app
export function initializeFirebaseApp() {
    const config = getFirebaseConfig();
    
    if (!config.apiKey) {
        throw new Error("Firebase configuration is missing or incomplete.");
    }
    
    const app = getApps().length ? getApp() : initializeApp(config);
    const auth = getAuth(app);
    const db = getFirestore(app);

    return { app, auth, db };
}
