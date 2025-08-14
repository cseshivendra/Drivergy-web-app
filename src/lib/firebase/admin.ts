// src/lib/firebase/admin.ts
import admin from 'firebase-admin';

// This function checks if the app is already initialized to prevent errors.
function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // The private key needs to be parsed correctly from the environment variable.
  // This replaces the literal string "\\n" with actual newline characters.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !clientEmail || !privateKey) {
    console.error("Firebase Admin SDK Initialization Error: One or more required environment variables are missing.");
    if (!projectId) console.error("-> FIREBASE_PROJECT_ID is not set.");
    if (!clientEmail) console.error("-> FIREBASE_CLIENT_EMAIL is not set.");
    if (!privateKey) console.error("-> FIREBASE_PRIVATE_KEY is not set.");
    console.error("Please check your .env file and ensure all Firebase Admin credentials are provided.");
    return null;
  }
  
  if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
    console.error("Firebase Admin SDK Initialization Error: FIREBASE_PRIVATE_KEY is malformed.");
    console.error("-> It must start with '-----BEGIN PRIVATE KEY-----'.");
    console.error("-> Please ensure you have copied the entire private key value from your service account JSON file.");
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
  } catch (error: any) {
    console.error('Firebase admin initialization error:', error.message);
    return null;
  }
}

const adminApp = initializeAdminApp();

export const adminAuth = adminApp ? adminApp.auth() : null;
export const adminDb = adminApp ? adminApp.firestore() : null;
export const adminStorage = adminApp ? adminApp.storage() : null;
