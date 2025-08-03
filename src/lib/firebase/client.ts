
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// This file is responsible for initializing the client-side Firebase app.

// We will use a singleton pattern to ensure the app is only initialized once.
let firebaseApp: FirebaseApp | undefined;
let firebaseAuth: Auth | undefined;
let firestoreDb: Firestore | undefined;

export function initializeFirebaseApp() {
    // If the app is already initialized, return the existing instances.
    if (firebaseApp) {
        return { app: firebaseApp, auth: firebaseAuth!, db: firestoreDb! };
    }

    const firebaseConfig: FirebaseOptions = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    
    // Check if the configuration is complete.
    if (!firebaseConfig.apiKey) {
        throw new Error("Firebase configuration is missing or incomplete. Make sure your .env file is correctly set up and the Next.js server is restarted.");
    }
    
    // Initialize the Firebase app.
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Store the initialized instances.
    firebaseApp = app;
    firebaseAuth = auth;
    firestoreDb = db;

    return { app, auth, db };
}
