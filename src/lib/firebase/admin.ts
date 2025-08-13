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

  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
    console.error('Firebase Admin SDK environment variables not set. Some server features may not work.');
    return null;
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
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
