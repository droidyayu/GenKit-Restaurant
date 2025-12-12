import {getFirestore} from "firebase-admin/firestore";
import type {SessionStore, SessionData} from "@genkit-ai/ai/session";

/**
 * Firestore-based SessionStore implementation for Genkit sessions.
 * Uses userId as the session ID and stores session data in Firestore.
 */
export class FirestoreSessionStore<S = any> implements SessionStore<S> {
  private db: any = null;

  private getDb() {
    if (!this.db) {
      try {
        this.db = getFirestore();
      } catch (error) {
        console.warn("[SESSION_STORE] Firebase not initialized, session store disabled");
        return null;
      }
    }
    return this.db;
  }

  /**
   * Get session data from Firestore using sessionId (userId)
   */
  async get(sessionId: string): Promise<SessionData<S> | undefined> {
    try {
      const firestore = this.getDb();
      if (!firestore) {
        return undefined;
      }

      const sessionRef = firestore.collection("sessions").doc(sessionId);
      const doc = await sessionRef.get();

      if (!doc.exists) {
        return undefined;
      }

      const data = doc.data();
      if (!data) {
        return undefined;
      }

      // Reconstruct SessionData with id
      return {
        id: sessionId,
        state: data.state,
        threads: data.threads || {},
      } as SessionData<S>;
    } catch (error) {
      console.error(`[SESSION_STORE] Error getting session ${sessionId}:`, error);
      return undefined;
    }
  }

  /**
   * Helper function to remove undefined values from an object
   */
  private removeUndefinedValues(obj: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  /**
   * Save session data to Firestore (without id, as per SessionStore interface)
   */
  async save(sessionId: string, sessionData: Omit<SessionData<S>, "id">): Promise<void> {
    try {
      const firestore = this.getDb();
      if (!firestore) {
        console.warn("[SESSION_STORE] Firestore not available, skipping save");
        return;
      }

      const sessionRef = firestore.collection("sessions").doc(sessionId);

      // Prepare data object, filtering out undefined values
      const dataToSave: Record<string, any> = {
        threads: sessionData.threads || {},
        lastUpdated: new Date().toISOString(),
      };

      // Only include state if it's defined
      if (sessionData.state !== undefined) {
        dataToSave.state = sessionData.state;
      }

      // Remove any undefined values before saving
      const cleanedData = this.removeUndefinedValues(dataToSave);

      // Save session data without id (id is the document ID)
      await sessionRef.set(cleanedData, {merge: true});

      console.log(`[SESSION_STORE] Saved session ${sessionId}`);
    } catch (error) {
      console.error(`[SESSION_STORE] Error saving session ${sessionId}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export const firestoreSessionStore = new FirestoreSessionStore();

