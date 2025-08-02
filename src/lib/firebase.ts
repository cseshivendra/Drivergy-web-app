
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// This function now takes the config as an argument
// and returns the initialized services.
export const initializeFirebaseApp = (firebaseConfig: FirebaseOptions) => {
    let app;
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    const auth = getAuth(app);
    const db = getFirestore(app);
    return { app, auth, db };
};

// Helper to check if the essential Firebase config values are present.
export const isFirebaseConfigured = (config: FirebaseOptions): boolean => {
  return !!config.apiKey && !!config.projectId;
};
