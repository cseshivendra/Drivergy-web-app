'use server';

import admin from 'firebase-admin';

function initializeAdminApp() {
    if (admin.apps.length > 0) {
        return admin.app();
    }
    
    // This will automatically use the service account credentials provided
    // by the App Hosting environment or other server environments like Cloud Functions.
    return admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    });
}

// Server-side Firebase Admin services
export const getAdminAuth = () => {
    initializeAdminApp();
    return admin.auth();
};
export const getAdminFirestore = () => {
    initializeAdminApp();
    return admin.firestore();
};
