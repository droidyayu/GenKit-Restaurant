import { ai, z } from '../genkit.js';
import { KITCHEN_INVENTORY, getInventoryByCategory } from '../kitchenData.js';

export const inventoryTool = ai.defineTool(
  {
    name: 'inventoryTool',
    description: 'Get current kitchen inventory and ingredient availability',
    inputSchema: z.object({
      category: z.string().optional().describe('Optional category filter (Proteins, Vegetables, Grains, Dairy, Spices, Herbs, Condiments)'),
    }),
  },
  async ({ category }) => {
    if (category) {
      const categories = getInventoryByCategory();
      return categories[category] || [];
    }
    
    return Object.values(KITCHEN_INVENTORY);
  }
);

export const ingredientDetailsTool = ai.defineTool(
  {
    name: 'ingredientDetailsTool',
    description: 'Get detailed information about specific ingredients',
    inputSchema: z.object({
      ingredientName: z.string().optional().describe('Specific ingredient name (if not provided, returns all)'),
    }),
  },
  async ({ ingredientName }) => {
    if (ingredientName) {
      const ingredient = KITCHEN_INVENTORY[ingredientName];
      if (!ingredient) {
        return {
          ingredient: ingredientName,
          available: false,
          error: 'Ingredient not found'
        };
      }
      return ingredient;
    }
    
    const categories = getInventoryByCategory();
    return {
      totalIngredients: Object.keys(KITCHEN_INVENTORY).length,
      categories,
      summary: {
        proteins: categories['Proteins']?.length || 0,
        vegetables: categories['Vegetables']?.length || 0,
        grains: categories['Grains']?.length || 0,
        dairy: categories['Dairy']?.length || 0,
        spices: categories['Spices']?.length || 0,
        herbs: categories['Herbs']?.length || 0,
        condiments: categories['Condiments']?.length || 0,
      }
    };
  }
);
