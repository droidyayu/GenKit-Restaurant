import { ai } from '../genkit';
import { inventoryTool } from '../tools/inventoryTool';

export async function menuRecipeAgent(input: {
  userId?: string;
  category?: string;
  preferences?: string;
  requestType: 'menu_generation' | 'recipe_suggestion' | 'dessert_upsell';
}) {
  const { userId, category, preferences, requestType } = input;
  console.log(`[MENU AGENT] Processing ${requestType} request for user ${userId || 'anonymous'}`);
  
  try {
    // Get current inventory using the tool
    const inventory = await inventoryTool({});
    const availableIngredients = inventory.filter((item: any) => 
      item.available && item.quantity > 0
    );
    
    // Create ingredient list for AI prompt
    const ingredientList = availableIngredients.map((item: any) => `${item.ingredient} (${item.quantity}${item.unit})`).join(', ');
    
    // Build AI prompt for recipe generation
    let prompt = `You are a master chef at Indian Grill restaurant. Based on these available ingredients: ${ingredientList}, generate a delicious Indian menu.

Please provide a nicely formatted menu with:
- 8-12 authentic Indian dishes that can be made with these ingredients
- Each dish should include: name, category, brief description, cooking time, and price
- Group dishes by category (Vegetarian, Non-Vegetarian, Appetizers, Breads, Rice, Desserts)
- Use primarily the available ingredients listed above
- Include vegetarian and non-vegetarian options
- Provide realistic cooking times and pricing
- Consider Indian cooking techniques and spice combinations

Format the response as a beautiful, readable menu that customers can easily understand.`;

    // Add category and preference constraints
    if (category) {
      prompt += `\n\nFocus on dishes in the "${category}" category.`;
    }
    
    if (preferences) {
      prompt += `\n\nCater to these dietary preferences: ${preferences}`;
    }
    
    // Generate menu using AI
    const { text } = await ai.generate({
      prompt,
    });
    
    console.log(`[MENU AGENT] AI generated menu successfully`);
    
    // Return the formatted text directly
    return {
      success: true,
      requestType,
      message: 'Here\'s our AI-generated menu based on current ingredient availability:',
      menuDisplay: text, // Direct text output for rendering
      totalAvailable: 'Generated dynamically', // Since we're not counting individual dishes
      category: category || 'all',
      preferences: preferences || 'none',
      note: 'Menu is generated in real-time by AI based on current inventory',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`[MENU AGENT] Error processing ${requestType}:`, error);
    
    return {
      success: false,
      requestType,
      error: `Failed to process ${requestType}`,
      details: error instanceof Error ? error.message : 'Unknown error',
      message: 'Sorry, I couldn\'t process your request right now. Please try again later.'
    };
  }
}
