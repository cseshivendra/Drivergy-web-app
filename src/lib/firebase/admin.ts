
'use server';

import admin from 'firebase-admin';

async function initializeAdminApp() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    // Explicitly check that all required variables are present.
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    if (projectId && clientEmail && privateKey) {
        return admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
            projectId: projectId, 
        });
    }

    // This warning helps debug if environment variables are missing on the server.
    console.warn("Firebase Admin credentials not fully provided in environment variables. Server-side Firebase operations will fail.");
    // Return null if not configured to prevent further errors.
    return null;
}

// Server-side Firebase Admin services
export const getAdminAuth = async () => {
    const app = await initializeAdminApp();
    if (!app) throw new Error("Firebase Admin SDK not initialized. Check server environment variables.");
    return admin.auth(app);
};
export const getAdminFirestore = async () => {
    const app = await initializeAdminApp();
    if (!app) throw new Error("Firebase Admin SDK not initialized. Check server environment variables.");
    return admin.firestore(app);
};
