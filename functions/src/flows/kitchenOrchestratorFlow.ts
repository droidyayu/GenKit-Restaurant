import {ai, z} from "../genkit";
import {kitchenAgent} from "../agents/kitchenAgent";
import {getConversationHistory, addConversationMessage, ConversationMessage} from "../data/conversationHistory";

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

      // Use the kitchenAgent to handle the request with conversation history
      const result = await ai.generate({
        prompt: [
          {text: `User ${userId}: ${message}${historyContext}`},
        ],
        config: {
          model: kitchenAgent,
        },
      });

      // Add assistant response to conversation history
      await addConversationMessage(userId, "assistant", result.text, {
        timestamp: new Date().toISOString(),
        requestId,
        step: "agent_response",
        agent: "kitchenAgent",
      });

      return {
        success: true,
        message: result.text,
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
        agent: "kitchenAgent",
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
      };
    }
  }
);
