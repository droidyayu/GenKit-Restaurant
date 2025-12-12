import {ai, z} from "../genkit";
import {getOrderStatusTool} from "../tools/orderTool";
import {notificationTool} from "../tools/notificationTool";

// Load prompt template
const waiterPrompt = ai.prompt("waiter");

// Tool-backed waiter/delivery agent
export const waiterAgent = ai.defineTool(
  {
    name: "waiterAgent",
    description: `Use this tool for ALL order status inquiries, delivery tracking, and customer service follow-ups about existing orders.
This agent provides real-time order status updates, ETAs, and delivery coordination.

USE THIS TOOL WHEN THE CUSTOMER:
- Asks about order status ("Where's my order?", "What's the status of my order?", "Is my order ready?")
- Wants delivery updates ("How long will it take?", "When will my food be here?", "Ready yet?")
- Asks about timing ("How much longer?", "What's the ETA?", "When is it coming?")
- Expresses waiting concerns ("What's taking so long?", "I'm waiting for my food", "Any update?")
- Requests order check ("Can you check on my order?", "Update on my order", "Status please")
- Asks follow-up questions about existing orders (NOT placing new orders)
- Needs delivery coordination or customer service for placed orders

This agent always calls getOrderStatusTool first to get accurate order information, then provides friendly status updates with realistic ETAs. It handles multiple orders appropriately, focuses on the most recent/active ones, and offers dessert upsells when orders are delivered. Status categories include: PENDING, PREP/COOKING, READY, DELIVERED, and CANCELLED.`,
    inputSchema: z.object({
      message: z.string().describe("User request or status inquiry (should include 'User ID: [userId]' prefix if available)"),
      userId: z.string().optional().describe("User ID if available"),
    }),
    outputSchema: z.string().describe("Order status update with current status, ETA, and next steps, or friendly customer service response"),
  },
  async ({message, userId}) => {
    // Get system prompt from template by rendering it
    const {text: systemPrompt} = await waiterPrompt({message: "", userId});
    
    const response = await ai.generate({
      system: systemPrompt,
      prompt: message,
      tools: [getOrderStatusTool, notificationTool],
    });

    return response.text;
  },
);
