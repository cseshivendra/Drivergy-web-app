

import admin from 'firebase-admin';

// This function initializes the Firebase Admin SDK.
// It's designed to be a singleton, ensuring it only runs once.
const initializeAdminApp = () => {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error("Firebase Admin credentials not fully provided in environment variables.");
    }

    try {
        return admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
            projectId: projectId, // Explicitly set projectId here as well
        });
    } catch (error: any) {
        console.error("Firebase Admin SDK Initialization Error:", error);
        throw new Error(`Failed to initialize Firebase Admin SDK: ${error.message}`);
    }
};


// Initialize the app immediately when this module is loaded on the server.
const adminApp = initializeAdminApp();

// Export auth and firestore instances directly.
// This ensures that any part of the server-side application that imports them
// gets the already-initialized instances.
export const adminAuth = admin.auth(adminApp);
export const adminDb = admin.firestore(adminApp);
