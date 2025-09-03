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
      const history = await getConversationHistory(userId, 15);

      // Save user message
      await addConversationMessage(userId, "user", message, {
        timestamp: new Date().toISOString(),
        requestId,
        step: "user_input",
      });

      // Build short user-only context
      const historyContext = history
        .filter((h: any) => h.role === "user")
        .slice(-6)
        .map((h: any) => `user: ${h.content}`)
        .join("\n");

      // ✅ Extract the authoritative latest menu only
      const lastMenu = history
        .slice()
        .reverse()
        .find((h: any) => h.step === "menu_generated");

      // ✅ Track last ordered dish (saved with step: "dish_selected")
      const lastDish = history
        .slice()
        .reverse()
        .find((h: any) => h.step === "dish_selected");

      // ✅ Build enriched context (menu authoritative, chatter excluded)
      const enrichedContext = `
${historyContext}

${
  lastMenu
    ? `\n\nLATEST MENU (authoritative - use ONLY this for dish validation):\n${lastMenu.content}`
    : ""
}
`;

      // --- DIRECT INTENT CLASSIFICATION ---
      let intent: string;
      const lowerMessage = message.toLowerCase();

      if (
        lowerMessage.includes("order") ||
        lowerMessage.includes("get me") ||
        lowerMessage.includes("i want") ||
        lowerMessage.includes("i'd like") ||
        lowerMessage.includes("can i have") ||
        lowerMessage.includes("buy") ||
        lowerMessage.includes("purchase") ||
        /\d+\s*serving/.test(lowerMessage) || // "2 servings"
        /\d+\s*piece/.test(lowerMessage) || // "2 pieces"
        /\d+\s*portion/.test(lowerMessage) || // "2 portions"
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
        lowerMessage.includes("vegan")
      ) {
        intent = "order";
      } else if (
        lowerMessage.includes("menu") ||
        lowerMessage.includes("what do you have") ||
        lowerMessage.includes("show me") ||
        lowerMessage.includes("what's available") ||
        lowerMessage.includes("browse")
      ) {
        intent = "menu";
      } else {
        intent = "clarify";
      }

      console.log(
        "Direct intent classification:",
        intent,
        "for message:",
        message
      );

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

        // Save menu with step = menu_generated
        await addConversationMessage(userId, "assistant", agentResponse, {
          timestamp: new Date().toISOString(),
          requestId,
          step: "menu_generated",
          agent: specialistAgent,
        });
      } else if (intent === "order") {
        // ✅ If user only says "2 servings" etc., attach last dish
        let adjustedMessage = message;
        if (
          (/\d+\s*serving/.test(lowerMessage) ||
            /\d+\s*piece/.test(lowerMessage) ||
            /\d+\s*portion/.test(lowerMessage)) &&
          lastDish
        ) {
          adjustedMessage = `${message} of ${lastDish.content}`;
        }

        const orderResult = await orderManagerAgent(
          adjustedMessage ?? "[empty message]",
          enrichedContext
        );
        agentResponse = orderResult.text ?? "[order agent returned no text]";
        specialistAgent = "orderManagerAgent";

        await addConversationMessage(userId, "assistant", agentResponse, {
          timestamp: new Date().toISOString(),
          requestId,
          step: "agent_response",
          agent: specialistAgent,
        });

        // ✅ If this message contains a known dish, save as dish_selected
        if (
          /(gulab jamun|gajar ka halwa|mango kulfi|ras malai|kheer|jalebi|butter chicken|chicken tikka masala|dal makhani|palak paneer|aloo gobi|malai kofta|naan|roti|rice|biryani|pulao)/i.test(
            message
          )
        ) {
          await addConversationMessage(userId, "assistant", message, {
            timestamp: new Date().toISOString(),
            requestId,
            step: "dish_selected",
            agent: specialistAgent,
          });
        }
      } else {
        agentResponse =
          "Hello! Welcome to our Indian restaurant. I can help you explore our menu or place an order.";

        await addConversationMessage(userId, "assistant", agentResponse, {
          timestamp: new Date().toISOString(),
          requestId,
          step: "agent_response",
          agent: specialistAgent,
        });
      }

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
