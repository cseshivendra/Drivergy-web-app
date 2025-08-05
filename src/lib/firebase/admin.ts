
import admin from 'firebase-admin';

// This function ensures the Firebase Admin SDK is initialized only once.
if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        console.error("Firebase Admin credentials not fully provided in environment variables.");
        // We don't throw an error here to allow the app to build,
        // but server-side Firebase operations will fail.
    } else {
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
            // We don't throw an error here to allow the app to build,
            // but server-side Firebase operations will fail.
        }
    }
}

export const adminAuth = admin.apps.length ? admin.auth() : null;
export const adminDb = admin.apps.length ? admin.firestore() : null;
