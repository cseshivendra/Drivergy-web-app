
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import admin from 'firebase-admin';

const clientConfig: FirebaseOptions = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function initializeClientApp() {
    if (getApps().length) {
        return getApp();
    }
    return initializeApp(clientConfig);
}

function initializeAdminApp() {
    if (admin.apps.length > 0) {
        return admin.app();
    }
    // This will automatically use the service account credentials provided
    // by the App Hosting environment.
    return admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    });
}

// Client-side Firebase services
export const getClientAuth = () => getAuth(initializeClientApp());
export const getClientFirestore = () => getFirestore(initializeClientApp());

// Server-side Firebase Admin services
export const getAdminAuth = () => admin.auth(initializeAdminApp());
export const getAdminFirestore = () => admin.firestore(initializeAdminApp());

export const isFirebaseConfigured = (config: FirebaseOptions): boolean => {
  return !!config.apiKey && !!config.projectId;
};
