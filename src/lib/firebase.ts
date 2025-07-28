

// =================================================================
// FIREBASE IS DISABLED - APP IS RUNNING IN OFFLINE MOCK MODE
// =================================================================
// This file is intentionally left blank to disable Firebase.
// The application is currently configured to use local mock data
// from `src/lib/mock-data.ts` for all its data needs.
// No connection to a live Firebase database will be made.
// To re-enable Firebase, you must restore the initialization
// code and provide your project credentials in a .env.local file.

import type { Auth } from "firebase/auth";

export const isFirebaseConfigured = () => false;
export const app = null;
export const auth: Auth | null = null;
export const db = null;
