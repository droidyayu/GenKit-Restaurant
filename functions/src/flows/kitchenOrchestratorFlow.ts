import {ai, z} from "../genkit";
import {getConversationHistory, addConversationMessage} from "../data/conversationHistory";
import {orderManagerAgent} from "../agents/orderManagerAgent";
import {menuRecipeAgent} from "../agents/menuRecipeAgent";

// Define the triage agent that handles initial routing
const triageAgent = ai.definePrompt({
  name: "triageAgent",
  description: "Triage Agent for Indian Restaurant - routes customer requests to menu and order specialists",
  tools: [menuRecipeAgent, orderManagerAgent],
  system: `You are an AI customer service agent for an Indian restaurant.

Greet customers warmly and determine how you can help them.
IMPORTANT: Always use the available tools to actually CALL the specialist agents - don't just say you'll transfer them.

Available specialists:
1. menuRecipeAgent - For menu exploration, dish suggestions, availability checking, and recipe information
2. orderManagerAgent - For placing orders, collecting order details, and managing the ordering process

CRITICAL ROUTING RULES:

MENU INTENT - CALL menuRecipeAgent tool when customer:
- Asks to see the menu ("Show me the menu", "What's on the menu?")
- Asks what you have ("What do you have?", "What are your options?")
- Asks for suggestions ("Suggest something", "What's good?", "Surprise me")
- Asks about dietary options ("What's vegetarian?", "Do you have vegan options?")
- Asks about specific dishes without ordering ("Tell me about aloo paratha", "What's in butter chicken?")
- Asks about specials ("What's special today?", "Today's specials?")
- General food interest ("I'm hungry", "I want to eat")

ORDER INTENT - CALL orderManagerAgent tool when customer:
- Wants specific dishes ("I want aloo paratha", "Get me butter chicken", "Order naan")
- Specifies quantities with dishes ("2 aloo paratha", "3 pieces of chicken", "One serving of rice")
- Uses ordering language ("Can I get", "I'd like", "Give me", "I want to order")
- Provides order details ("with hot spice", "mild please", "extra spicy")
- Follows up on previous order requests ("2 pieces", "hot spice", "my name is")

CLARIFICATION: Only ask for clarification if the request is truly ambiguous or contradictory.

CRITICAL USERID CONTEXT:
- When calling orderManagerAgent, ALWAYS include the userId in the request
- Format: "User ID: [userId]\n\n[Customer's actual request]"
- Example: "User ID: user123\n\nI want 2 butter chicken medium spicy"
- This ensures the order agent can create orders for the correct customer

Response style:
- Be friendly and welcoming
- Route immediately when intent is clear - don't delay
- Use conversation history to maintain context
- Don't repeat information already discussed
- Always call the appropriate tool when routing
- For orders: Include userId context in the tool call

Remember: Your job is to route efficiently - use the tools to actually help customers!`,
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
      console.log("[TRIAGE_AGENT] Available tools: menuRecipeAgent, orderManagerAgent");
      const chat = ai.chat(triageAgent);

      // Create a structured context that includes both the current message and history
      const fullContext = history.length > 0 ?
        `Current message: "${message}"

Conversation history (last ${Math.min(history.length, 10)} messages):
${history.slice(-10).map((msg: any, index: number) =>
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
      const result = await chat.send(fullContext);
      const agentResponse = result.text;
      console.log(`[TRIAGE_AGENT] Received response from triage agent (length: ${agentResponse.length} chars)`);
      console.log(`[TRIAGE_AGENT] Response preview: ${agentResponse.substring(0, 100)}${agentResponse.length > 100 ? "..." : ""}`);

      // Add assistant response to conversation history
      await addConversationMessage(userId, "assistant", agentResponse, {
        timestamp: new Date().toISOString(),
        requestId,
        step: "agent_response",
        agent: "triageAgent",
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
