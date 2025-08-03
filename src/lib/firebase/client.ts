
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

    // Hardcoded configuration to ensure keys are always valid on the client.
    // These keys are public and safe to expose.
    const firebaseConfig: FirebaseOptions = {
        apiKey: "AIzaSyDNz72w3Cbs0PsOUfuQYJF35An-wJb3Pvs",
        authDomain: "driveview-pfyzq.firebaseapp.com",
        projectId: "driveview-pfyzq",
        storageBucket: "driveview-pfyzq.appspot.com",
        messagingSenderId: "964264958585",
        appId: "1:964264958585:web:a4449ae823cef0c57d92a8"
    };
    
    // Check if the configuration is complete.
    if (!firebaseConfig.apiKey) {
        throw new Error("Firebase configuration is missing or incomplete.");
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
