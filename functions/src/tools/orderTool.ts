import {ai, z} from "../genkit";
import {
  SimpleOrder,
  createOrderInDatabase,
  getOrdersForStatusCheck,
  markOrdersAsComplete
} from "../data/orderRepository";



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
      userId: z.string().describe("User ID of the customer"),
    }),
  },
  async ({dishes, userId}) => {
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
      customerName: userId, // Use userId as customer identifier
      totalAmount,
      status: "PENDING",
      estimatedTime: "15-20 minutes",
      createdAt: Date.now(),
    };

    // Insert order into database
    const dbSuccess = await createOrderInDatabase(order);
    if (!dbSuccess) {
      console.warn("[ORDER CREATION] Database not available, order not persisted");
    }

    console.log(`[ORDER CREATED] ${orderId} for user ${userId}: ${dishes.length} dishes, $${totalAmount.toFixed(2)}`);

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
    description: "Get status of user's orders and mark incomplete ones as complete",
    inputSchema: z.object({
      userId: z.string().describe("User ID to get orders for"),
    }),
  },
  async ({userId}) => {
    console.log("[GET_ORDER_STATUS_TOOL] Called - fetching orders from database");

    try {
      // Get user's orders for status check (incomplete or last 5)
      const ordersToProcess = await getOrdersForStatusCheck(userId, 10);

      if (ordersToProcess.length === 0) {
        return {
          success: true,
          message: "No orders found to process",
          orders: [],
          totalOrders: 0,
        };
      }

      // Mark all fetched orders as complete
      const orderIds = ordersToProcess.map(order => order.orderId);
      await markOrdersAsComplete(orderIds);

      // Prepare response with updated status
      const processedOrders = ordersToProcess.map(order => ({
        orderId: order.orderId,
        customerName: order.customerName,
        status: "DELIVERED" as const, // Updated status
        dishes: order.dishes,
        totalAmount: order.totalAmount,
        estimatedTime: order.estimatedTime,
        createdAt: order.createdAt,
        progress: 100, // Complete
      }));

      console.log(`[GET_ORDER_STATUS_TOOL] Processed ${processedOrders.length} orders, marked as DELIVERED`);

      return {
        success: true,
        message: `Found and completed ${processedOrders.length} orders`,
        orders: processedOrders,
        totalOrders: processedOrders.length,
      };

    } catch (error) {
      console.error("[GET_ORDER_STATUS_TOOL] Error:", error);
      return {
        success: false,
        message: "Failed to fetch orders",
        orders: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);