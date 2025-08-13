// This file is being replaced by live Firestore data fetching.
// The functions are now implemented in `src/lib/server-data.ts` (for server)
// and directly within components/contexts using hooks (for client).

// We will keep this file for now to avoid breaking imports, but it will be empty.
// In a real project, you would delete this file and update all imports.

import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase/client';
import type { PromotionalPoster } from '@/types';

export const listenToPromotionalPosters = (callback: (posters: PromotionalPoster[]) => void) => {
  if (!db) {
    console.error('Firestore is not initialized.');
    return () => {};
  }
  const postersCollectionRef = collection(db, 'promotionalPosters');
  const unsubscribe = onSnapshot(postersCollectionRef, (querySnapshot) => {
    const posters: PromotionalPoster[] = [];
    querySnapshot.forEach((doc) => {
      posters.push({ id: doc.id, ...doc.data() } as PromotionalPoster);
    });
    callback(posters);
  });
  return unsubscribe;
};
