
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import getConfig from 'next/config';

const { publicRuntimeConfig } = getConfig() || {};

// This function is now responsible for initializing the client-side Firebase app
// It reads the configuration directly from the publicRuntimeConfig.
const firebaseConfig: FirebaseOptions = {
    apiKey: publicRuntimeConfig?.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: publicRuntimeConfig?.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: publicRuntimeConfig?.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: publicRuntimeConfig?.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: publicRuntimeConfig?.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: publicRuntimeConfig?.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
    console.error("Firebase configuration is missing or incomplete. Check next.config.js and environment variables.");
    // We don't throw here to avoid crashing the app, but auth will fail.
    // The console error will be visible in the browser dev tools.
}

// Initialize Firebase
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
