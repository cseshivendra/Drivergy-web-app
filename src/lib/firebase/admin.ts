'use server';

import admin from 'firebase-admin';

async function initializeAdminApp() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const serviceAccount = {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // The private key must be formatted correctly by replacing `\n` with actual newlines.
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };
    
    // Check if the essential service account properties are present.
    // This is a more robust way to initialize than relying on default credentials.
    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.projectId,
        });
    }

    console.warn("Firebase Admin credentials not provided in environment variables. Falling back to default credentials.");
    // Fallback to default credentials for environments like Firebase App Hosting
    return admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    });
}

// Server-side Firebase Admin services
export const getAdminAuth = async () => {
    await initializeAdminApp();
    return admin.auth();
};
export const getAdminFirestore = async () => {
    await initializeAdminApp();
    return admin.firestore();
};