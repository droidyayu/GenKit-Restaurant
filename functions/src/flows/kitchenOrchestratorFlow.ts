import {ai, z} from "../genkit";
import {orderManagerAgent} from "../agents/orderManagerAgent";
import {chefAgent} from "../agents/chefAgent";
import {waiterAgent} from "../agents/waiterAgent";
import {menuRecipeAgent} from "../agents/menuRecipeAgent";

// Helper function to check if message contains food-related keywords
function containsFoodKeywords(message: string): boolean {
  const foodKeywords = [
    "order", "want", "take", "i'll have", "palak", "paneer", "butter", "chicken",
    "dal", "gobi", "samosa", "biryani", "fish", "lamb", "paratha", "naan", "rice", "kheer",
  ];
  return foodKeywords.some((keyword) => message.includes(keyword));
}

export const kitchenOrchestratorFlow = ai.defineFlow(
  {
    name: "kitchenOrchestratorFlow",
    inputSchema: z.object({
      userId: z.string().describe("User ID making the request"),
      message: z.string().describe("User message to process"),
    }),
  },
  async ({userId, message}) => {
    console.log(`[ORCHESTRATOR] Processing request from user ${userId}: "${message}"`);

    try {
      // Use AI to understand intent and route to appropriate agent
      const {text} = await ai.generate({
        prompt: "You are the Kitchen Orchestrator at Indian Grill restaurant. " +
          `Your job is to understand customer requests and provide helpful responses.

Available services:
1. Menu inquiries - For showing available dishes, asking what's on the menu
2. Order placement - For placing orders, ordering food, requesting specific dishes  
3. Status checks - For checking order status, asking where food is, order progress

Customer message: "${message}"

Analyze the customer's intent and respond appropriately. If they want to:
- See the menu → Tell them you'll get the menu and then call the menu agent
- Order food → Extract the dish name and quantity, then tell them you'll process their order
- Check order status → Tell them you'll check the status

Respond naturally as if you're a helpful restaurant staff member. Be conversational and helpful.

After your initial response, I will route the request to the appropriate agent based on your analysis.`,
      });

      // Route to appropriate agent based on AI analysis
      const lowerMessage = message.toLowerCase();

      if (lowerMessage.includes("menu") || lowerMessage.includes("what") || lowerMessage.includes("serve")) {
        // Handle menu request
        const result = await menuRecipeAgent({
          userId,
          requestType: "menu_generation",
        });

        if (result.success) {
          return {
            success: true,
            intent: "AskMenu",
            message: `${text}\n\n${result.menuDisplay}`,
            userId,
            timestamp: new Date().toISOString(),
          };
        } else {
          return {
            success: false,
            intent: "AskMenu",
            message: `${text}\n\nSorry, I couldn't generate the menu right now. Please try again later.`,
            userId,
            timestamp: new Date().toISOString(),
          };
        }
      } else if (containsFoodKeywords(lowerMessage)) {
        // Handle order request
        const result = await orderManagerAgent({
          userId,
          dish: "Palak Paneer", // This will be extracted by AI in the future
          quantity: 1,
        });

        if (result.success) {
          // Start cooking process
          const chefResult = await chefAgent({
            orderId: result.orderId,
            dishName: result.dish as string,
            userId: result.userId || userId,
          });

          if (chefResult.success) {
            return {
              success: true,
              intent: "PlaceOrder",
              message: `${text}\n\nOrder placed successfully! Your ${result.dish} is now being cooked ` +
                `and will be ready in approximately 15-20 minutes. Order ID: ${result.orderId}`,
              userId,
              orderId: result.orderId,
              timestamp: new Date().toISOString(),
            };
          } else {
            return {
              success: false,
              intent: "PlaceOrder",
              message: `${text}\n\nOrder created but cooking failed: ${chefResult.message}`,
              userId,
              timestamp: new Date().toISOString(),
            };
          }
        } else {
          return {
            success: false,
            intent: "PlaceOrder",
            message: `${text}\n\nFailed to place order: ${result.message}`,
            userId,
            timestamp: new Date().toISOString(),
          };
        }
      } else if (lowerMessage.includes("status") || lowerMessage.includes("where") ||
                 lowerMessage.includes("ready") || lowerMessage.includes("done")) {
        // Handle status request
        const result = await waiterAgent({
          userId,
          action: "checkStatus",
        });

        if (result.success) {
          return {
            success: true,
            intent: "CheckStatus",
            message: `${text}\n\n${result.message}`,
            userId,
            timestamp: new Date().toISOString(),
          };
        } else {
          return {
            success: false,
            intent: "CheckStatus",
            message: `${text}\n\nFailed to check status: ${result.message}`,
            userId,
            timestamp: new Date().toISOString(),
          };
        }
      } else {
        // Fallback response
        return {
          success: true,
          intent: "Fallback",
          message: `${text}\n\nI'm here to help! You can ask me about our menu, place an order, ` +
            "or check your order status.",
          userId,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error("[ORCHESTRATOR] Error processing request:", error);

      return {
        success: false,
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
        message: "Sorry, there was an error processing your request. Please try again.",
      };
    }
  }
);
