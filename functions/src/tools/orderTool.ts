import {ai, z} from "../genkit";

// Simple order interface for the new system
interface SimpleOrder {
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
}

// Global order storage (in a real system this would be a database)
let currentOrder: SimpleOrder | null = null;

// Helper function to get progress percentage
function getProgressPercentage(status: string): number {
  const statusOrder = ["PENDING", "PREP", "COOKING", "PLATING", "READY", "DELIVERED"];
  const index = statusOrder.indexOf(status);
  return index >= 0 ? Math.round((index / (statusOrder.length - 1)) * 100) : 0;
}

export const createOrderTool = ai.defineTool(
  {
    name: "createOrderTool",
    description: "Create a new order with dishes and details",
    inputSchema: z.object({
      dishes: z.array(z.object({
        name: z.string().describe("Dish name"),
        quantity: z.number().describe("Quantity"),
        spiceLevel: z.string().optional().describe("Spice level (Mild, Medium, Hot, Extra Hot)"),
        specialInstructions: z.string().optional().describe("Special instructions"),
      })).describe("List of dishes to order"),
      customerName: z.string().describe("Customer name"),
    }),
  },
  async ({dishes, customerName}) => {
    const orderId = `ORD_${Date.now()}`;

    // Calculate total amount (simplified pricing)
    const totalAmount = dishes.reduce((sum, dish) => {
      // Simple pricing logic - in real system this would come from menu
      const basePrice = 12.99; // Default price
      return sum + basePrice * dish.quantity;
    }, 0);

    const order: SimpleOrder = {
      orderId,
      dishes,
      customerName,
      totalAmount,
      status: "PENDING",
      estimatedTime: "15-20 minutes",
      createdAt: Date.now(),
    };

    // Store the order globally
    currentOrder = order;

    console.log(`[ORDER CREATED] ${orderId} for ${customerName}: ${dishes.length} dishes, $${totalAmount.toFixed(2)}`);

    return {
      success: true,
      orderId: order.orderId,
      message: `Order created successfully with ID: ${orderId}`,
      order: order,
    };
  }
);

export const getOrderStatusTool = ai.defineTool(
  {
    name: "getOrderStatusTool",
    description: "Get the current status of an order",
    inputSchema: z.object({
      orderId: z.string().optional().describe(
        "Order ID (if not provided, returns current order status)"
      ),
    }),
  },
  async () => {
    console.log(`[GET_ORDER_STATUS_TOOL] Called`);

    if (!currentOrder) {
      console.log(`[GET_ORDER_STATUS_TOOL] No active order found`);
      return {
        status: "NO_ACTIVE_ORDER",
        message: "No active order found",
      };
    }

    console.log(`[GET_ORDER_STATUS_TOOL] Returning status for order ${currentOrder.orderId}: ${currentOrder.status} (${getProgressPercentage(currentOrder.status)}% complete)`);
    return {
      orderId: currentOrder.orderId,
      status: currentOrder.status,
      estimatedTime: currentOrder.estimatedTime,
      dishes: currentOrder.dishes,
      createdAt: currentOrder.createdAt,
      progress: getProgressPercentage(currentOrder.status),
    };
  }
);

export const updateOrderStatusTool = ai.defineTool(
  {
    name: "updateOrderStatusTool",
    description: "Update the status of the current order",
    inputSchema: z.object({
      status: z.enum(["PENDING", "PREP", "COOKING", "PLATING", "READY", "DELIVERED"])
        .describe("New order status"),
      message: z.string().optional().describe("Status update message"),
    }),
  },
  async ({status, message}) => {
    if (!currentOrder) {
      throw new Error("No active order to update");
    }

    currentOrder.status = status;

    console.log(`[ORDER STATUS UPDATED] ${currentOrder.orderId}: ${status}${message ? ` - ${message}` : ""}`);

    return {
      success: true,
      orderId: currentOrder.orderId,
      status: currentOrder.status,
      message: message || `Order status updated to ${status}`,
      timestamp: new Date().toISOString(),
    };
  }
);

export const completeOrderTool = ai.defineTool(
  {
    name: "completeOrderTool",
    description: "Complete the current order and clear it from the system",
    inputSchema: z.object({}),
  },
  async () => {
    console.log(`[COMPLETE_ORDER_TOOL] Called`);

    if (!currentOrder) {
      console.log(`[COMPLETE_ORDER_TOOL] No active order to complete`);
      return {
        success: false,
        error: "No active order to complete",
      };
    }

    const completedOrder = {...currentOrder};
    currentOrder = null; // Clear the current order

    console.log(`[COMPLETE_ORDER_TOOL] Order ${completedOrder.orderId} completed and cleared`);

    return {
      success: true,
      orderId: completedOrder.orderId,
      message: "Order completed successfully",
      timestamp: new Date().toISOString(),
    };
  }
);
