

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

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
function isFirebaseConfigured(config: typeof firebaseConfig): boolean {
    return !!(config.apiKey && config.authDomain && config.projectId);
}

let app;
let db: Firestore | null = null;
let auth: Auth | null = null;
let isConfigured = isFirebaseConfigured(firebaseConfig);

if (isConfigured) {
    try {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        db = getFirestore(app);
        auth = getAuth(app);
    } catch (error) {
        console.error("[firebase-init] Error initializing Firebase. This can happen during hot reloads. Error:", error);
        isConfigured = false;
    }
} else {
    // This is not an error, but an informational message for developers.
    // The app will proceed to run in local mock mode.
    console.warn("[firebase-init] Firebase configuration is missing or incomplete. The application will run in local mock mode, and no data will be sent to a live database. To enable Firebase, please provide the required environment variables in your `.env.local` file.");
}

export { app, db, auth };
