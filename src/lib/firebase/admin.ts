
// src/lib/firebase/admin.ts
import admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';

// This function checks if the app is already initialized to prevent errors.
function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Check for missing environment variables and provide specific error messages.
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Get the raw private key from the environment variable.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error("Firebase Admin SDK Initialization Error: One or more required environment variables are missing.");
    if (!projectId) console.error("-> FIREBASE_PROJECT_ID is not set.");
    if (!clientEmail) console.error("-> FIREBASE_CLIENT_EMAIL is not set.");
    if (!privateKey) console.error("-> FIREBASE_PRIVATE_KEY is not set.");
    console.error("Please check your .env file and hosting environment variables and ensure all Firebase Admin credentials are provided.");
    return null;
  }
  
  // Construct the ServiceAccount object.
  // This is a more robust way to handle the private key, especially in environments
  // where string formatting can be an issue.
  const serviceAccount: ServiceAccount = {
    projectId,
    clientEmail,
    // IMPORTANT: Replace the literal `\\n` strings with actual newline characters.
    // This is the most common point of failure for this error.
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };

  // A sanity check to ensure the key looks correct after formatting.
  if (!serviceAccount.privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
    console.error("Firebase Admin SDK Initialization Error: FIREBASE_PRIVATE_KEY is malformed.");
    console.error("-> It must start with '-----BEGIN PRIVATE KEY-----'.");
    console.error("-> Please ensure you have copied the entire private key value from your service account JSON file and that it's correctly set in your environment variables.");
    return null;
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error:', error.message);
    // Log the malformed key for debugging if it's the cause, but be careful in production.
    if (error.message.includes('private key')) {
        console.error("Malformed private key detected. Check your environment variable formatting.");
    }
    return null;
  }
}

const adminApp = initializeAdminApp();

export const adminAuth = adminApp ? adminApp.auth() : null;
export const adminDb = adminApp ? adminApp.firestore() : null;
export const adminStorage = adminApp ? adminApp.storage() : null;
