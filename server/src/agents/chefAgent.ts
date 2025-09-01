import { ai, z } from '../genkit.js';
import { timerTool, inventoryTool, updateOrderStatusTool } from '../tools/index.js';
import { cookingFlow } from '../flows/cookingFlow.js';

export const chefAgent = ai.defineFlow(
  {
    name: 'chefAgent',
    inputSchema: z.object({
      orderId: z.string().describe('Order ID to cook'),
      dishName: z.string().describe('Name of the dish to cook'),
      userId: z.string().describe('User ID who placed the order'),
      specialInstructions: z.string().optional().describe('Any special cooking instructions'),
    }),
  },
  async ({ orderId, dishName, userId, specialInstructions }: {
    orderId: string;
    dishName: string;
    userId: string;
    specialInstructions?: string;
  }) => {
    console.log(`[CHEF AGENT] Starting cooking for order ${orderId}: ${dishName}`);
    
    try {
      // Step 1: Check inventory for required ingredients
      const inventoryCheck = await checkRequiredIngredients(dishName);
      
      if (!inventoryCheck.sufficient) {
        // Cannot update status for failed order - just return error
        return {
          success: false,
          orderId,
          dishName,
          userId,
          error: 'Insufficient ingredients',
          reason: inventoryCheck.reason,
          missingIngredients: inventoryCheck.missingIngredients,
          message: `Sorry, I cannot cook ${dishName} due to missing ingredients.`
        };
      }
      
      // Step 2: Update order status to cooking
      await updateOrderStatusTool({
        status: 'COOKING',
        message: `Chef is now cooking your ${dishName}`
      });
      
      console.log(`[CHEF AGENT] Order ${orderId} status updated to cooking`);
      
      // Step 3: Execute cooking flow with accelerated time
      const cookingResult = await cookingFlow({
        orderId,
        dishName,
        userId
      });
      
      if (!cookingResult.success) {
        // Cannot update status for failed cooking - just return error
        return {
          success: false,
          orderId,
          dishName,
          userId,
          error: 'Cooking failed',
          details: cookingResult.error,
          message: `Sorry, there was an error cooking your ${dishName}.`
        };
      }
      
      // Step 4: Update order status to ready
      await updateOrderStatusTool({
        status: 'READY',
        message: `Your ${dishName} is ready for delivery!`
      });
      
      console.log(`[CHEF AGENT] Order ${orderId} completed successfully`);
      
      // Step 5: Return cooking completion
      return {
        success: true,
        orderId,
        dishName,
        userId,
        action: 'cooking_completed',
        status: 'ready',
        totalCookTime: cookingResult.totalCookTime,
        phases: cookingResult.phases,
        message: `Successfully cooked ${dishName} in ${cookingResult.totalCookTime} minutes`,
        nextStep: 'Order ready for delivery by Waiter Agent',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`[CHEF AGENT] Error cooking ${dishName}:`, error);
      
      // Cannot update status for failed cooking - just log error
      console.error(`[CHEF AGENT] Failed to update order status:`, error);
      
      return {
        success: false,
        orderId,
        dishName,
        userId,
        error: 'Cooking process failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        message: `Sorry, there was an error cooking your ${dishName}. Please try again later.`
      };
    }
  }
);

// Check if required ingredients are available for cooking
async function checkRequiredIngredients(dishName: string) {
  console.log(`[CHEF AGENT] Checking ingredients for ${dishName}`);
  
  const inventory = await inventoryTool({});
  
  // Define ingredient requirements for each dish
  const dishIngredients: Record<string, Record<string, number>> = {
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
  
  const requiredIngredients = dishIngredients[dishName];
  
  if (!requiredIngredients) {
    return {
      sufficient: false,
      reason: 'Dish not in our recipe database',
      missingIngredients: ['Recipe not found']
    };
  }
  
  // Check ingredient availability and quantities
  const missingIngredients: string[] = [];
  
  for (const [ingredient, requiredQty] of Object.entries(requiredIngredients)) {
    const available = inventory.find((item: any) => 
      item.ingredient.toLowerCase().includes(ingredient.toLowerCase()) ||
      ingredient.toLowerCase().includes(item.ingredient.toLowerCase())
    );
    
    if (!available || available.quantity < requiredQty) {
      const currentQty = available?.quantity || 0;
      missingIngredients.push(`${ingredient} (need ${requiredQty}g, have ${currentQty}g)`);
    }
  }
  
  if (missingIngredients.length > 0) {
    return {
      sufficient: false,
      reason: 'Insufficient ingredients for cooking',
      missingIngredients
    };
  }
  
  return {
    sufficient: true,
    reason: 'All ingredients available in sufficient quantities',
    missingIngredients: []
  };
}
