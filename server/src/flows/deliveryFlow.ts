import { ai, z } from '../genkit.js';
import { notificationTool } from '../tools/notificationTool.js';

export const deliveryFlow = ai.defineFlow(
  {
    name: 'deliveryFlow',
    inputSchema: z.object({
      orderId: z.string().describe('Order ID to deliver'),
      userId: z.string().describe('User ID to deliver to'),
      dishName: z.string().describe('Name of the dish being delivered'),
    }),
  },
  async ({ orderId, userId, dishName }) => {
    console.log(`[DELIVERY FLOW] Starting delivery for ${dishName} to user ${userId}`);
    
    try {
      // Send delivery notification
      const deliveryNotification = await notificationTool({
        userId,
        title: 'Your order is ready! 🍽️',
        body: `Your ${dishName} has been delivered. Enjoy your meal!`,
        data: {
          orderId,
          dishName,
          status: 'delivered',
          timestamp: new Date().toISOString()
        },
        priority: 'high'
      });
      
      console.log(`[DELIVERY FLOW] Delivery notification sent for ${dishName}`);
      
      // Simulate delivery process (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log(`[DELIVERY FLOW] Delivery completed for ${dishName}`);
      
      return {
        success: true,
        orderId,
        userId,
        dishName,
        status: 'delivered',
        notificationSent: deliveryNotification.success,
        message: `Successfully delivered ${dishName} to user ${userId}`,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`[DELIVERY FLOW] Error delivering ${dishName}:`, error);
      
      return {
        success: false,
        orderId,
        userId,
        dishName,
        error: 'Failed to complete delivery',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
);
