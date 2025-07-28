

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

// IMPORTANT: This file configures the connection to a LIVE Firebase database.
// For the app to work with Firebase, you must:
// 1. Create a Firebase project in the Firebase Console.
// 2. Create a `.env.local` file in the root of your project.
// 3. Add your Firebase project's configuration keys to the `.env.local` file.
//
// The app can also run in a "mock" mode without a database connection,
// which is useful for UI development and testing.

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Centralized check for essential configuration
export function isFirebaseConfigured(): boolean {
    return !!(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId);
}

let app;
let auth: Auth | null = null;
let isConfigured = isFirebaseConfigured();

if (isConfigured) {
    try {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
    } catch (error) {
        console.error("[firebase-init] CRITICAL: Error initializing Firebase. This can happen during hot reloads. Error:", error);
        isConfigured = false;
    }
} else {
    // This is a warning for developers to add their credentials.
    // The app will not function correctly without them, but we avoid a hard crash.
    console.warn("[firebase-init] WARNING: Firebase configuration is missing or incomplete. The application requires a valid Firebase configuration in .env.local to function with live data.");
}

export { app, auth };
