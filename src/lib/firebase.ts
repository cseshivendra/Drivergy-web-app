
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

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

if (isFirebaseConfigured(firebaseConfig)) {
    try {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        db = getFirestore(app);
        auth = getAuth(app);
        console.log("[firebase] Firebase initialized successfully.");
    } catch (error) {
        console.error("[firebase] Error initializing Firebase:", error);
    }
} else {
    console.error("[firebase] Firebase configuration is missing. Please check your .env.local file. Required keys: NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID.");
}

export { app, db, auth };
