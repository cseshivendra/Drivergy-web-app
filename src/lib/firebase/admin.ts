
'use server';

import admin from 'firebase-admin';

async function initializeAdminApp() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID, // Use the new server-side variable
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };
    
    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.projectId, 
        });
    }

    console.warn("Firebase Admin credentials not provided in environment variables. Falling back to default credentials.");
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
