import {getFirestore} from "firebase-admin/firestore";

// Simple order interface for the database
export interface SimpleOrder {
  orderId: string;
  dishes: Array<{
    name: string;
    quantity: number;
    spiceLevel?: string;
    specialInstructions?: string;
  }>;
  customerName: string;
  totalAmount: number;
  status: "PENDING" | "PREP" | "COOKING" | "PLATING" | "READY" | "DELIVERED";
  estimatedTime: string;
  createdAt: number;
  completedAt?: number;
}

// Initialize Firestore
const getDb = () => {
  try {
    return getFirestore();
  } catch (error) {
    console.warn("[ORDER_REPOSITORY] Firestore not initialized:", error);
    return null;
  }
};

// Create a new order in the database
export const createOrderInDatabase = async (order: SimpleOrder): Promise<boolean> => {
  const db = getDb();

  if (!db) {
    console.warn("[ORDER_REPOSITORY] Database not available, order not persisted");
    return false;
  }

  try {
    // Store order in path: order/{userId}/{orderId} as per spec
    await db.collection("order").doc(order.customerName).collection("orders").doc(order.orderId).set(order);
    console.log(`[ORDER_REPOSITORY] Order ${order.orderId} inserted into database for user ${order.customerName}`);
    return true;
  } catch (error) {
    console.error("[ORDER_REPOSITORY] Failed to insert order:", error);
    throw new Error("Failed to create order in database");
  }
};

// Get user's incomplete orders (not DELIVERED) or last N orders
export const getOrdersForStatusCheck = async (userId: string, limit = 10): Promise<SimpleOrder[]> => {
  const db = getDb();

  if (!db) {
    console.warn("[ORDER_REPOSITORY] Database not available");
    return [];
  }

  try {
    // Get user's orders from the new path structure: order/{userId}/orders/{orderId}
    const userOrdersQuery = db.collection("order").doc(userId).collection("orders")
      .orderBy("createdAt", "desc")
      .limit(limit * 2); // Get more to filter

    const snapshot = await userOrdersQuery.get();

    // Filter incomplete orders (not DELIVERED)
    const incompleteOrders = snapshot.docs
      .map((doc) => doc.data() as SimpleOrder)
      .filter((order) => order.status !== "DELIVERED")
      .slice(0, limit);

    // If no incomplete orders, return last N orders for this user
    if (incompleteOrders.length === 0) {
      console.log(`[ORDER_REPOSITORY] No incomplete orders for user ${userId}, returning last orders`);
      return snapshot.docs
        .slice(0, Math.min(limit, 5))
        .map((doc) => doc.data() as SimpleOrder);
    }

    return incompleteOrders;
  } catch (error) {
    console.error("[ORDER_REPOSITORY] Error fetching orders for user:", error);
    return [];
  }
};

// Mark orders as complete (DELIVERED)
export const markOrdersAsComplete = async (userId: string, orderIds: string[]): Promise<void> => {
  const db = getDb();

  if (!db) {
    console.warn("[ORDER_REPOSITORY] Database not available, cannot mark orders complete");
    return;
  }

  try {
    const updatePromises = orderIds.map((orderId) =>
      db.collection("order").doc(userId).collection("orders").doc(orderId).update({
        status: "DELIVERED",
        completedAt: Date.now(),
      })
    );

    await Promise.all(updatePromises);
    console.log(`[ORDER_REPOSITORY] Marked ${orderIds.length} orders as DELIVERED for user ${userId}`);
  } catch (error) {
    console.error("[ORDER_REPOSITORY] Error marking orders complete:", error);
    throw error;
  }
};

// Get recent orders for a specific user
export const getRecentOrders = async (userId: string, limit = 5): Promise<SimpleOrder[]> => {
  const db = getDb();
  if (!db) return [];

  try {
    const userOrdersQuery = db.collection("order").doc(userId).collection("orders")
      .orderBy("createdAt", "desc")
      .limit(limit);

    const snapshot = await userOrdersQuery.get();
    return snapshot.docs.map((doc) => doc.data() as SimpleOrder);
  } catch (error) {
    console.error("[ORDER_REPOSITORY] Error fetching recent orders:", error);
    return [];
  }
};
