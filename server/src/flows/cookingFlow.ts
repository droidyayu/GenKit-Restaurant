import { ai, z } from '../genkit.js';
import { timerTool } from '../tools/index.js';

export const cookingFlow = ai.defineFlow(
  {
    name: 'cookingFlow',
    inputSchema: z.object({
      orderId: z.string().describe('Order ID being cooked'),
      dishName: z.string().describe('Name of the dish to cook'),
      userId: z.string().describe('User ID who placed the order'),
    }),
  },
  async ({ orderId, dishName, userId }: {
    orderId: string;
    dishName: string;
    userId: string;
  }) => {
    console.log(`[COOKING FLOW] Starting cooking process for ${dishName} (Order: ${orderId})`);
    
    try {
      // Phase 1: Preparation (3 minutes)
      console.log(`[COOKING FLOW] Phase 1: Preparation`);
      const prepResult = await timerTool({
        phase: 'prep',
        duration: 3,
        message: `Preparing ingredients for ${dishName}`
      });
      
      // Phase 2: Cooking (8 minutes)
      console.log(`[COOKING FLOW] Phase 2: Cooking`);
      const cookingResult = await timerTool({
        phase: 'cooking',
        duration: 8,
        message: `Cooking ${dishName} with proper spices and techniques`
      });
      
      // Phase 3: Plating (2 minutes)
      console.log(`[COOKING FLOW] Phase 3: Plating`);
      const platingResult = await timerTool({
        phase: 'plating',
        duration: 2,
        message: `Plating ${dishName} with garnishes and final touches`
      });
      
      const totalCookTime = 3 + 8 + 2; // 13 minutes total
      
      console.log(`[COOKING FLOW] Cooking completed for ${dishName} in ${totalCookTime} minutes`);
      
      return {
        success: true,
        orderId,
        dishName,
        userId,
        totalCookTime,
        phases: [
          { name: 'prep', duration: 3, completed: true },
          { name: 'cooking', duration: 8, completed: true },
          { name: 'plating', duration: 2, completed: true }
        ],
        status: 'ready',
        message: `Successfully cooked ${dishName} in ${totalCookTime} minutes`,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`[COOKING FLOW] Error cooking ${dishName}:`, error);
      
      return {
        success: false,
        orderId,
        dishName,
        userId,
        error: 'Failed to complete cooking process',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
);
