
// src/lib/firebase/admin.ts
import admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';

// This function checks if the app is already initialized to prevent errors.
function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Helper to trim and remove quotes from env vars
  const cleanEnvVar = (value?: string): string | undefined => {
    if (!value) return undefined;
    return value.trim().replace(/^['"](.*)['"]$/, '$1');
  };

  const projectId = cleanEnvVar(process.env.FIREBASE_PROJECT_ID);
  const clientEmail = cleanEnvVar(process.env.FIREBASE_CLIENT_EMAIL);
  // Get the raw private key, clean it, and then format it.
  const rawPrivateKey = cleanEnvVar(process.env.FIREBASE_PRIVATE_KEY);
  
  if (!projectId || !clientEmail || !rawPrivateKey) {
    console.error("Firebase Admin SDK Initialization Error: One or more required environment variables are missing.");
    if (!projectId) console.error("-> FIREBASE_PROJECT_ID is not set.");
    if (!clientEmail) console.error("-> FIREBASE_CLIENT_EMAIL is not set.");
    if (!rawPrivateKey) console.error("-> FIREBASE_PRIVATE_KEY is not set.");
    console.error("Please check your .env file and hosting environment variables.");
    return null;
  }
  
  // This is the crucial step: replace the literal `\n` with actual newline characters.
  const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

  // A sanity check to ensure the key looks correct after formatting.
  if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
    console.error("Firebase Admin SDK Initialization Error: FIREBASE_PRIVATE_KEY is malformed after processing.");
    console.error("-> It must start with '-----BEGIN PRIVATE KEY-----'.");
    console.error("-> Please ensure you have copied the entire private key value from your service account JSON file.");
    return null;
  }

  const serviceAccount: ServiceAccount = {
    projectId,
    clientEmail,
    privateKey,
  };

  try {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
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
