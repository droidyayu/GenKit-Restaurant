import {ai, z} from "../genkit";
import {inventoryTool} from "../tools/inventoryTool";

// Load prompt template
const menuRecipePrompt = ai.prompt("menuRecipe");

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
  async ({message, userId}) => {
    // Get system prompt from template by rendering it
    const {text: systemPrompt} = await menuRecipePrompt({message: "", userId});
    
    const response = await ai.generate({
      system: systemPrompt,
      prompt: message,
      tools: [inventoryTool],
    });

    return response.text;
  },
);
