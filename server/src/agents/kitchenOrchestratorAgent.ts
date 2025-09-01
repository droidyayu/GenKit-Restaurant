import { ai, z } from '../genkit.js';
import { availableDishesFlow } from '../flows/availableDishesFlow.js';
import { createOrderTool, getOrderStatusTool } from '../tools/orderTool.js';
import { inventoryTool } from '../tools/inventoryTool.js';

export const kitchenOrchestratorAgent = ai.defineFlow(
  {
    name: 'kitchenOrchestratorAgent',
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
          
        case 'AskAvailableDishes':
          return await handleAvailableDishesRequest(userId, message);
          
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
              'What dishes can you make?',
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
  
  if (lowerMessage.includes('available') || lowerMessage.includes('can') && lowerMessage.includes('make')) {
    return {
      intent: 'AskAvailableDishes',
      confidence: 0.85,
      extractedData: { requestType: 'availability_check' }
    };
  }
  
  if (lowerMessage.includes('order') || lowerMessage.includes('take') || lowerMessage.includes('want') || lowerMessage.includes('i\'ll have')) {
    // Extract dish name if possible
    const dishKeywords = ['spaghetti', 'pizza', 'salad', 'pasta', 'carbonara', 'caesar', 'margherita', 'paneer', 'chicken', 'lamb', 'fish'];
    const foundDish = dishKeywords.find(dish => lowerMessage.includes(dish));
    
    return {
      intent: 'PlaceOrder',
      confidence: 0.8,
      extractedData: { 
        requestType: 'order_placement',
        dishName: foundDish || 'unknown',
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
  console.log(`[ORCHESTRATOR] Routing to Available Dishes Flow for menu request`);
  
  const result = await availableDishesFlow({});
  
  if (result.success) {
    return {
      success: true,
      intent: 'AskMenu',
      action: 'menu_displayed',
      userId,
      message: 'Here\'s our current menu based on available ingredients:',
      menu: result.feasibleDishes,
      totalAvailable: result.totalAvailable,
      note: 'Menu is generated dynamically based on current ingredient availability'
    };
  } else {
    return {
      success: false,
      intent: 'AskMenu',
      error: 'Failed to generate menu',
      message: 'Sorry, I couldn\'t generate the menu right now. Please try again later.'
    };
  }
}

// Handle available dishes requests
async function handleAvailableDishesRequest(userId: string, message: string) {
  console.log(`[ORCHESTRATOR] Routing to Available Dishes Flow for availability check`);
  
  const result = await availableDishesFlow({});
  
  if (result.success) {
    return {
      success: true,
      intent: 'AskAvailableDishes',
      action: 'availability_checked',
      userId,
      message: 'Here\'s what we can make for you today:',
      availableDishes: result.feasibleDishes,
      totalAvailable: result.totalAvailable,
      note: 'Dishes are filtered based on current ingredient availability'
    };
  } else {
    return {
      success: false,
      intent: 'AskAvailableDishes',
      error: 'Failed to check availability',
      message: 'Sorry, I couldn\'t check dish availability right now. Please try again later.'
    };
  }
}

// Handle place order requests
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
  
  // Create the order
  const order = await createOrderTool({
    dishes: [{ name: dishName, quantity: 1 }],
    customerName: `User ${userId}`
  });
  
  return {
    success: true,
    intent: 'PlaceOrder',
    action: 'order_created',
    userId,
    orderId: order.orderId,
    dishName: dishName,
    message: `Order placed successfully! Your ${dishName} will be ready in approximately 15-20 minutes.`,
    nextStep: 'Order sent to Chef Agent for cooking',
    estimatedTime: '15-20 minutes'
  };
}

// Handle check status requests
async function handleCheckStatusRequest(userId: string, message: string) {
  console.log(`[ORCHESTRATOR] Routing to Waiter Agent for status check`);
  
  const status = await getOrderStatusTool({});
  
  if (status.status === 'NO_ACTIVE_ORDER') {
    return {
      success: true,
      intent: 'CheckStatus',
      action: 'status_checked',
      userId,
      message: 'You have no active orders at the moment. Would you like to see our menu or place an order?',
      status: 'no_orders'
    };
  } else {
    return {
      success: true,
      intent: 'CheckStatus',
      action: 'status_checked',
      userId,
      orderId: status.orderId,
      status: status.status,
      message: status.message,
      estimatedTime: status.estimatedTime,
      progress: status.progress
    };
  }
}
