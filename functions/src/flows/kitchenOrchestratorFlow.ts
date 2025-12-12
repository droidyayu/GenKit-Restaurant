import {ai, z} from "../genkit";
import {firestoreSessionStore} from "../data/sessionStore";
import {orderManagerAgent} from "../agents/orderManagerAgent";
import {menuRecipeAgent} from "../agents/menuRecipeAgent";
import {waiterAgent} from "../agents/waiterAgent";

// System instructions for routing directly with tools (no intermediate prompt)
const triageSystemPrompt = `You are an AI customer service agent for an Indian restaurant.

Greet customers warmly and determine how you can help them.

Available specialists:
1. menuRecipeAgent - For menu exploration, dish suggestions, availability checking, and recipe information
2. orderManagerAgent - For placing orders, collecting order details, and managing the ordering process
3. waiterAgent - For order status inquiries, delivery updates, and customer service follow-ups

ROUTING RULES:
- For greetings and general conversation (e.g., "hello", "how are you?", "thanks") → RESPOND DIRECTLY with a friendly greeting and offer to help
- For menu-related requests → USE menuRecipeAgent (then return its response directly to the user)
- For order-related requests → USE orderManagerAgent (then return its response directly to the user)
- For status/delivery inquiries → USE waiterAgent (then return its response directly to the user)
- If unsure about intent → RESPOND DIRECTLY asking how you can help

TOOL USAGE RULES:
- Use menuRecipeAgent for menu exploration, dish suggestions, dietary options, recipe questions
- Use orderManagerAgent for placing orders, order confirmations, quantities, spice levels
- Use waiterAgent for order status, delivery updates, timing questions
- For general greetings and non-food related conversation → RESPOND DIRECTLY (do NOT use tools)
- Do NOT use tools for simple greetings like "hello", "hi", "how are you?", "thanks"
- CRITICAL: When you call a specialist agent tool, return its response directly to the user. Do NOT call additional tools or process the response further.

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

RESPONSE GUIDELINES:
- Greet customers warmly and be helpful
- For greetings ("hello", "hi", "how are you?") → Respond directly with a friendly greeting
- For general questions about the restaurant → Respond directly with helpful information
- Only use specialist agents when the customer has a specific request (menu, order, or status)
- If the message is unclear or just a greeting → Respond directly asking how you can help
- Always be friendly and welcoming`;

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
      
      const chat = session.chat({
        system: triageSystemPrompt,
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
        const chat = session.chat({
          system: triageSystemPrompt,
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
