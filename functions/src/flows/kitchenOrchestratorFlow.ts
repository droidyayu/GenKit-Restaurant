import {ai, z} from "../genkit";
import {orderManagerAgent} from "../agents/orderManagerAgent";
import {chefAgent} from "../agents/chefAgent";
import {waiterAgent} from "../agents/waiterAgent";
import {menuRecipeAgent} from "../agents/menuRecipeAgent";
import {getConversationHistory, addConversationMessage, ConversationMessage} from "../data/conversationHistory";

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
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`[FLOW] ${requestId} | User: ${userId} | Message: "${message}"`);

    try {
      // Get conversation history
      const history = await getConversationHistory(userId, 10);

      // Add user message to conversation history
      await addConversationMessage(userId, "user", message, {
        timestamp: new Date().toISOString(),
        requestId,
        step: "user_input",
      });

      // Format conversation history for AI context
      const historyContext = history.length > 0 ?
        `\n\nPrevious conversation context:\n${history
          .slice(-10) // Last 10 messages
          .map((msg: ConversationMessage) => `${msg.role}: ${msg.content}`)
          .join("\n")}` :
        "";

      // Use AI to understand intent
      const {text} = await ai.generate({
        prompt: "You are the Kitchen Orchestrator at Bollywood Grill restaurant. " +
          `Your job is to understand customer requests and provide helpful responses.

Available services:
1. Menu inquiries - For showing available dishes, asking what's on the menu
2. Order placement - For placing orders, ordering food, requesting specific dishes  
3. Status checks - For checking order status, asking where food is, order progress

Customer message: "${message}"${historyContext}

Analyze the customer's intent and respond appropriately. If they want to:
- See the menu → Tell them you'll get the menu and then call the menu agent
- Order food → Extract the dish name and quantity, then tell them you'll process their order
- Check order status → Tell them you'll check the status

Consider the conversation history when responding. If the user is following up on a previous request, ` +
              `acknowledge that context.

Respond naturally as if you're a helpful restaurant staff member. Be conversational and helpful.

After your initial response, I will route the request to the appropriate agent based on your analysis.`,
      });

      // Route to appropriate agent based on AI analysis
      const lowerMessage = message.toLowerCase();

      if (lowerMessage.includes("menu") || lowerMessage.includes("what") || lowerMessage.includes("serve")) {
        console.log(`[FLOW] ${requestId} | Routing to Menu Agent`);

        // Handle menu request
        const result = await menuRecipeAgent({
          userId,
          requestType: "menu_generation",
          conversationHistory: history, // Pass history to agent
        });

        if (result.success) {
          const responseMessage = `${text}\n\n${result.menuDisplay}`;

          // Add assistant response to conversation history
          await addConversationMessage(userId, "assistant", responseMessage, {
            intent: "AskMenu",
            timestamp: new Date().toISOString(),
            requestId,
            step: "menu_response",
            agent: "menuRecipeAgent",
          });

          console.log(`[FLOW] ${requestId} | Menu request completed | Intent: AskMenu`);

          return {
            success: true,
            intent: "AskMenu",
            message: responseMessage,
            userId,
            timestamp: new Date().toISOString(),
            requestId,
          };
        } else {
          const errorMessage = `${text}\n\nSorry, I couldn't generate the menu right now. Please try again later.`;

          await addConversationMessage(userId, "assistant", errorMessage, {
            intent: "AskMenu",
            error: true,
            timestamp: new Date().toISOString(),
            requestId,
            step: "menu_error",
            agent: "menuRecipeAgent",
          });

          console.log(`[FLOW] ${requestId} | Menu request failed | Intent: AskMenu | Error: ${result.error}`);

          return {
            success: false,
            intent: "AskMenu",
            message: errorMessage,
            userId,
            timestamp: new Date().toISOString(),
            requestId,
            error: result.error,
          };
        }
      } else if (containsFoodKeywords(lowerMessage)) {
        console.log(`[FLOW] ${requestId} | Routing to Order Manager Agent`);

        // Handle order request
        const result = await orderManagerAgent({
          userId,
          dish: "Palak Paneer", // This will be extracted by AI in the future
          quantity: 1,
          conversationHistory: history, // Pass history to agent
        });

        if (result.success) {
          console.log(`[FLOW] ${requestId} | Order created, routing to Chef Agent | Order ID: ${result.orderId}`);

          // Start cooking process
          const chefResult = await chefAgent({
            orderId: result.orderId,
            dishName: result.dish as string,
            userId: result.userId || userId,
            conversationHistory: history, // Pass history to agent
          });

          if (chefResult.success) {
            const successMessage = `${text}\n\nOrder placed successfully! Your ${result.dish} is now being cooked ` +
              `and will be ready in approximately 15-20 minutes. Order ID: ${result.orderId}`;

            await addConversationMessage(userId, "assistant", successMessage, {
              intent: "PlaceOrder",
              orderId: result.orderId,
              dishName: result.dish,
              timestamp: new Date().toISOString(),
              requestId,
              step: "order_success",
              agent: "orderManagerAgent",
              chefAgent: "chefAgent",
            });

            console.log(`[FLOW] ${requestId} | Order completed successfully | Intent: PlaceOrder | ` +
              `Order ID: ${result.orderId}`);

            return {
              success: true,
              intent: "PlaceOrder",
              message: successMessage,
              userId,
              orderId: result.orderId,
              timestamp: new Date().toISOString(),
              requestId,
            };
          } else {
            const errorMessage = `${text}\n\nOrder created but cooking failed: ${chefResult.message}`;

            await addConversationMessage(userId, "assistant", errorMessage, {
              intent: "PlaceOrder",
              error: true,
              orderId: result.orderId,
              timestamp: new Date().toISOString(),
              requestId,
              step: "cooking_failure",
              agent: "orderManagerAgent",
              chefAgent: "chefAgent",
            });

            console.log(`[FLOW] ${requestId} | Order created but cooking failed | Intent: PlaceOrder | ` +
              `Order ID: ${result.orderId} | Chef Error: ${chefResult.message}`);

            return {
              success: false,
              intent: "PlaceOrder",
              message: errorMessage,
              userId,
              timestamp: new Date().toISOString(),
              requestId,
              error: "Cooking process failed",
              chefError: chefResult.message,
            };
          }
        } else {
          const errorMessage = `${text}\n\nFailed to place order: ${result.message}`;

          await addConversationMessage(userId, "assistant", errorMessage, {
            intent: "PlaceOrder",
            error: true,
            timestamp: new Date().toISOString(),
            requestId,
            step: "order_failure",
            agent: "orderManagerAgent",
          });

          console.log(`[FLOW] ${requestId} | Order request failed | Intent: PlaceOrder | Error: ${result.message}`);

          return {
            success: false,
            intent: "PlaceOrder",
            message: errorMessage,
            userId,
            timestamp: new Date().toISOString(),
            requestId,
            error: result.message,
          };
        }
      } else if (lowerMessage.includes("status") || lowerMessage.includes("where") ||
                 lowerMessage.includes("ready") || lowerMessage.includes("done")) {
        console.log(`[FLOW] ${requestId} | Routing to Waiter Agent for status check`);

        // Handle status request
        const result = await waiterAgent({
          userId,
          action: "checkStatus",
          conversationHistory: history, // Pass history to agent
        });

        if (result.success) {
          const responseMessage = `${text}\n\n${result.message}`;

          await addConversationMessage(userId, "assistant", responseMessage, {
            intent: "CheckStatus",
            timestamp: new Date().toISOString(),
            requestId,
            step: "status_response",
            agent: "waiterAgent",
          });

          console.log(`[FLOW] ${requestId} | Status check completed | Intent: CheckStatus`);

          return {
            success: true,
            intent: "CheckStatus",
            message: responseMessage,
            userId,
            timestamp: new Date().toISOString(),
            requestId,
          };
        } else {
          const errorMessage = `${text}\n\nFailed to check status: ${result.message}`;

          await addConversationMessage(userId, "assistant", errorMessage, {
            intent: "CheckStatus",
            error: true,
            timestamp: new Date().toISOString(),
            requestId,
            step: "status_error",
            agent: "waiterAgent",
          });

          console.log(`[FLOW] ${requestId} | Status check failed | Intent: CheckStatus | Error: ${result.message}`);

          return {
            success: false,
            intent: "CheckStatus",
            message: errorMessage,
            userId,
            timestamp: new Date().toISOString(),
            requestId,
            error: result.message,
          };
        }
      } else {
        console.log(`[FLOW] ${requestId} | No specific route matched, using fallback response`);

        // Fallback response
        const fallbackMessage = `${text}\n\nI'm here to help! You can ask me about our menu, place an order, ` +
          "or check your order status.";

        await addConversationMessage(userId, "assistant", fallbackMessage, {
          intent: "Fallback",
          timestamp: new Date().toISOString(),
          requestId,
          step: "fallback_response",
          agent: "orchestrator",
        });

        console.log(`[FLOW] ${requestId} | Fallback response completed | Intent: Fallback`);

        return {
          success: true,
          intent: "Fallback",
          message: fallbackMessage,
          userId,
          timestamp: new Date().toISOString(),
          requestId,
        };
      }
    } catch (error) {
      console.error(`[FLOW_ERROR] ${requestId} | Critical error in flow:`, error);

      const errorMessage = "Sorry, there was an error processing your request. Please try again.";

      await addConversationMessage(userId, "assistant", errorMessage, {
        intent: "Error",
        error: true,
        timestamp: new Date().toISOString(),
        requestId,
        step: "critical_error",
        agent: "orchestrator",
        errorDetails: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
        message: errorMessage,
        requestId,
        timestamp: new Date().toISOString(),
      };
    }
  }
);
