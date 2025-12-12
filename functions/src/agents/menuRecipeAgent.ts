import {ai, z} from "../genkit";
import {inventoryTool} from "../tools/inventoryTool";

// Tool-backed agent that generates menus and recipe suggestions
export const menuRecipeAgent = ai.defineTool(
  {
    name: "menuRecipeAgent",
    description: `Use this tool for ALL menu-related requests, recipe information, and food exploration. 
This agent generates dynamic menus based on available ingredients, provides recipe suggestions, and helps customers explore food options.

USE THIS TOOL WHEN THE CUSTOMER:
- Asks to see the menu ("Show me the menu", "What's on the menu?", "What do you have?")
- Asks for food suggestions ("Suggest something", "What's good?", "Surprise me", "What do you recommend?")
- Asks about dietary options ("What's vegetarian?", "Do you have vegan options?", "I am vegan", "gluten-free options")
- Asks about specific dishes WITHOUT ordering ("Tell me about butter chicken", "What's in palak paneer?", "How is aloo paratha made?")
- Asks about specials ("What's special today?", "Today's specials?", "Any special dishes?")
- Expresses general food interest ("I'm hungry", "I want to eat", "What are my options?")
- Wants recipe information or cooking guidance
- Needs menu exploration before deciding what to order

This agent immediately generates authentic Indian menus with 8-12 dishes, grouped by categories (Appetizers, Main Courses, Breads, Rice, Desserts), including cooking times and spice levels. It adapts to dietary preferences and provides detailed dish descriptions.`,
    inputSchema: z.object({
      message: z.string().describe("User request or menu context"),
      userId: z.string().optional().describe("User ID if available"),
    }),
    outputSchema: z.string().describe("Formatted menu or recipe response in markdown format"),
  },
  async ({message}) => {
    const chat = ai.chat({
      system: `You are the Menu Agent for Indian Grill restaurant. Your role is to:

1. Immediately generate today's dynamic menu using the 'inventoryTool' based on available ingredients.
2. Provide recipe suggestions and cooking guidance.
3. Create dessert menus for upselling opportunities.
4. Adapt menus based on dietary preferences and categories (e.g., "vegetarian").
5. Ensure authentic Indian flavors and cooking techniques.

**CRITICAL: DO NOT ASK CLARIFYING QUESTIONS. IMMEDIATELY GENERATE A MENU.**

When generating menus:
- Check available ingredients using the 'inventoryTool'.
- Create 8-12 authentic Indian dishes that can be made with available ingredients.
- Group dishes by category (Vegetarian, Non-Vegetarian, Appetizers, Breads, Rice, Desserts).
- Include realistic cooking times.
- Consider Indian cooking techniques and spice combinations.
- Adapt to specific categories or dietary preferences when requested (e.g., if "vegetarian" is mentioned,
  prioritize vegetarian dishes).

**Response Format - Marked.js Compatible Markdown:**
- Use clean, consistent markdown that works with Marked.js parser
- Format: **Category Name** *(time range)*
- Each dish: **Dish Name** *(time)*: Description. *Spice: Level*
- Use double line breaks between sections
- Ensure proper spacing around ** and *
- Keep descriptions concise and clear

**Example:**
**🍽️ Appetizers** *(10-15 min)*

**Paneer Tikka** *(12 min)*: Marinated paneer cubes grilled perfectly. *Spice: Mild*

**Samosa Chaat** *(15 min)*: Crispy samosas with tangy chutneys. *Spice: Medium*

**🍛 Main Courses** *(25-35 min)*

**Butter Chicken** *(30 min)*: Tender chicken in creamy tomato sauce. *Spice: Mild*

**Palak Paneer** *(25 min)*: Spinach and cheese curry. *Spice: Mild*

Always maintain the authentic taste and quality of traditional Indian cuisine while being creative with
available ingredients.`,
      tools: [inventoryTool],
    });

    const {text} = await chat.send(message);
    return text;
  },
);
