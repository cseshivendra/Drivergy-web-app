
import admin from 'firebase-admin';

// This is a more robust way to initialize the Firebase Admin SDK in a Next.js environment.
// It ensures that the app is initialized only once, preventing errors.

if (!admin.apps.length) {
  try {
    const serviceAccount: admin.ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // The private key needs to have its newlines properly escaped in the .env file.
      // Vercel handles this automatically. For a local .env file, it should be wrapped in quotes.
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };

    // Check if all credentials are provided before attempting to initialize
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
        throw new Error("Firebase Admin credentials are not fully provided in environment variables. Cannot initialize Admin SDK.");
    }
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.projectId,
    });
    console.log("Firebase Admin SDK initialized successfully.");

  } catch (error: any) {
    console.error("Firebase Admin SDK Initialization Error:", error.message);
    // In a real production environment, you might want to handle this more gracefully,
    // but for development, throwing an error makes the problem visible immediately.
  }
}

// Export the initialized services. 
// If initialization failed, these will be null and any attempt to use them will fail,
// which is the desired behavior to surface the configuration error.
export const adminAuth = admin.apps.length ? admin.auth() : null;
export const adminDb = admin.apps.length ? admin.firestore() : null;

    