import {ai, z} from "../genkit";
import {getConversationHistory, addConversationMessage} from "../data/conversationHistory";
import {orderManagerAgent} from "../agents/orderManagerAgent";
import {menuRecipeAgent} from "../agents/menuRecipeAgent";

// Define the triage agent that handles initial routing
const triageAgent = ai.definePrompt({
  name: 'triageAgent',
  description: 'Triage Agent for Indian Restaurant - routes customer requests to menu and order specialists',
  tools: [menuRecipeAgent, orderManagerAgent],
  system: `You are an AI customer service agent for an Indian restaurant.

Greet customers warmly and determine how you can help them. Use the available tools to transfer to the most appropriate specialist agent based on the customer's INTENT and needs:

Available specialists:
1. menuRecipeAgent - For menu exploration, dish suggestions, availability checking, and recipe information
2. orderManagerAgent - For placing orders, collecting order details, and managing the ordering process

Intent-based routing guidelines:

MENU INTENT - Route to menuRecipeAgent when customer wants to:
- Explore menu options and see what's available
- Get dish suggestions and recommendations
- Check ingredient availability and feasibility
- Learn about menu items and recipes
- Filter by dietary preferences (vegetarian, etc.)
Examples: "What do you have?", "Show me the menu", "Suggest something good", "What's vegetarian?"

ORDER INTENT - Route to orderManagerAgent when customer wants to:
- Place an order for specific dishes
- Specify quantities and portions
- Choose spice levels and customizations
- Complete order details and finalize
- Make modifications to existing orders
Examples: "I want to order", "Get me chicken tikka", "Two portions please", "Make it spicy"

CLARIFICATION: If intent is unclear, ask a brief clarifying question before routing
CONTEXT AWARENESS: Use conversation history to understand ongoing conversations and route appropriately

Response style:
- Be friendly, welcoming, and efficient
- Use conversation history to maintain context and avoid asking for information already provided
- Don't repeat information already discussed
- Route immediately when intent is clear

If you cannot help with available tools, politely explain your limitations.`,
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
      const chat = ai.chat(triageAgent);

      // Create a structured context that includes both the current message and history
      const fullContext = history.length > 0
        ? `Current message: "${message}"

Conversation history (last ${Math.min(history.length, 10)} messages):
${history.slice(-10).map((msg: any, index: number) =>
  `${index + 1}. ${msg.role}: ${msg.content}${msg.metadata?.step ? ` [${msg.metadata.step}]` : ''}${msg.metadata?.agent ? ` [Agent: ${msg.metadata.agent}]` : ''}`
).join('\n')}

Please consider the full conversation context when routing and responding. Use this history to:
- Determine if this is a menu exploration or order placement request
- Remember previous menu suggestions or ongoing orders
- Avoid asking for information already provided
- Maintain continuity in the customer experience`
        : `Current message: "${message}"

This is the first message in the conversation. Welcome to our Indian restaurant! I can help you explore our menu or place an order.`;

      const result = await chat.send(fullContext);
      const agentResponse = result.text;

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

      const errorMessage = "Sorry, there was an error processing your request. Please try again.";

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
