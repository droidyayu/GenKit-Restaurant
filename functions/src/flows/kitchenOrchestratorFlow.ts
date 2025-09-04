import {ai, z} from "../genkit";
import {getConversationHistory, addConversationMessage} from "../data/conversationHistory";
import {orderManagerAgent} from "../agents/orderManagerAgent";
import {menuRecipeAgent} from "../agents/menuRecipeAgent";
import {waiterAgent} from "../agents/waiterAgent";

// Define the triage agent that handles initial routing
const triageAgent = ai.definePrompt({
  name: "triageAgent",
  description: "Triage Agent for Indian Restaurant - routes to specialist agents",
  tools: [menuRecipeAgent, orderManagerAgent, waiterAgent],
  system: `You are an AI customer service agent for an Indian restaurant.

Greet customers warmly and determine how you can help them.
CRITICAL: You MUST use the available specialist agents to handle customer requests - NEVER respond directly yourself.

Available specialists:
1. menuRecipeAgent - For menu exploration, dish suggestions, availability checking, and recipe information
2. orderManagerAgent - For placing orders, collecting order details, and managing the ordering process
3. waiterAgent - For order status inquiries, delivery updates, and customer service follow-ups

TOOL USAGE RULES:
- Use menuRecipeAgent for ANY menu-related requests (show menu, suggestions, dietary options, etc.)
- Use orderManagerAgent for ANY order-related requests (ordering, quantities, spice levels, confirmations)
- Use waiterAgent for ANY status/delivery inquiries (order status, where's my food, how long, etc.)
- Do NOT summarize or paraphrase - use the appropriate specialist immediately
- If the request involves ordering food → USE orderManagerAgent
- If the request involves confirming an order → USE orderManagerAgent
- If the request involves checking status → USE waiterAgent
- If the request involves menu exploration → USE menuRecipeAgent

CRITICAL SPECIALIST ROUTING PATTERNS:

🎯 MENU INTENT - Use menuRecipeAgent when customer:
- Asks to see the menu ("Show me the menu", "What's on the menu?")
- Asks what you have ("What do you have?", "What are your options?")
- Asks for suggestions ("Suggest something", "What's good?", "Surprise me")
- Asks about dietary options ("What's vegetarian?", "Do you have vegan options?", "I am vegan")
- Asks about specific dishes without ordering ("Tell me about aloo paratha", "What's in butter chicken?")
- Asks about specials ("What's special today?", "Today's specials?")
- General food interest ("I'm hungry", "I want to eat")
- Dietary preferences ("I am vegan", "I need gluten-free", "vegetarian options")

🛒 ORDER INTENT - Use orderManagerAgent when customer says ANYTHING related to ordering:
- "I want to order", "order butter chicken", "get me palak paneer", "I'd like naan"
- Any mention of food items with ordering intent
- Quantity specifications: "2 pieces", "for 2 people", "one serving"
- Spice level requests: "hot", "mild", "medium", "extra hot"
- Confirmations: "yes", "correct", "confirmed", "ok", "that's right"
- ANY follow-up to ordering conversation
- If in doubt, use orderManagerAgent

👨‍🍳 WAITER INTENT - Use waiterAgent when customer asks about status or delivery:
- "Where's my order?", "How long will it take?", "Ready yet?"
- "What's the status of my order?", "When will my food be here?"
- "Is my order ready?", "How much longer?", "Delivery status"
- "What's taking so long?", "I'm waiting for my food"
- "Can you check on my order?", "Update on my order"
- Any follow-up questions about existing orders (not placing new ones)

CRITICAL USERID CONTEXT:
- When calling orderManagerAgent, ALWAYS include the userId in the request
- When calling waiterAgent, ALWAYS include the userId in the request
- Format: "User ID: [userId]\n\n[Customer's actual request]"
- Example: "User ID: user123\n\nI want 2 butter chicken medium spicy"
- Example: "User ID: user123\n\nWhere's my order?"
- This ensures agents can access the correct customer data

Response style:
- Be friendly and welcoming
- Route immediately when intent is clear - don't delay
- Use conversation history to maintain context
- Don't repeat information already discussed
- Always use the appropriate specialist when routing
- For orders: Include userId context in the agent call

CRITICAL: You are ONLY a router. Your ONLY output should be using specialist agents - NO direct text responses to customers!
- If message contains ANY ordering words → USE orderManagerAgent
- If message contains menu/food words without ordering → USE menuRecipeAgent
- If message is "yes", "correct", "ok", "confirmed" → USE orderManagerAgent
- If unsure → USE orderManagerAgent
- Your ONLY output should be calling a specialist agent - NO other text!`,
});

export const kitchenOrchestratorFlow = ai.defineFlow(
  {
    name: "kitchenOrchestratorFlow",
    inputSchema: z.object({
      userId: z.string().describe("User ID making the request"),
      message: z.string().describe("User message to process"),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
      userId: z.string(),
      timestamp: z.string(),
      requestId: z.string().optional(),
      error: z.string().optional(),
      details: z.string().optional(),
    }),
  },
  async ({userId, message}) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`[KITCHEN_ORCHESTRATOR] Processing request ${requestId} for user ${userId}`);
    console.log(`[KITCHEN_ORCHESTRATOR] User message: "${message}"`);

    try {
      // Get conversation history
      const history = await getConversationHistory(userId, 10);

      // Add user message to conversation history
      await addConversationMessage(userId, "user", message, {
        timestamp: new Date().toISOString(),
        requestId,
        step: "user_input",
      });

      // Use triage agent to handle routing and get response
      console.log(`[TRIAGE_AGENT] Starting triage agent for user ${userId}, request ${requestId}`);
      console.log("[TRIAGE_AGENT] Available specialists: menuRecipeAgent, orderManagerAgent, waiterAgent");
      const chat = ai.chat(triageAgent);

      // Create a structured context that includes both the current message and history
      // History is already sorted newest-first, so we reverse it for chronological order
      const chronologicalHistory = history.slice(-10).reverse();
      console.log(`[HISTORY] Retrieved ${history.length} total messages, using ${chronologicalHistory.length} in chronological order (oldest to newest)`);
      if (chronologicalHistory.length > 0) {
        console.log(`[HISTORY] First message: "${chronologicalHistory[0].content.substring(0, 50)}..." (${chronologicalHistory[0].timestamp})`);
        console.log(`[HISTORY] Last message: "${chronologicalHistory[chronologicalHistory.length - 1].content.substring(0, 50)}..." 
          (${chronologicalHistory[chronologicalHistory.length - 1].timestamp})`);
      }

      const fullContext = history.length > 0 ?
        `Current message: "${message}"

Conversation history (chronological order - oldest to newest):
${chronologicalHistory.map((msg: any, index: number) =>
    `${index + 1}. ${msg.role}: ${msg.content}${msg.metadata?.step ?
      ` [${msg.metadata.step}]` : ""}${msg.metadata?.agent ? ` [Agent: ${msg.metadata.agent}]` : ""}`
  ).join("\n")}

Please consider the full conversation context when routing and responding. Use this history to:
- Determine if this is a menu exploration or order placement request
- Remember previous menu suggestions or ongoing orders
- Avoid asking for information already provided
- Maintain continuity in the customer experience

IMPORTANT: When calling orderManagerAgent, format the request as: "User ID: ${userId}\n\n${message}" so the agent can extract the userId for order creation.` :
        `Current message: "${message}"

This is the first message in the conversation. Welcome to our Indian restaurant! I can help you explore our menu or place an order.

IMPORTANT: When calling orderManagerAgent, format the request as: "User ID: ${userId}\n\n${message}" so the agent can extract the userId for order creation.`;

      console.log(`[TRIAGE_AGENT] Sending context to triage agent (length: ${fullContext.length} chars)`);
      console.log(`[TRIAGE_AGENT] Full context preview: ${fullContext.substring(0, 200)}${fullContext.length > 200 ? "..." : ""}`);
      const result = await chat.send(fullContext);
      const agentResponse = result.text;
      console.log(`[TRIAGE_AGENT] Received response from triage agent (length: ${agentResponse.length} chars)`);
      console.log(`[TRIAGE_AGENT] Response preview: ${agentResponse.substring(0, 100)}${agentResponse.length > 100 ? "..." : ""}`);

      // Debug: Check which agent was used
      const usedOrderManager = agentResponse.toLowerCase().includes("ordermanageragent") ||
                              agentResponse.toLowerCase().includes("order manager") ||
                              agentResponse.toLowerCase().includes("how many") ||
                              agentResponse.toLowerCase().includes("created an order");
      const usedMenuAgent = agentResponse.toLowerCase().includes("menurecipeagent") ||
                           agentResponse.toLowerCase().includes("menu agent") ||
                           agentResponse.toLowerCase().includes("appetizers") ||
                           agentResponse.toLowerCase().includes("vegetarian");
      const usedWaiterAgent = agentResponse.toLowerCase().includes("waiteragent") ||
                             agentResponse.toLowerCase().includes("waiter agent") ||
                             agentResponse.toLowerCase().includes("order status") ||
                             agentResponse.toLowerCase().includes("ready in") ||
                             agentResponse.toLowerCase().includes("on its way") ||
                             agentResponse.toLowerCase().includes("delivered");

      if (usedOrderManager) {
        console.log("[TRIAGE_AGENT] Detected ORDER agent was used");
      } else if (usedMenuAgent) {
        console.log("[TRIAGE_AGENT] Detected MENU agent was used");
      } else if (usedWaiterAgent) {
        console.log("[TRIAGE_AGENT] Detected WAITER agent was used");
      } else {
        console.log("[TRIAGE_AGENT] Could not detect which agent was used");
      }

      // Determine which agent was used for metadata
      let specialistAgent = "unknown";
      if (usedOrderManager) specialistAgent = "orderManagerAgent";
      else if (usedMenuAgent) specialistAgent = "menuRecipeAgent";
      else if (usedWaiterAgent) specialistAgent = "waiterAgent";

      // Add assistant response to conversation history
      await addConversationMessage(userId, "assistant", agentResponse, {
        timestamp: new Date().toISOString(),
        requestId,
        step: "agent_response",
        agent: specialistAgent,
      });

      return {
        success: true,
        message: agentResponse,
        userId,
        timestamp: new Date().toISOString(),
        requestId,
      };
    } catch (error) {
      console.error("[FLOW_ERROR] Error in kitchenOrchestratorFlow:", error);

      // Provide more specific error messages based on error type
      let errorMessage = "Sorry, there was an error processing your request. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("500") || error.message.includes("Internal Server Error")) {
          errorMessage = "The AI service is temporarily unavailable. Please try again in a moment.";
        } else if (error.message.includes("rate limit") || error.message.includes("quota")) {
          errorMessage = "The service is currently busy. Please try again in a few minutes.";
        }
      }

      // Add error message to conversation history
      await addConversationMessage(userId, "assistant", errorMessage, {
        timestamp: new Date().toISOString(),
        requestId,
        step: "error_response",
        agent: "kitchenOrchestratorFlow",
        error: true,
        errorDetails: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
        message: errorMessage,
        timestamp: new Date().toISOString(),
        requestId,
        userId,
      };
    }
  },
);
