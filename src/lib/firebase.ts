
import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// This is the primary configuration object for Firebase.
// It MUST be populated with the values from your .env file.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Function to safely initialize Firebase, preventing re-initialization.
// This ensures a single instance of the app is used.
const initializeFirebaseApp = () => {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  } else {
    return getApp();
  }
};

const app = initializeFirebaseApp();

// Helper to check if the essential Firebase config values are present.
const isFirebaseConfigured = (): boolean => {
  return !!firebaseConfig.apiKey && !!firebaseConfig.projectId;
};

// We conditionally export the Firebase services.
// If the config is not provided, these will be null, and the app
// will know to operate in a "mock" or "offline" mode.
export const db = isFirebaseConfigured() ? getFirestore(app) : null;
export const auth = isFirebaseConfigured() ? getAuth(app) : null;

// Export the configuration check function for use in other parts of the app.
export { isFirebaseConfigured };
