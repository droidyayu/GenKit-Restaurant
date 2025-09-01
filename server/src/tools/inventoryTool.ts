import { ai, z } from '../genkit.js';

// Dynamic inventory data - in a real system this would come from a database
const DYNAMIC_INVENTORY = [
  { ingredient: 'Paneer', quantity: 100, unit: 'grams', category: 'Proteins', available: true },
  { ingredient: 'Chicken', quantity: 100, unit: 'grams', category: 'Proteins', available: true },
  { ingredient: 'Lamb', quantity: 100, unit: 'grams', category: 'Proteins', available: true },
  { ingredient: 'Fish', quantity: 100, unit: 'grams', category: 'Proteins', available: true },
  { ingredient: 'Spinach', quantity: 100, unit: 'grams', category: 'Vegetables', available: true },
  { ingredient: 'Cauliflower', quantity: 100, unit: 'grams', category: 'Vegetables', available: true },
  { ingredient: 'Potatoes', quantity: 100, unit: 'grams', category: 'Vegetables', available: true },
  { ingredient: 'Onions', quantity: 100, unit: 'grams', category: 'Vegetables', available: true },
  { ingredient: 'Tomatoes', quantity: 100, unit: 'grams', category: 'Vegetables', available: true },
  { ingredient: 'Carrots', quantity: 100, unit: 'grams', category: 'Vegetables', available: true },
  { ingredient: 'Peas', quantity: 100, unit: 'grams', category: 'Vegetables', available: true },
  { ingredient: 'Bell Peppers', quantity: 100, unit: 'grams', category: 'Vegetables', available: true },
  { ingredient: 'Rice', quantity: 100, unit: 'grams', category: 'Grains', available: true },
  { ingredient: 'Wheat', quantity: 100, unit: 'grams', category: 'Grains', available: true },
  { ingredient: 'Lentils', quantity: 100, unit: 'grams', category: 'Grains', available: true },
  { ingredient: 'Yogurt', quantity: 100, unit: 'ml', category: 'Dairy', available: true },
  { ingredient: 'Cream', quantity: 100, unit: 'ml', category: 'Dairy', available: true },
  { ingredient: 'Butter', quantity: 100, unit: 'grams', category: 'Dairy', available: true },
  { ingredient: 'Milk', quantity: 100, unit: 'ml', category: 'Dairy', available: true },
  { ingredient: 'Coconut Milk', quantity: 100, unit: 'ml', category: 'Dairy', available: true },
  { ingredient: 'Ginger', quantity: 100, unit: 'grams', category: 'Spices', available: true },
  { ingredient: 'Garlic', quantity: 100, unit: 'grams', category: 'Spices', available: true },
  { ingredient: 'Cumin', quantity: 100, unit: 'grams', category: 'Spices', available: true },
  { ingredient: 'Turmeric', quantity: 100, unit: 'grams', category: 'Spices', available: true },
  { ingredient: 'Garam Masala', quantity: 100, unit: 'grams', category: 'Spices', available: true },
  { ingredient: 'Cardamom', quantity: 100, unit: 'grams', category: 'Spices', available: true },
  { ingredient: 'Cilantro', quantity: 100, unit: 'grams', category: 'Herbs', available: true },
  { ingredient: 'Mint', quantity: 100, unit: 'grams', category: 'Herbs', available: true },
  { ingredient: 'Sugar', quantity: 100, unit: 'grams', category: 'Condiments', available: true },
  { ingredient: 'Salt', quantity: 100, unit: 'grams', category: 'Condiments', available: true },
  { ingredient: 'Oil', quantity: 100, unit: 'ml', category: 'Condiments', available: true },
  { ingredient: 'Spices', quantity: 100, unit: 'grams', category: 'Condiments', available: true }
];

export const inventoryTool = ai.defineTool(
  {
    name: 'inventoryTool',
    description: 'Get current kitchen inventory and ingredient availability',
    inputSchema: z.object({
      category: z.string().optional().describe('Optional category filter (Proteins, Vegetables, Grains, Dairy, Spices, Herbs, Condiments)'),
    }),
  },
  async ({ category }: { category?: string }) => {
    if (category) {
      const categories = DYNAMIC_INVENTORY.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      }, {} as Record<string, any[]>);
      
      return categories[category] || [];
    }
    
    return DYNAMIC_INVENTORY;
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
  async ({ ingredientName }: { ingredientName?: string }) => {
    if (ingredientName) {
      const ingredient = DYNAMIC_INVENTORY.find(item => 
        item.ingredient.toLowerCase() === ingredientName.toLowerCase()
      );
      
      if (!ingredient) {
        return {
          ingredient: ingredientName,
          available: false,
          error: 'Ingredient not found'
        };
      }
      return ingredient;
    }
    
    const categories = DYNAMIC_INVENTORY.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, any[]>);
    
    return {
      totalIngredients: DYNAMIC_INVENTORY.length,
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
