import {ai, z} from "../genkit";
import {getConversationHistory, addConversationMessage} from "../data/conversationHistory";
import {orderManagerAgent} from "../agents/orderManagerAgent";
import {chefAgent} from "../agents/chefAgent";
import {menuRecipeAgent} from "../agents/menuRecipeAgent";

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

      // Format conversation history for context
      const historyContext = history.length > 0 ?
        `\n\nPrevious conversation context:\n${history
          .slice(-10) // Last 10 messages
          .map((msg: any) => `${msg.role}: ${msg.content}`)
          .join("\n")}` :
        "";

      // Use AI to determine which agent to route to
      const routingPrompt = `You are a routing agent for an Indian restaurant.
      Based on the user's message and conversation context, determine which specialized agent should handle their request.

Available agents:
1. menuRecipeAgent - ONLY for menu requests, food options, "what's available", "show menu", "vegetarian options", "menu please"
2. orderManagerAgent - for placing orders, "I want", "order", "buy", "get me", specific dish names like "palak paneer", "chicken tikka", OR completing order details like spice levels, quantities
3. chefAgent - for cooking status, kitchen questions, "how long", "cooking time", delivery status, "where is my order", "ready yet", "delivery"

Context-aware routing rules:
- PRIORITY 1: If message contains "order", "want", "get me", "buy" → route to orderManagerAgent
- PRIORITY 2: If message mentions specific dish names → route to orderManagerAgent
- PRIORITY 3: If the last assistant message asked about spice level, quantity, or order details → route to orderManagerAgent
- PRIORITY 4: If user mentions spice levels (mild, medium, hot, extra hot, spicy, not spicy) → route to orderManagerAgent
- PRIORITY 5: If user says "yes", "no", "confirmed", "ok", "sure", or gives short answers → route to orderManagerAgent
- PRIORITY 6: If message is just a number (likely quantity) → route to orderManagerAgent
- PRIORITY 7: If user is responding to order-related questions → route to orderManagerAgent
- PRIORITY 8: Menu requests only: "show menu", "what's available", "menu please", "vegetarian options" → route to menuRecipeAgent
- Otherwise, use the message content to determine the agent

User message: "${message}"
${historyContext}

Respond with ONLY the agent name (menuRecipeAgent, orderManagerAgent, or chefAgent).`;

      const routingResult = await ai.generate({
        prompt: routingPrompt,
      });

      const selectedAgent = routingResult.text.trim().toLowerCase();

      // Manual override for order requests to ensure proper routing
      const messageLower = message.toLowerCase();
      let finalAgent = selectedAgent;

      if (messageLower.includes('order') ||
          messageLower.includes('want') ||
          messageLower.includes('get me') ||
          messageLower.includes('buy') ||
          messageLower.includes('palak paneer') ||
          messageLower.includes('chicken tikka') ||
          messageLower.includes('butter chicken') ||
          messageLower.includes('chana masala') ||
          messageLower.includes('gulab jamun') ||
          messageLower.includes('naan')) {
        finalAgent = 'ordermanageragent';
      }

      // Route to appropriate agent based on AI decision (with manual override)
      let agentResponse: string;

      if (finalAgent.includes("menurecipeagent") || finalAgent.includes("menu")) {
        const chat = ai.chat(menuRecipeAgent);
        const result = await chat.send(`${message}${historyContext}`);
        agentResponse = result.text;
      } else if (finalAgent.includes("ordermanageragent") || finalAgent.includes("order")) {
        const chat = ai.chat(orderManagerAgent);
        const result = await chat.send(`${message}${historyContext}`);
        agentResponse = result.text;
      } else if (finalAgent.includes("chefagent") || finalAgent.includes("chef")) {
        const chat = ai.chat(chefAgent);
        const result = await chat.send(`${message}${historyContext}`);
        agentResponse = result.text;
      } else {
        // Default to menu agent if routing is unclear
        const chat = ai.chat(menuRecipeAgent);
        const result = await chat.send(`${message}${historyContext}`);
        agentResponse = result.text;
      }

      // Add assistant response to conversation history
      await addConversationMessage(userId, "assistant", agentResponse, {
        timestamp: new Date().toISOString(),
        requestId,
        step: "agent_response",
        agent: finalAgent,
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
