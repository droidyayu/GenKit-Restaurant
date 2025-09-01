import { ai, z } from '../genkit.js';
import { availableDishesFlow } from '../flows/availableDishesFlow.js';
import { inventoryTool } from '../tools/inventoryTool.js';

export const menuRecipeAgent = ai.defineFlow(
  {
    name: 'menuRecipeAgent',
    inputSchema: z.object({
      userId: z.string().optional().describe('Optional user ID for personalized suggestions'),
      availableIngredients: z.array(z.string()).optional().describe('Optional list of available ingredients'),
      category: z.string().optional().describe('Optional category filter'),
      preferences: z.string().optional().describe('Optional dietary preferences'),
      requestType: z.enum(['menu_generation', 'recipe_suggestion', 'dessert_upsell']).describe('Type of request'),
    }),
  },
  async ({ userId, availableIngredients, category, preferences, requestType }) => {
    console.log(`[MENU AGENT] Processing ${requestType} request for user ${userId || 'anonymous'}`);
    
    try {
      switch (requestType) {
        case 'menu_generation':
          return await generateDynamicMenu(category, preferences);
          
        case 'recipe_suggestion':
          return await suggestAlternativeRecipes(availableIngredients, preferences);
          
        case 'dessert_upsell':
          return await suggestDesserts(preferences);
          
        default:
          return {
            success: false,
            error: 'Invalid request type',
            message: 'Please specify a valid request type: menu_generation, recipe_suggestion, or dessert_upsell'
          };
      }
      
    } catch (error) {
      console.error(`[MENU AGENT] Error processing ${requestType}:`, error);
      
      return {
        success: false,
        error: `Failed to process ${requestType}`,
        details: error instanceof Error ? error.message : 'Unknown error',
        message: 'Sorry, I couldn\'t process your request right now. Please try again later.'
      };
    }
  }
);

// Generate dynamic menu based on available ingredients
async function generateDynamicMenu(category?: string, preferences?: string) {
  console.log(`[MENU AGENT] Generating dynamic menu (category: ${category}, preferences: ${preferences})`);
  
  const result = await availableDishesFlow({ category, preferences });
  
  if (result.success) {
    // Group dishes by category for better presentation
    const menuByCategory = result.feasibleDishes.reduce((acc: Record<string, any[]>, dish: any) => {
      if (!acc[dish.category]) {
        acc[dish.category] = [];
      }
      acc[dish.category].push(dish);
      return acc;
    }, {} as Record<string, any[]>);
    
    return {
      success: true,
      requestType: 'menu_generation',
      message: 'Here\'s our dynamic menu based on current ingredient availability:',
      menu: menuByCategory,
      totalAvailable: result.totalAvailable,
      category: category || 'all',
      preferences: preferences || 'none',
      note: 'Menu is generated in real-time based on current inventory',
      timestamp: new Date().toISOString()
    };
  } else {
    return {
      success: false,
      requestType: 'menu_generation',
      error: 'Failed to generate menu',
      message: 'Sorry, I couldn\'t generate the menu right now. Please try again later.'
    };
  }
}

// Suggest alternative recipes when ingredients are limited
async function suggestAlternativeRecipes(availableIngredients?: string[], preferences?: string) {
  console.log(`[MENU AGENT] Suggesting alternative recipes based on available ingredients`);
  
  if (!availableIngredients || availableIngredients.length === 0) {
    // Get current inventory to suggest recipes
    const inventory = await inventoryTool({});
    availableIngredients = inventory
      .filter((item: any) => item.available && item.quantity > 0)
      .map((item: any) => item.ingredient);
  }
  
  // Find recipes that can be made with available ingredients
  const result = await availableDishesFlow({ preferences });
  
  if (result.success) {
    // Filter to recipes that use mostly available ingredients
    const alternativeRecipes = result.feasibleDishes.filter((recipe: any) => {
      const availableIngredientCount = recipe.ingredients.filter((ingredient: any) =>
        availableIngredients!.some(available => 
          available.toLowerCase().includes(ingredient.toLowerCase()) ||
          ingredient.toLowerCase().includes(available.toLowerCase())
        )
      ).length;
      
      // Recipe is feasible if at least 80% of ingredients are available
      return (availableIngredientCount / recipe.ingredients.length) >= 0.8;
    });
    
    return {
      success: true,
      requestType: 'recipe_suggestion',
      message: 'Here are some alternative recipes you can try with our current ingredients:',
      alternativeRecipes,
      availableIngredients,
      totalAlternatives: alternativeRecipes.length,
      note: 'These recipes use mostly available ingredients and can be customized',
      suggestions: [
        'Consider substituting missing ingredients with similar alternatives',
        'Ask our chef about ingredient substitutions',
        'We can modify recipes to match available ingredients'
      ]
    };
  } else {
    return {
      success: false,
      requestType: 'recipe_suggestion',
      error: 'Failed to suggest alternative recipes',
      message: 'Sorry, I couldn\'t suggest alternative recipes right now. Please try again later.'
    };
  }
}

// Suggest desserts for upsell
async function suggestDesserts(preferences?: string) {
  console.log(`[MENU AGENT] Suggesting desserts for upsell (preferences: ${preferences})`);
  
  const result = await availableDishesFlow({ 
    category: 'Desserts',
    preferences 
  });
  
  if (result.success && result.feasibleDishes.length > 0) {
    // Select best dessert suggestions
    const dessertSuggestions = result.feasibleDishes.slice(0, 3); // Top 3 desserts
    
    return {
      success: true,
      requestType: 'dessert_upsell',
      message: 'Would you like to try one of our delicious desserts?',
      dessertSuggestions,
      totalDesserts: result.feasibleDishes.length,
      preferences: preferences || 'none',
      upsellMessage: 'Perfect way to complete your meal!',
      note: 'All desserts are made fresh with premium ingredients'
    };
  } else {
    return {
      success: false,
      requestType: 'dessert_upsell',
      error: 'No desserts available',
      message: 'Sorry, we don\'t have any desserts available right now.',
      note: 'Please check back later for our dessert menu'
    };
  }
}
