
'use client';

import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// This function is now responsible for initializing the client-side Firebase app
// It receives the config object directly.
export function initializeFirebaseApp(config: FirebaseOptions) {
    if (!config.apiKey) {
        throw new Error("Firebase configuration is missing or incomplete.");
    }
    
    const app = getApps().length ? getApp() : initializeApp(config);
    const auth = getAuth(app);
    const db = getFirestore(app);

    return { app, auth, db };
}
