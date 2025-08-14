// src/lib/firebase/admin.ts
import admin from 'firebase-admin';

// This function checks if the app is already initialized to prevent errors.
function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // The private key needs to be parsed correctly from the environment variable.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !clientEmail || !privateKey) {
    if (!projectId) console.error("Firebase Admin SDK Error: FIREBASE_PROJECT_ID is not set.");
    if (!clientEmail) console.error("Firebase Admin SDK Error: FIREBASE_CLIENT_EMAIL is not set.");
    if (!privateKey) console.error("Firebase Admin SDK Error: FIREBASE_PRIVATE_KEY is not set.");
    console.error('Firebase Admin SDK environment variables not fully set. Server features requiring authentication will fail.');
    return null;
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    return null;
  }
}

const adminApp = initializeAdminApp();

export const adminAuth = adminApp ? adminApp.auth() : null;
export const adminDb = adminApp ? adminApp.firestore() : null;
export const adminStorage = adminApp ? adminApp.storage() : null;
