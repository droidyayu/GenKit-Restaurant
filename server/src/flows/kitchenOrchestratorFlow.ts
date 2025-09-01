import { ai, z } from '../genkit.js';
import { createOrderTool, getOrderStatusTool } from '../tools/orderTool.js';
import { inventoryTool } from '../tools/inventoryTool.js';
import { orderManagerAgent } from '../agents/orderManagerAgent.js';
import { chefAgent } from '../agents/chefAgent.js';
import { waiterAgent } from '../agents/waiterAgent.js';
import { menuRecipeAgent } from '../agents/menuRecipeAgent.js';

export const kitchenOrchestratorFlow = ai.defineFlow(
  {
    name: 'kitchenOrchestratorFlow',
    inputSchema: z.object({
      userId: z.string().describe('User ID making the request'),
      message: z.string().describe('User message to process'),
    }),
  },
  async ({ userId, message }) => {
    console.log(`[ORCHESTRATOR] Processing request from user ${userId}: "${message}"`);
    
    try {
      // Classify user intent
      const intent = await classifyIntent(message);
      
      console.log(`[ORCHESTRATOR] Classified intent: ${intent.intent} (confidence: ${intent.confidence})`);
      
      // Route to appropriate agent/flow based on intent
      switch (intent.intent) {
        case 'AskMenu':
          return await handleMenuRequest(userId, message);
          
        case 'PlaceOrder':
          return await handlePlaceOrderRequest(userId, message, intent.extractedData);
          
        case 'CheckStatus':
          return await handleCheckStatusRequest(userId, message);
          
        case 'Fallback':
        default:
          return {
            success: false,
            intent: intent.intent,
            confidence: intent.confidence,
            message: 'I\'m sorry, I didn\'t understand that. You can ask me about our menu, place an order, or check your order status.',
            suggestions: [
              'Show me the menu',
              'I want to order [dish name]',
              'Where is my order?'
            ]
          };
      }
      
    } catch (error) {
      console.error(`[ORCHESTRATOR] Error processing request:`, error);
      
      return {
        success: false,
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error',
        message: 'Sorry, there was an error processing your request. Please try again.'
      };
    }
  }
);

// Intent classification function
async function classifyIntent(message: string) {
  const lowerMessage = message.toLowerCase();
  
  // Simple keyword-based intent classification
  if (lowerMessage.includes('menu') || lowerMessage.includes('what') && lowerMessage.includes('serve')) {
    return {
      intent: 'AskMenu',
      confidence: 0.9,
      extractedData: { requestType: 'menu_inquiry' }
    };
  }
  
  // Check for order requests - both explicit and implicit
  if (lowerMessage.includes('order') || lowerMessage.includes('take') || lowerMessage.includes('want') || 
      lowerMessage.includes('i\'ll have') || 
      (lowerMessage.includes('for') && lowerMessage.includes('person')) ||
      // Check if message contains dish names directly
      lowerMessage.includes('palak') || lowerMessage.includes('paneer') || 
      lowerMessage.includes('butter') || lowerMessage.includes('chicken') ||
      lowerMessage.includes('dal') || lowerMessage.includes('gobi') ||
      lowerMessage.includes('samosa') || lowerMessage.includes('biryani') ||
      lowerMessage.includes('fish') || lowerMessage.includes('lamb') ||
      lowerMessage.includes('paratha') || lowerMessage.includes('naan') ||
      lowerMessage.includes('rice') || lowerMessage.includes('kheer')) {
    
    // Extract dish name from the message
    let foundDish = 'unknown';
    
    // Define common dish names to look for (including variations)
    const dishNames = [
      'Palak Paneer', 'Paneer Butter Masala', 'Paneer Tikka', 'Dal Tadka', 'Gobi Masala',
      'Mixed Vegetable Curry', 'Samosas', 'Butter Chicken', 'Chicken Biryani',
      'Fish Curry', 'Lamb Curry', 'Aloo Paratha', 'Naan', 'Jeera Rice', 'Kheer'
    ];
    
    // Look for exact matches first
    for (const dish of dishNames) {
      if (lowerMessage.includes(dish.toLowerCase())) {
        foundDish = dish;
        break;
      }
    }
    
    // If no exact match, try partial matching with priority
    if (foundDish === 'unknown') {
      // Check for "Paneer Tikka" specifically (common request)
      if (lowerMessage.includes('paneer') && lowerMessage.includes('tikka')) {
        foundDish = 'Paneer Tikka';
      }
      // Check for other partial matches
      else {
        for (const dish of dishNames) {
          const dishWords = dish.toLowerCase().split(' ');
          if (dishWords.some((word: string) => lowerMessage.includes(word))) {
            foundDish = dish;
            break;
          }
        }
      }
    }
    
    return {
      intent: 'PlaceOrder',
      confidence: 0.8,
      extractedData: { 
        requestType: 'order_placement',
        dishName: foundDish,
        originalMessage: message
      }
    };
  }
  
  if (lowerMessage.includes('status') || lowerMessage.includes('where') || lowerMessage.includes('ready') || lowerMessage.includes('done')) {
    return {
      intent: 'CheckStatus',
      confidence: 0.75,
      extractedData: { requestType: 'status_inquiry' }
    };
  }
  
  return {
    intent: 'Fallback',
    confidence: 0.1,
    extractedData: { requestType: 'unknown' }
  };
}

// Handle menu requests
async function handleMenuRequest(userId: string, message: string) {
  console.log(`[ORCHESTRATOR] Routing to Menu Recipe Agent for menu request`);
  
  const result = await menuRecipeAgent({
    userId,
    requestType: 'menu_generation'
  });
  
  if (result.success) {
    // Format the menu for display
    const menuItems = result.menuDisplay || 'Menu generated successfully';
    
    return {
      success: true,
      intent: 'AskMenu',
      action: 'menu_displayed',
      userId,
      message: result.message,
      menu: result.menuDisplay,
      menuDisplay: `Available Dishes:\n${menuItems}`,
      totalAvailable: result.totalAvailable,
      note: 'Menu is generated dynamically based on current ingredient availability'
    };
  } else {
    return {
      success: false,
      intent: 'AskMenu',
      error: 'Failed to generate menu',
      message: result.message || 'Sorry, I couldn\'t generate the menu right now. Please try again later.'
    };
  }
}



// Handle place order requests with proper agent orchestration
async function handlePlaceOrderRequest(userId: string, message: string, extractedData: any) {
  console.log(`[ORCHESTRATOR] Routing to Order Manager for order placement`);
  
  const dishName = extractedData?.dishName || 'unknown';
  
  if (dishName === 'unknown') {
    return {
      success: false,
      intent: 'PlaceOrder',
      error: 'Dish not specified',
      message: 'Please specify which dish you would like to order. For example: "I want to order Palak Paneer"'
    };
  }
  
  // Extract quantity from message if specified
  let quantity = 1;
  const quantityMatch = message.match(/(\d+)\s*(?:person|people|serving|order)/i);
  if (quantityMatch) {
    quantity = parseInt(quantityMatch[1]);
  }
  
  console.log(`[ORCHESTRATOR] Processing order for ${quantity}x ${dishName}`);
  
  // Step 1: Order Manager creates the order
  const orderResult = await orderManagerAgent({
    userId,
    dish: dishName,
    quantity: quantity
  });
  
  if (!orderResult.success) {
    return {
      success: false,
      intent: 'PlaceOrder',
      error: 'Order creation failed',
      message: orderResult.message || 'Sorry, there was an error creating your order.'
    };
  }
  
  // Step 2: Chef Agent starts cooking
  console.log(`[ORCHESTRATOR] Order created, routing to Chef Agent for cooking`);
  const chefResult = await chefAgent({
    orderId: orderResult.orderId,
    dishName: dishName,
    userId
  });
  
  if (!chefResult.success) {
    return {
      success: false,
      intent: 'PlaceOrder',
      error: 'Cooking failed',
      message: chefResult.message || 'Sorry, there was an error starting the cooking process.'
    };
  }
  
  return {
    success: true,
    intent: 'PlaceOrder',
    action: 'order_created_and_cooking',
    userId,
    orderId: orderResult.orderId,
    dishName: dishName,
    quantity: quantity,
    message: `Order placed successfully! Your ${quantity}x ${dishName} is now being cooked and will be ready in approximately 15-20 minutes.`,
    nextStep: 'Chef is cooking your order',
    estimatedTime: '15-20 minutes',
    cookingStatus: chefResult.status
  };
}

// Handle status requests
async function handleCheckStatusRequest(userId: string, message: string) {
  console.log(`[ORCHESTRATOR] Routing to Waiter Agent for status check`);
  
  // Extract order ID from message if present, otherwise assume current order
  const orderIdMatch = message.match(/ORD_(\d+)/);
  const orderId = orderIdMatch ? orderIdMatch[0] : undefined;
  
  const result = await waiterAgent({
    userId,
    orderId,
    action: 'checkStatus'
  });
  
  if (result.success) {
      return {
        success: true,
        intent: 'CheckStatus',
        action: 'status_provided',
        userId,
        status: 'status_checked',
        estimatedTime: '15-20 minutes',
        progress: 100,
        message: result.message
      };
  } else {
    return {
      success: false,
      intent: 'CheckStatus',
      error: 'Failed to get order status',
      message: result.message || 'Sorry, I couldn\'t retrieve your order status right now.'
    };
  }
}
