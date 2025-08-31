
import { ai, z } from './genkit.js';
import { KITCHEN_INVENTORY, KITCHEN_MENU, getInventoryByCategory, getMenuByCategory } from './kitchenData.js';
import type { KitchenState, KitchenDish } from './kitchenTypes.js';

// Timer tool for simulating cooking phases
export const kitchenTimer = ai.defineTool(
  {
    name: 'kitchenTimer',
    description: 'Simulates time progression for cooking phases',
    inputSchema: z.object({
      phase: z.string().describe('The current cooking phase (e.g., PREP, COOKING, PLATING)'),
      duration: z.number().describe('Duration in minutes'),
      message: z.string().describe('Status message for this phase'),
    }),
  },
  async ({ phase, duration, message }) => {
    // Simulate time delay (1 second per minute)
    await new Promise(resolve => setTimeout(resolve, Math.min(duration * 1000, 5000)));
    
    console.log(`[KITCHEN TIMER] ${phase}: ${message} (${duration} minutes)`);
    
    return {
      phase,
      duration,
      message,
      completed: true,
      timestamp: new Date().toISOString()
    };
  }
);

// Inventory tool
export const getInventory = ai.defineTool(
  {
    name: 'getInventory',
    description: 'Get current kitchen inventory and ingredient availability',
    inputSchema: z.object({
      category: z.string().optional().describe('Optional category filter (Proteins, Vegetables, Grains, Dairy, Spices, Herbs, Condiments)'),
    }),
  },
  async ({ category }) => {
    if (category) {
      const categories = getInventoryByCategory();
      return categories[category] || [];
    }
    
    return Object.values(KITCHEN_INVENTORY);
  }
);

// Menu tool
export const getMenu = ai.defineTool(
  {
    name: 'getMenu',
    description: 'Get current menu with available dishes',
    inputSchema: z.object({
      category: z.string().optional().describe('Optional category filter (Vegetarian, Non-Vegetarian, Breads, Rice, Side Dishes, Desserts)'),
      preferences: z.string().optional().describe('Optional preferences (vegetarian, spicy, mild)'),
    }),
  },
  async ({ category, preferences }) => {
    let filteredMenu = KITCHEN_MENU;
    
    if (category) {
      filteredMenu = filteredMenu.filter(item => item.category === category);
    }
    
    if (preferences) {
      const pref = preferences.toLowerCase();
      if (pref.includes('vegetarian')) {
        filteredMenu = filteredMenu.filter(item => item.category === 'Vegetarian');
      } else if (pref.includes('non-vegetarian') || pref.includes('meat')) {
        filteredMenu = filteredMenu.filter(item => item.category === 'Non-Vegetarian');
      }
    }
    
    return filteredMenu;
  }
);

// Order creation tool
export const createOrder = ai.defineTool(
  {
    name: 'createOrder',
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
    const totalAmount = dishes.reduce((sum, dish) => {
      const menuItem = KITCHEN_MENU.find(item => item.name === dish.name);
      return sum + (menuItem?.price || 0) * dish.quantity;
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

// Order status tool
export const getOrderStatus = ai.defineTool(
  {
    name: 'getOrderStatus',
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

// Update order status tool
export const updateOrderStatus = ai.defineTool(
  {
    name: 'updateOrderStatus',
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

// Helper function to get progress percentage
function getProgressPercentage(status: string): number {
  const statusOrder = ['PENDING', 'PREP', 'COOKING', 'PLATING', 'READY', 'DELIVERED'];
  const index = statusOrder.indexOf(status);
  return index >= 0 ? Math.round((index / (statusOrder.length - 1)) * 100) : 0;
}

// Ingredient details tool
export const getIngredientDetails = ai.defineTool(
  {
    name: 'getIngredientDetails',
    description: 'Get detailed information about specific ingredients',
    inputSchema: z.object({
      ingredientName: z.string().optional().describe('Specific ingredient name (if not provided, returns all)'),
    }),
  },
  async ({ ingredientName }) => {
    if (ingredientName) {
      const ingredient = KITCHEN_INVENTORY[ingredientName];
      if (!ingredient) {
        return {
          ingredient: ingredientName,
          available: false,
          error: 'Ingredient not found'
        };
      }
      return ingredient;
    }
    
    const categories = getInventoryByCategory();
    return {
      totalIngredients: Object.keys(KITCHEN_INVENTORY).length,
      categories,
      summary: {
        proteins: categories['Proteins']?.length || 0,
        vegetables: categories['Vegetables']?.length || 0,
        grains: categories['Grains']?.length || 0,
        dairy: categories['Dairy']?.length || 0,
        spices: categories['Spices']?.length || 0,
        herbs: categories['Herbs']?.length || 0,
        condiments: categories['Condiments']?.length || 0,
      }
    };
  }
);

// Complete order tool
export const completeOrder = ai.defineTool(
  {
    name: 'completeOrder',
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
