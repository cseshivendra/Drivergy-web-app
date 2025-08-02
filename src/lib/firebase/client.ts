
'use client';

import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const isFirebaseConfigured = (config: FirebaseOptions): boolean => {
  return !!config.apiKey && !!config.projectId;
};

// This function is now responsible for initializing the client-side Firebase app
export function initializeFirebaseApp(config: FirebaseOptions) {
    if (!isFirebaseConfigured(config)) {
        throw new Error("Firebase configuration is missing or incomplete.");
    }
    
    const app = getApps().length ? getApp() : initializeApp(config);
    const auth = getAuth(app);
    const db = getFirestore(app);

    return { app, auth, db };
}
