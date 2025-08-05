
'use server';

import type { BlogPost, UserProfile, ApprovalStatusType } from '@/types';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { collection, query, orderBy, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';

// This file is for server-side data fetching and data seeding logic only.

/**
 * Fetches all blog posts from Firestore for server-side operations like sitemap generation.
 * This uses the Firebase Admin SDK.
 * @returns A promise that resolves to an array of blog posts.
 */
export async function fetchBlogPosts(): Promise<BlogPost[]> {
    if (!adminDb) {
        console.error("Firebase Admin SDK not initialized. Cannot fetch blog posts for sitemap.");
        return [];
    }
    try {
        const snapshot = await getDocs(query(collection(adminDb, 'blogPosts'), orderBy('date', 'desc')));
        return snapshot.docs.map(d => ({ slug: d.id, ...d.data() } as BlogPost));
    } catch (error) {
        console.error("Error fetching blog posts for sitemap:", error);
        return [];
    }
}


// =================================================================
// SERVER-SIDE DATA SEEDING (RUNS ONCE)
// =================================================================
const ensureAdminExists = async () => {
    if (!adminDb) return;
    const adminRef = doc(adminDb, 'admins', 'default_admin');
    try {
        const adminSnap = await getDoc(adminRef);
        if (!adminSnap.exists()) {
            console.log("Default admin not found, creating one...");
            await setDoc(adminRef, {
                username: 'admin',
                password: 'admin'
            });
            console.log("Default admin created successfully.");
        }
    } catch (error) {
        console.error("Error ensuring admin exists:", error);
    }
};

const createSampleUser = async (userData: {
  email: string;
  name: string;
  role: 'customer' | 'trainer';
}) => {
  if (!adminAuth || !adminDb) return;
  const { email, name, role } = userData;

  try {
    // Check if user already exists in Firebase Auth
    try {
      await adminAuth.getUserByEmail(email);
      console.log(`User ${email} already exists. Skipping creation.`);
      return; 
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error; // Re-throw other auth errors
      }
    }
    
    console.log(`Creating user: ${email}`);
    const userRecord = await adminAuth.createUser({
      email,
      password: 'password', // Set a default password
      displayName: name,
      emailVerified: true,
    });

    const uid = userRecord.uid;
    const targetCollection = role === 'customer' ? 'customers' : 'trainers';
    const userRef = doc(adminDb, targetCollection, uid);

    let newUserProfile;

    if (role === 'trainer') {
      newUserProfile = {
        uniqueId: `TR-${uid.slice(-6).toUpperCase()}`,
        name,
        username: name.toLowerCase().replace(' ', ''),
        contact: email,
        phone: '9876543210',
        gender: 'Male',
        location: 'Gurugram',
        subscriptionPlan: 'Trainer',
        registrationTimestamp: format(new Date(), 'MMM dd, yyyy'),
        approvalStatus: 'Approved' as ApprovalStatusType,
        photoURL: `https://placehold.co/100x100.png?text=${name.charAt(0)}`,
        myReferralCode: `${name.split(' ')[0].toUpperCase()}${uid.slice(-4)}`,
        vehicleInfo: 'Car (Manual)',
        specialization: 'Car',
        yearsOfExperience: 5,
        trainerCertificateUrl: 'https://placehold.co/file.pdf',
        drivingLicenseUrl: 'https://placehold.co/file.pdf',
        aadhaarCardUrl: 'https://placehold.co/file.pdf',
      };
    } else {
      newUserProfile = {
        uniqueId: `CU-${uid.slice(-6).toUpperCase()}`,
        name,
        username: name.toLowerCase().replace(' ', ''),
        contact: email,
        phone: '1234567890',
        gender: 'Female',
        location: 'Gurugram',
        subscriptionPlan: 'Premium',
        registrationTimestamp: format(new Date(), 'MMM dd, yyyy'),
        approvalStatus: 'Approved' as ApprovalStatusType,
        photoURL: `https://placehold.co/100x100.png?text=${name.charAt(0)}`,
        myReferralCode: `${name.split(' ')[0].toUpperCase()}${uid.slice(-4)}`,
        trainerPreference: 'Any',
        assignedTrainerId: null, // Will be assigned later if needed
        assignedTrainerName: null,
        upcomingLesson: 'Not yet scheduled',
        subscriptionStartDate: format(new Date(), 'MMM dd, yyyy'),
        totalLessons: 20,
        completedLessons: 5,
        feedbackSubmitted: false,
        totalReferralPoints: 100,
        flatHouseNumber: '123, Sample Apartments',
        street: 'Main Road',
        district: 'Gurugram',
        state: 'Haryana',
        pincode: '122001',
        dlStatus: 'New Learner',
        photoIdType: 'Aadhaar Card',
        photoIdNumber: '123456789012',
        photoIdUrl: 'https://placehold.co/file.pdf'
      };
    }

    await setDoc(userRef, newUserProfile);
    console.log(`Successfully created ${role}: ${email}`);
  } catch (error) {
    console.error(`Failed to create sample user ${email}:`, error);
  }
};

// This IIFE will run once when the server starts up.
(async () => {
    try {
        await ensureAdminExists();
        await createSampleUser({ email: 'trainer@drivergy.com', name: 'Sample Trainer', role: 'trainer' });
        await createSampleUser({ email: 'customer@drivergy.com', name: 'Sample Customer', role: 'customer' });
    } catch(e) {
        console.error("Error during initial data seeding:", e);
    }
})();
