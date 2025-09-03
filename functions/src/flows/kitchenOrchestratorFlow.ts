import {ai, z} from "../genkit";
import {getConversationHistory, addConversationMessage, ConversationMessage} from "../data/conversationHistory";
import {orderManagerAgent} from "../agents/orderManagerAgent";
import {chefAgent} from "../agents/chefAgent";
import {waiterAgent} from "../agents/waiterAgent";
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
          .map((msg: ConversationMessage) => `${msg.role}: ${msg.content}`)
          .join("\n")}` :
        "";

      // Use AI to determine which agent to route to
      const routingPrompt = `You are a routing agent for an Indian restaurant. Based on the user's message, determine which specialized agent should handle their request.

Available agents:
1. menuRecipeAgent - for menu requests, food options, "what's available", "show menu", "vegetarian options"
2. orderManagerAgent - for placing orders, "I want", "order", "buy", specific dish names
3. chefAgent - for cooking status, kitchen questions, "how long", "cooking time"
4. waiterAgent - for delivery status, "where is my order", "ready yet", "delivery"

User message: "${message}"

Respond with ONLY the agent name (menuRecipeAgent, orderManagerAgent, chefAgent, or waiterAgent).`;

      const routingResult = await ai.generate({
        prompt: routingPrompt,
      });

      const selectedAgent = routingResult.text.trim().toLowerCase();

      // Route to appropriate agent based on AI decision
      let agentResponse: string;
      
      if (selectedAgent.includes("menurecipeagent") || selectedAgent.includes("menu")) {
        const chat = ai.chat(menuRecipeAgent);
        const result = await chat.send(message);
        agentResponse = result.text;
      } else if (selectedAgent.includes("ordermanageragent") || selectedAgent.includes("order")) {
        const chat = ai.chat(orderManagerAgent);
        const result = await chat.send(message);
        agentResponse = result.text;
      } else if (selectedAgent.includes("chefagent") || selectedAgent.includes("chef")) {
        const chat = ai.chat(chefAgent);
        const result = await chat.send(message);
        agentResponse = result.text;
      } else if (selectedAgent.includes("waiteragent") || selectedAgent.includes("waiter")) {
        const chat = ai.chat(waiterAgent);
        const result = await chat.send(message);
        agentResponse = result.text;
      } else {
        // Default to menu agent if routing is unclear
        const chat = ai.chat(menuRecipeAgent);
        const result = await chat.send(message);
        agentResponse = result.text;
      }

      // Add assistant response to conversation history
      await addConversationMessage(userId, "assistant", agentResponse, {
        timestamp: new Date().toISOString(),
        requestId,
        step: "agent_response",
        agent: selectedAgent,
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
