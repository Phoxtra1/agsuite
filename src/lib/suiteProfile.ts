/**
 * Suite Profile - Lightweight identity record
 * 
 * This only tracks:
 * - userId (from Appwrite auth)
 * - onboardingComplete (boolean)
 * 
 * Suite Profile does NOT control authorization.
 * Products handle their own permissions internally.
 */

import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';

const DB_ID = APPWRITE_DB_ID;
const PROFILES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID || 'profiles';

export interface SuiteProfile {
  $id?: string;
  userId: string;
  onboardingComplete: boolean;
  createdAt?: string;
}

/**
 * Fetch or create a lightweight Suite profile
 * Failure should NOT block login
 */
export async function getOrCreateProfile(userId: string): Promise<SuiteProfile | null> {
  try {
    // Try to find existing profile
    const response = await databases.listDocuments(
      DB_ID,
      PROFILES_COLLECTION_ID,
      [Query.equal('userId', userId), Query.limit(1)]
    );

    if (response.documents.length > 0) {
      const doc = response.documents[0];
      return {
        $id: doc.$id,
        userId: doc.userId as string,
        onboardingComplete: doc.onboardingComplete as boolean,
        createdAt: doc.$createdAt,
      };
    }

    // Create new profile
    const newProfile = await databases.createDocument(
      DB_ID,
      PROFILES_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        onboardingComplete: true,
      }
    );

    return {
      $id: newProfile.$id,
      userId: newProfile.userId as string,
      onboardingComplete: newProfile.onboardingComplete as boolean,
      createdAt: newProfile.$createdAt,
    };
  } catch (error) {
    // Profile creation failure should NOT block login
    console.warn('Suite profile fetch/create failed (non-blocking):', error);
    return null;
  }
}

/**
 * Mark profile as onboarding complete
 */
export async function markOnboardingComplete(profileId: string): Promise<void> {
  try {
    await databases.updateDocument(
      DB_ID,
      PROFILES_COLLECTION_ID,
      profileId,
      { onboardingComplete: true }
    );
  } catch (error) {
    console.warn('Failed to update onboarding status:', error);
  }
}
