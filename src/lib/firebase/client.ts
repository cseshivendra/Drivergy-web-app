
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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
    throw new Error("Firebase configuration is missing or incomplete.");
}

// Initialize Firebase
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

