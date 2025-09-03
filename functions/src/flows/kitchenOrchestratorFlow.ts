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
      const history = await getConversationHistory(userId, 10);

      await addConversationMessage(userId, "user", message, {
        timestamp: new Date().toISOString(),
        requestId,
        step: "user_input",
      });

      const historyContext = history.length > 0 ?
        `\n\nPrevious conversation context:\n${history
          .slice(-10)
          .map((msg: ConversationMessage) => `${msg.role}: ${msg.content}`)
          .join("\n")}` :
        "";

      const chat = ai.chat(kitchenAgent);
      const aiResponse = await chat.send(
        `User ${userId}: ${message}${historyContext}`
      );

      await addConversationMessage(userId, "assistant", aiResponse.text, {
            timestamp: new Date().toISOString(),
            requestId,
        step: "agent_response",
        agent: "kitchenAgent",
          });

          return {
            success: true,
        message: aiResponse.text,
          userId,
          timestamp: new Date().toISOString(),
          requestId,
        };
    } catch (error) {
      console.error("[FLOW_ERROR] Error in kitchenOrchestratorFlow:", error);

      const errorMessage = "Sorry, there was an error processing your request. Please try again.";

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
