// This file is deprecated. Use firebase/client.ts for client-side and firebase/admin.ts for server-side.

'use client';

import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// This function is now responsible for initializing the client-side Firebase app
// It reads the configuration directly from NEXT_PUBLIC_ environment variables.
export function initializeFirebaseApp() {
    // Hardcoded configuration to ensure keys are always valid on the client.
    const firebaseConfig: FirebaseOptions = {
        apiKey: "AIzaSyDNz72w3Cbs0PsOUfuQYJF35An-wJb3Pvs",
        authDomain: "driveview-pfyzq.firebaseapp.com",
        projectId: "driveview-pfyzq",
        storageBucket: "driveview-pfyzq.appspot.com",
        messagingSenderId: "964264958585",
        appId: "1:964264958585:web:a4449ae823cef0c57d92a8"
    };

    if (!firebaseConfig.apiKey) {
        throw new Error("Firebase configuration is missing or incomplete. Make sure your .env file is correctly set up and the Next.js server is restarted.");
    }

    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    return { app, auth, db };
}
