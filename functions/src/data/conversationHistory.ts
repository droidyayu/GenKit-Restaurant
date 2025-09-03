import {getFirestore} from "firebase-admin/firestore";

// Simple conversation history types
export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Simplified conversation history functions
let db: any = null;

// Initialize Firebase connection only when needed
const getDb = () => {
  if (!db) {
    try {
      db = getFirestore();
    } catch (error) {
      console.warn("[CONVERSATION_HISTORY] Firebase not initialized, conversation history disabled");
      return null;
    }
  }
  return db;
};

// Helper function to clean metadata by removing undefined values
const cleanMetadata = (metadata?: Record<string, any>): Record<string, any> | undefined => {
  if (!metadata) return undefined;

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }

  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
};

export const getConversationHistory = async (userId: string, maxMessages = 10): Promise<ConversationMessage[]> => {
  try {
    const firestore = getDb();
    if (!firestore) {
      return [];
    }

    const userConversationRef = firestore.collection("conversations").doc(userId);
    const doc = await userConversationRef.get();

    if (!doc.exists) {
      return [];
    }

    const data = doc.data();
    if (!data || !data.messages) {
      return [];
    }

    const messages = data.messages as ConversationMessage[];
    return messages
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, maxMessages);
  } catch (error) {
    console.error(`[CONVERSATION_HISTORY] Error getting history for user ${userId}:`, error);
    return [];
  }
};

export const addConversationMessage = async (
  userId: string,
  role: "user" | "assistant",
  content: string,
  metadata?: Record<string, any>
): Promise<boolean> => {
  try {
    const firestore = getDb();
    if (!firestore) {
      return false;
    }

    // Clean metadata to remove undefined values
    const cleanedMetadata = cleanMetadata(metadata);

    const newMessage: ConversationMessage = {
      role,
      content,
      timestamp: new Date().toISOString(),
      metadata: cleanedMetadata,
    };

    const userConversationRef = firestore.collection("conversations").doc(userId);
    const doc = await userConversationRef.get();

    if (!doc.exists) {
      // Create new conversation
      await userConversationRef.set({
        userId,
        messages: [newMessage],
        lastUpdated: newMessage.timestamp,
        totalMessages: 1,
      });
    } else {
      // Update existing conversation
      const data = doc.data();
      const updatedMessages = [...(data?.messages || []), newMessage];

      // Keep only last 50 messages to prevent unlimited growth
      const trimmedMessages = updatedMessages.slice(-50);

      await userConversationRef.update({
        messages: trimmedMessages,
        lastUpdated: newMessage.timestamp,
        totalMessages: trimmedMessages.length,
      });
    }

    return true;
  } catch (error) {
    console.error(`[CONVERSATION_HISTORY] Error adding message for user ${userId}:`, error);
    return false;
  }
};
