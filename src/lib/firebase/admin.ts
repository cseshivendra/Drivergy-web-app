
'use server';

import admin from 'firebase-admin';

// This function ensures the Firebase Admin SDK is initialized only once.
export const initializeFirebaseAdmin = () => {
    if (admin.apps.length > 0) {
        return {
            auth: admin.auth(),
            db: admin.firestore(),
        };
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        console.error("Firebase Admin credentials not fully provided in environment variables.");
        throw new Error("Firebase Admin credentials are not fully configured.");
    }

    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
            projectId: projectId,
        });

    } catch (error: any) {
        console.error("Firebase Admin SDK Initialization Error:", error);
        throw new Error(`Failed to initialize Firebase Admin SDK: ${error.message}`);
    }

    return {
        auth: admin.auth(),
        db: admin.firestore(),
    };
};
