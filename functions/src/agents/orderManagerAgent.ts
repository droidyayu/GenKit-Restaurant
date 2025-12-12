import {ai, z} from "../genkit";
import {createOrderTool} from "../tools/orderTool";
import {inventoryTool} from "../tools/inventoryTool";

// Load prompt template
const orderManagerPrompt = ai.prompt("orderManager");

// Tool-backed order manager agent
export const orderManagerAgent = ai.defineTool(
  {
    name: "orderManagerAgent",
    description: `Use this tool for ALL order-related requests, order placement, and order management activities.
This agent collects complete order details (dishes, quantities, spice levels) and creates orders in the system.

USE THIS TOOL WHEN THE CUSTOMER:
- Wants to place an order ("I want to order", "order butter chicken", "get me palak paneer", "I'd like naan")
- Mentions food items WITH ordering intent ("2 butter chicken", "palak paneer for 2 people", "one serving of biryani")
- Provides quantity specifications ("2 pieces", "for 2 people", "one serving", "3 orders")
- Specifies spice levels ("hot", "mild", "medium", "extra hot", "spicy")
- Confirms an order ("yes", "correct", "confirmed", "ok", "sure", "that's right", "yes please")
- Answers questions about their order (quantities, spice preferences, special instructions)
- Makes any follow-up to an ordering conversation
- Provides order details across multiple messages

This agent intelligently collects order information through conversation, extracts userId from context, handles multi-item orders, and creates orders with complete details. It asks clarifying questions one at a time (quantity OR spice level) and immediately creates orders when all details are confirmed. For sweet dishes (Kheer, Gulab Jamun, Rasmalai, Gajar Ka Halwa), no spice level is required.`,
    inputSchema: z.object({
      message: z.string().describe("User request or order context (should include 'User ID: [userId]' prefix if available)"),
      userId: z.string().optional().describe("User ID if available"),
    }),
    outputSchema: z.string().describe("Order confirmation response with order ID and ETA, or questions to collect missing order details"),
  },
  async ({message, userId}) => {
    // Get system prompt from template by rendering it
    const {text: systemPrompt} = await orderManagerPrompt({message: "", userId});
    
    const response = await ai.generate({
      system: systemPrompt,
      prompt: message,
      tools: [createOrderTool, inventoryTool],
    });

    return response.text;
  },
);

