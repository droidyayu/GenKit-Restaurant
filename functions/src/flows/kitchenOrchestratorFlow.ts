import { ai, z } from "../genkit";
import {
  getConversationHistory,
  addConversationMessage,
} from "../data/conversationHistory";
import { orderManagerAgent } from "../agents/orderManagerAgent";
import { menuRecipeAgent } from "../agents/menuRecipeAgent";



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
  async ({ userId, message }) => {
    const requestId = `req_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    try {
      // Conversation history
      const history = await getConversationHistory(userId, 10);

      // Save user message
      await addConversationMessage(userId, "user", message, {
        timestamp: new Date().toISOString(),
        requestId,
        step: "user_input",
      });

      const historyContext = history
        .slice(-4)
        .filter((h: any) => h?.content)
        .map((h: any) => `${h.role}: ${h.content}`)
        .join("\n");



      // --- DIRECT INTENT CLASSIFICATION (No more unreliable triage) ---
      let intent: string;
      const lowerMessage = message.toLowerCase();
      
      // Direct pattern matching - much more reliable than Gemini
      if (lowerMessage.includes("order") || 
          lowerMessage.includes("get me") || 
          lowerMessage.includes("i want") || 
          lowerMessage.includes("i'd like") || 
          lowerMessage.includes("can i have") ||
          lowerMessage.includes("buy") ||
          lowerMessage.includes("purchase") ||
          // Order context responses
          /\d+\s*serving/.test(lowerMessage) ||  // "2 servings", "1 serving"
          /\d+\s*piece/.test(lowerMessage) ||    // "2 pieces", "1 piece"
          /\d+\s*portion/.test(lowerMessage) ||  // "2 portions", "1 portion"
          lowerMessage.includes("serving") ||
          lowerMessage.includes("piece") ||
          lowerMessage.includes("portion") ||
          lowerMessage.includes("spicy") ||
          lowerMessage.includes("mild") ||
          lowerMessage.includes("hot") ||
          lowerMessage.includes("medium") ||
          lowerMessage.includes("yes") ||
          lowerMessage.includes("no") ||
          lowerMessage.includes("vegetarian") ||
          lowerMessage.includes("vegan")) {
        intent = "order";
      } else if (lowerMessage.includes("menu") || 
                 lowerMessage.includes("what do you have") || 
                 lowerMessage.includes("show me") ||
                 lowerMessage.includes("what's available") ||
                 lowerMessage.includes("browse")) {
        intent = "menu";
      } else {
        intent = "clarify";
      }
      
      console.log("Direct intent classification:", intent, "for message:", message);

      // --- ROUTING ---
      let agentResponse: string;
      let specialistAgent = "triage";

      if (intent === "menu") {
        const menuResult = await menuRecipeAgent(
          message ?? "[empty message]",
          historyContext
        );
        agentResponse = menuResult.text ?? "[menu agent returned no text]";
        specialistAgent = "menuRecipeAgent";
      } else if (intent === "order") {
        const orderResult = await orderManagerAgent(
          message ?? "[empty message]",
          historyContext
        );
        agentResponse = orderResult.text ?? "[order agent returned no text]";
        specialistAgent = "orderManagerAgent";
      } else {
        agentResponse =
          "Hello! Welcome to our Indian restaurant. I can help you explore our menu or place an order.";
      }

      // Save assistant response
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
      console.error("[FLOW_ERROR]", error);

      const errorMessage =
        "Sorry, there was an error processing your request. Please try again.";

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
  }
);
