import {ai, z} from "../genkit";
import {firestoreSessionStore} from "../data/sessionStore";
import {orderManagerAgent} from "../agents/orderManagerAgent";
import {menuRecipeAgent} from "../agents/menuRecipeAgent";
import {waiterAgent} from "../agents/waiterAgent";

// Load prompt template
const triagePrompt = ai.prompt("triage");

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
      agent: z.string().optional(),
      error: z.string().optional(),
      details: z.string().optional(),
    }),
  },
  async ({userId, message}) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`[KITCHEN_ORCHESTRATOR] Processing request ${requestId} for user ${userId}`);
    console.log(`[KITCHEN_ORCHESTRATOR] User message: "${message}"`);

    try {
      // Load or create session using userId as sessionId
      let session;
      try {
        session = await ai.loadSession(userId, {
          store: firestoreSessionStore,
        });
        if (session) {
          console.log(`[SESSION] Loaded existing session for user ${userId}`);
        } else {
          throw new Error("Session not found");
        }
      } catch (error) {
        // Session doesn't exist, create a new one with userId as sessionId
        session = ai.createSession({
          store: firestoreSessionStore,
          sessionId: userId,
        });
        console.log(`[SESSION] Created new session for user ${userId}`);
      }

      // Use session.chat() to create a chat instance bound to this session
      console.log(`[TRIAGE_AGENT] Starting triage agent for user ${userId}, request ${requestId}`);
      console.log("[TRIAGE_AGENT] Available specialists: menuRecipeAgent, orderManagerAgent, waiterAgent");
      
      // Get system prompt from template by rendering it
      const {text: systemPrompt} = await triagePrompt({userId});
      
      const chat = session.chat({
        system: systemPrompt,
        tools: [menuRecipeAgent, orderManagerAgent, waiterAgent],
        maxTurns: 10, // Increase limit to handle tool calls, but prompt should prevent loops
      });

      // Prepare context with userId for tool calls
      const contextMessage = `User ID: ${userId}

${message}

IMPORTANT: When calling orderManagerAgent or waiterAgent, include the userId from above in the tool call input.`;

      console.log(`[TRIAGE_AGENT] Sending message to chat with session (userId: ${userId})`);
      const {text} = await chat.send(contextMessage);
      console.log(`[TRIAGE_AGENT] Received response from triage agent (length: ${text.length} chars)`);
      console.log(`[TRIAGE_AGENT] Response preview: ${text.substring(0, 100)}${text.length > 100 ? "..." : ""}`);

      // Debug: Check which agent was used
      const usedOrderManager = text.toLowerCase().includes("ordermanageragent") ||
                              text.toLowerCase().includes("order manager") ||
                              text.toLowerCase().includes("how many") ||
                              text.toLowerCase().includes("created an order");
      const usedMenuAgent = text.toLowerCase().includes("menurecipeagent") ||
                           text.toLowerCase().includes("menu agent") ||
                           text.toLowerCase().includes("appetizers") ||
                           text.toLowerCase().includes("vegetarian");
      const usedWaiterAgent = text.toLowerCase().includes("waiteragent") ||
                             text.toLowerCase().includes("waiter agent") ||
                             text.toLowerCase().includes("order status") ||
                             text.toLowerCase().includes("ready in") ||
                             text.toLowerCase().includes("on its way") ||
                             text.toLowerCase().includes("delivered");

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

      // Session automatically saves conversation history, no manual tracking needed
      console.log(`[SESSION] Conversation saved automatically for user ${userId}`);

      return {
        success: true,
        message: text,
        userId,
        timestamp: new Date().toISOString(),
        requestId,
        agent: specialistAgent,
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

      // Try to save error to session if session exists
      try {
        const session = await ai.loadSession(userId, {
          store: firestoreSessionStore,
        });
        const {text: systemPrompt} = await triagePrompt({userId});
        const chat = session.chat({
          system: systemPrompt,
          tools: [menuRecipeAgent, orderManagerAgent, waiterAgent],
        });
        await chat.send(`Error occurred: ${errorMessage}`);
      } catch (sessionError) {
        console.warn("[SESSION] Could not save error to session:", sessionError);
      }

      return {
        success: false,
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
        message: errorMessage,
        timestamp: new Date().toISOString(),
        requestId,
        userId,
        agent: "kitchenOrchestratorFlow",
      };
    }
  },
);
