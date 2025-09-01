import { ai, z } from '../genkit.js';
import type { KitchenState, KitchenDish } from '../kitchenTypes.js';

// Helper function to get progress percentage
function getProgressPercentage(status: string): number {
  const statusOrder = ['PENDING', 'PREP', 'COOKING', 'PLATING', 'READY', 'DELIVERED'];
  const index = statusOrder.indexOf(status);
  return index >= 0 ? Math.round((index / (statusOrder.length - 1)) * 100) : 0;
}

export const createOrderTool = ai.defineTool(
  {
    name: 'createOrderTool',
    description: 'Create a new order with dishes and details',
    inputSchema: z.object({
      dishes: z.array(z.object({
        name: z.string().describe('Dish name'),
        quantity: z.number().describe('Quantity'),
        spiceLevel: z.string().optional().describe('Spice level (Mild, Medium, Hot, Extra Hot)'),
        specialInstructions: z.string().optional().describe('Special instructions'),
      })).describe('List of dishes to order'),
      customerName: z.string().describe('Customer name'),
    }),
  },
  async ({ dishes, customerName }) => {
    const orderId = `ORD_${Date.now()}`;
    
    // Calculate total amount (simplified pricing)
    const totalAmount = dishes.reduce((sum, dish) => {
      // Simple pricing logic - in real system this would come from menu
      const basePrice = 12.99; // Default price
      return sum + basePrice * dish.quantity;
    }, 0);
    
    const order = {
      orderId,
      dishes: dishes as KitchenDish[],
      customerName,
      totalAmount,
      status: 'PENDING' as const,
      estimatedTime: '15-20 minutes',
      createdAt: Date.now(),
    };
    
    // Store the order in the session state
    const state = ai.currentSession<KitchenState>().state;
    if (state) {
      state.currentOrder = order;
    }
    
    console.log(`[ORDER CREATED] ${orderId} for ${customerName}: ${dishes.length} dishes, $${totalAmount.toFixed(2)}`);
    
    return order;
  }
);

export const getOrderStatusTool = ai.defineTool(
  {
    name: 'getOrderStatusTool',
    description: 'Get the current status of an order',
    inputSchema: z.object({
      orderId: z.string().optional().describe('Order ID (if not provided, returns current order status)'),
    }),
  },
  async ({ orderId }) => {
    const state = ai.currentSession<KitchenState>().state;
    const currentOrder = state?.currentOrder;
    
    if (!currentOrder) {
      return {
        status: 'NO_ACTIVE_ORDER',
        message: 'No active order found'
      };
    }
    
    return {
      orderId: currentOrder.orderId,
      status: currentOrder.status,
      estimatedTime: currentOrder.estimatedTime,
      dishes: currentOrder.dishes,
      createdAt: currentOrder.createdAt,
      progress: getProgressPercentage(currentOrder.status)
    };
  }
);

export const updateOrderStatusTool = ai.defineTool(
  {
    name: 'updateOrderStatusTool',
    description: 'Update the status of the current order',
    inputSchema: z.object({
      status: z.enum(['PENDING', 'PREP', 'COOKING', 'PLATING', 'READY', 'DELIVERED']).describe('New order status'),
      message: z.string().optional().describe('Status update message'),
    }),
  },
  async ({ status, message }) => {
    const state = ai.currentSession<KitchenState>().state;
    if (!state?.currentOrder) {
      throw new Error('No active order to update');
    }
    
    state.currentOrder.status = status;
    console.log(`[ORDER STATUS] ${state.currentOrder.orderId}: ${status} - ${message || ''}`);
    
    return {
      orderId: state.currentOrder.orderId,
      status,
      message,
      timestamp: new Date().toISOString()
    };
  }
);

export const completeOrderTool = ai.defineTool(
  {
    name: 'completeOrderTool',
    description: 'Complete the current order and move it to history',
    inputSchema: z.object({
      finalAmount: z.number().describe('Final order amount'),
    }),
  },
  async ({ finalAmount }) => {
    const state = ai.currentSession<KitchenState>().state;
    if (!state?.currentOrder) {
      throw new Error('No active order to complete');
    }
    
    const completedOrder = {
      ...state.currentOrder,
      status: 'COMPLETED' as const,
      totalAmount: finalAmount,
      completedAt: Date.now()
    };
    
    // Move to order history
    state.orderHistory.push(completedOrder);
    delete state.currentOrder;
    
    console.log(`[ORDER COMPLETED] ${completedOrder.orderId}: $${finalAmount.toFixed(2)}`);
    
    return {
      orderId: completedOrder.orderId,
      status: 'COMPLETED',
      totalAmount: finalAmount,
      message: 'Order completed successfully'
    };
  }
);
