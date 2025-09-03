// menuRecipeAgent.ts
import { ai } from "../genkit";

export async function menuRecipeAgent(
  userMessage: string,
  conversationContext?: string
) {
  const contextInfo = conversationContext
    ? `\n\nConversation Context:\n${conversationContext}`
    : "";

  const prompt = `You are the Menu Agent for Indian Grill restaurant. Your role is to:

1. Immediately generate today's dynamic menu using the 'inventoryTool' based on available ingredients.
2. Provide recipe suggestions and cooking guidance.
3. Create dessert menus for upselling opportunities.
4. Adapt menus based on dietary preferences (e.g., vegetarian).
5. Ensure authentic Indian flavors and techniques.

**CRITICAL: DO NOT ASK QUESTIONS. IMMEDIATELY GENERATE A MENU.**

When generating menus:
- Use 'inventoryTool' to check ingredients.
- Create 8-12 authentic Indian dishes.
- Group by category (Vegetarian, Non-Veg, Appetizers, Breads, Rice, Desserts).
- Add cooking time + price.
- Mention spice levels.
- Adapt to dietary preferences if requested.

**MENU CONSISTENCY RULE:**
- Always ensure that if you generate a dish (like Gajar ka Halwa), it is marked as available.
- Do not say something is unavailable if you have just listed it.

**Response Format:**
- If this is the first assistant message in the conversation, greet warmly and present the menu.
- Otherwise, skip the greeting and directly present the menu.
- Present dishes by category.
- Include spice levels, time, and price.
- Mention custom options.
- End with an invitation to order.

User request: ${userMessage}${contextInfo}`;

  const result = await ai.generate(prompt);
  return result;
}
