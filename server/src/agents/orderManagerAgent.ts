import { ai, z } from '../genkit.js';
import { createOrderTool, updateOrderStatusTool } from '../tools/orderTool.js';
import { inventoryTool } from '../tools/inventoryTool.js';

export const orderManagerAgent = ai.defineFlow(
  {
    name: 'orderManagerAgent',
    inputSchema: z.object({
      userId: z.string().describe('User ID placing the order'),
      dish: z.string().describe('Name of the dish to order'),
      quantity: z.number().optional().describe('Quantity of the dish'),
      specialInstructions: z.string().optional().describe('Any special cooking instructions'),
    }),
  },
  async ({ userId, dish, quantity = 1, specialInstructions }) => {
    console.log(`[ORDER MANAGER] Processing order for user ${userId}: ${quantity}x ${dish}`);
    
    try {
      // Step 1: Validate dish availability
      const dishValidation = await validateDishAvailability(dish);
      
      if (!dishValidation.available) {
        return {
          success: false,
          error: 'Dish not available',
          dish,
          reason: dishValidation.reason,
          message: `Sorry, ${dish} is not available right now. ${dishValidation.suggestion}`,
          alternatives: dishValidation.alternatives
        };
      }
      
      // Step 2: Check ingredient availability
      const ingredientCheck = await checkIngredientAvailability(dish);
      
      if (!ingredientCheck.sufficient) {
        return {
          success: false,
          error: 'Insufficient ingredients',
          dish,
          reason: 'Some ingredients are running low',
          message: `Sorry, we don't have enough ingredients to make ${dish} right now.`,
          missingIngredients: ingredientCheck.missingIngredients,
          alternatives: ingredientCheck.alternatives
        };
      }
      
      // Step 3: Create order in system
      const order = await createOrderTool({
        dishes: [{ name: dish, quantity }],
        customerName: `User ${userId}`
      });
      
      if (!order.success) {
        return {
          success: false,
          error: 'Failed to create order',
          dish,
          message: 'Sorry, there was an error creating your order. Please try again.',
          details: order.error
        };
      }
      
      // Step 4: Update order status to pending
      const statusUpdate = await updateOrderStatusTool({
        status: 'PENDING',
        message: 'Order received and queued for cooking'
      });
      
      console.log(`[ORDER MANAGER] Order ${order.orderId} created successfully and sent to Chef Agent`);
      
      // Step 5: Return order confirmation
      return {
        success: true,
        action: 'order_created',
        orderId: order.orderId,
        userId,
        dish,
        quantity,
        status: 'PENDING',
        message: `Order placed successfully! Your ${dish} will be ready in approximately 15-20 minutes.`,
        nextStep: 'Order sent to Chef Agent for cooking',
        estimatedTime: '15-20 minutes',
        orderDetails: {
          orderId: order.orderId,
          dish,
          quantity,
          specialInstructions: specialInstructions || 'None',
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error(`[ORDER MANAGER] Error processing order for ${dish}:`, error);
      
      return {
        success: false,
        error: 'Failed to process order',
        dish,
        details: error instanceof Error ? error.message : 'Unknown error',
        message: 'Sorry, there was an error processing your order. Please try again later.'
      };
    }
  }
);

// Validate if the requested dish is available
async function validateDishAvailability(dishName: string) {
  console.log(`[ORDER MANAGER] Validating availability for ${dishName}`);
  
  // Get current inventory to check what dishes can be made
  const inventory = await inventoryTool({});
  const availableIngredients = inventory.filter(item => 
    item.available && item.quantity > 0
  );
  
  // Define dish requirements (simplified - in real system this would come from recipe database)
  const dishRequirements: Record<string, string[]> = {
    'Palak Paneer': ['Paneer', 'Spinach', 'Tomatoes', 'Cream', 'Spices'],
    'Paneer Butter Masala': ['Paneer', 'Tomatoes', 'Cream', 'Butter', 'Spices'],
    'Dal Tadka': ['Lentils', 'Onions', 'Tomatoes', 'Spices'],
    'Gobi Masala': ['Cauliflower', 'Onions', 'Tomatoes', 'Spices'],
    'Butter Chicken': ['Chicken', 'Tomatoes', 'Cream', 'Butter', 'Spices'],
    'Chicken Biryani': ['Chicken', 'Rice', 'Onions', 'Spices'],
    'Fish Curry': ['Fish', 'Coconut Milk', 'Onions', 'Spices'],
    'Lamb Curry': ['Lamb', 'Onions', 'Tomatoes', 'Spices'],
    'Samosas': ['Potatoes', 'Peas', 'Wheat', 'Oil', 'Spices'],
    'Aloo Paratha': ['Potatoes', 'Wheat', 'Oil', 'Spices'],
    'Naan': ['Wheat', 'Yogurt', 'Oil'],
    'Jeera Rice': ['Rice', 'Onions', 'Spices'],
    'Kheer': ['Milk', 'Sugar', 'Cardamom'],
    'Tiramisu': ['Mascarpone', 'Coffee', 'Ladyfingers', 'Eggs']
  };
  
  const requiredIngredients = dishRequirements[dishName];
  
  if (!requiredIngredients) {
    return {
      available: false,
      reason: 'Dish not in our menu',
      suggestion: 'Please check our menu for available dishes.',
      alternatives: Object.keys(dishRequirements)
    };
  }
  
  // Check if all required ingredients are available
  const missingIngredients = requiredIngredients.filter(ingredient => {
    const available = availableIngredients.find(item => 
      item.ingredient.toLowerCase().includes(ingredient.toLowerCase()) ||
      ingredient.toLowerCase().includes(item.ingredient.toLowerCase())
    );
    return !available || available.quantity === 0;
  });
  
  if (missingIngredients.length > 0) {
    return {
      available: false,
      reason: 'Missing ingredients',
      suggestion: 'Some ingredients are not available.',
      missingIngredients,
      alternatives: Object.keys(dishRequirements).filter(dish => 
        dish !== dishName && dishRequirements[dish].every(ingredient =>
          availableIngredients.some(item => 
            item.ingredient.toLowerCase().includes(ingredient.toLowerCase()) ||
            ingredient.toLowerCase().includes(item.ingredient.toLowerCase())
          )
        )
      )
    };
  }
  
  return {
    available: true,
    reason: 'All ingredients available',
    suggestion: 'Dish can be prepared.',
    missingIngredients: []
  };
}

// Check if there are sufficient ingredients for the dish
async function checkIngredientAvailability(dishName: string) {
  console.log(`[ORDER MANAGER] Checking ingredient availability for ${dishName}`);
  
  const inventory = await inventoryTool({});
  
  // Define minimum quantities needed for each dish
  const dishQuantities: Record<string, Record<string, number>> = {
    'Palak Paneer': { 'Paneer': 200, 'Spinach': 100, 'Tomatoes': 50, 'Cream': 30, 'Spices': 10 },
    'Paneer Butter Masala': { 'Paneer': 200, 'Tomatoes': 100, 'Cream': 50, 'Butter': 30, 'Spices': 15 },
    'Dal Tadka': { 'Lentils': 150, 'Onions': 50, 'Tomatoes': 30, 'Spices': 10 },
    'Gobi Masala': { 'Cauliflower': 200, 'Onions': 50, 'Tomatoes': 50, 'Spices': 15 },
    'Butter Chicken': { 'Chicken': 300, 'Tomatoes': 100, 'Cream': 50, 'Butter': 30, 'Spices': 15 },
    'Chicken Biryani': { 'Chicken': 250, 'Rice': 200, 'Onions': 100, 'Spices': 20 },
    'Fish Curry': { 'Fish': 300, 'Coconut Milk': 100, 'Onions': 50, 'Spices': 15 },
    'Lamb Curry': { 'Lamb': 300, 'Onions': 100, 'Tomatoes': 100, 'Spices': 20 },
    'Samosas': { 'Potatoes': 150, 'Peas': 50, 'Wheat': 100, 'Oil': 30, 'Spices': 10 },
    'Aloo Paratha': { 'Potatoes': 200, 'Wheat': 150, 'Oil': 20, 'Spices': 10 },
    'Naan': { 'Wheat': 200, 'Yogurt': 50, 'Oil': 15 },
    'Jeera Rice': { 'Rice': 200, 'Onions': 30, 'Spices': 10 },
    'Kheer': { 'Milk': 500, 'Sugar': 100, 'Cardamom': 5 },
    'Tiramisu': { 'Mascarpone': 200, 'Coffee': 50, 'Ladyfingers': 100, 'Eggs': 100 }
  };
  
  const requiredQuantities = dishQuantities[dishName];
  
  if (!requiredQuantities) {
    return {
      sufficient: false,
      reason: 'Dish requirements not defined',
      missingIngredients: [],
      alternatives: []
    };
  }
  
  // Check if quantities are sufficient
  const missingIngredients: string[] = [];
  
  for (const [ingredient, requiredQty] of Object.entries(requiredQuantities)) {
    const available = inventory.find(item => 
      item.ingredient.toLowerCase().includes(ingredient.toLowerCase()) ||
      ingredient.toLowerCase().includes(item.ingredient.toLowerCase())
    );
    
    if (!available || available.quantity < requiredQty) {
      missingIngredients.push(`${ingredient} (need ${requiredQty}g, have ${available?.quantity || 0}g)`);
    }
  }
  
  if (missingIngredients.length > 0) {
    return {
      sufficient: false,
      reason: 'Insufficient ingredient quantities',
      missingIngredients,
      alternatives: Object.keys(dishQuantities).filter(dish => 
        dish !== dishName && dishQuantities[dish] && 
        Object.entries(dishQuantities[dish]).every(([ingredient, requiredQty]) => {
          const available = inventory.find(item => 
            item.ingredient.toLowerCase().includes(ingredient.toLowerCase()) ||
            ingredient.toLowerCase().includes(item.ingredient.toLowerCase())
          );
          return available && available.quantity >= requiredQty;
        })
      )
    };
  }
  
  return {
    sufficient: true,
    reason: 'All ingredients available in sufficient quantities',
    missingIngredients: [],
    alternatives: []
  };
}
