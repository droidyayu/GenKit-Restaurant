import { ai, z } from '../genkit.js';
import { inventoryTool } from '../tools/inventoryTool.js';

// Recipe database with ingredient requirements
const RECIPE_DATABASE = [
  {
    name: 'Palak Paneer',
    category: 'Vegetarian',
    ingredients: ['Paneer', 'Spinach', 'Tomatoes', 'Cream', 'Spices'],
    cookTime: 15,
    description: 'Fresh spinach cooked with cottage cheese in aromatic spices',
    price: 12.99
  },
  {
    name: 'Paneer Butter Masala',
    category: 'Vegetarian',
    ingredients: ['Paneer', 'Tomatoes', 'Cream', 'Butter', 'Spices'],
    cookTime: 15,
    description: 'Cottage cheese in rich tomato and cream gravy',
    price: 13.99
  },
  {
    name: 'Dal Tadka',
    category: 'Vegetarian',
    ingredients: ['Lentils', 'Onions', 'Tomatoes', 'Spices'],
    cookTime: 12,
    description: 'Yellow lentils tempered with aromatic spices',
    price: 9.99
  },
  {
    name: 'Gobi Masala',
    category: 'Vegetarian',
    ingredients: ['Cauliflower', 'Onions', 'Tomatoes', 'Spices'],
    cookTime: 15,
    description: 'Cauliflower cooked with onions, tomatoes, and spices',
    price: 11.99
  },
  {
    name: 'Mixed Vegetable Curry',
    category: 'Vegetarian',
    ingredients: ['Carrots', 'Peas', 'Bell Peppers', 'Onions', 'Tomatoes'],
    cookTime: 12,
    description: 'Assorted vegetables in flavorful curry sauce',
    price: 10.99
  },
  {
    name: 'Samosas',
    category: 'Appetizers',
    ingredients: ['Potatoes', 'Peas', 'Wheat', 'Oil', 'Spices'],
    cookTime: 8,
    description: 'Crispy, golden-fried pastries filled with spiced potatoes and peas',
    price: 6.99
  },
  {
    name: 'Butter Chicken',
    category: 'Non-Vegetarian',
    ingredients: ['Chicken', 'Tomatoes', 'Cream', 'Butter', 'Spices'],
    cookTime: 18,
    description: 'Tender chicken in rich tomato and cream gravy',
    price: 15.99
  },
  {
    name: 'Chicken Biryani',
    category: 'Non-Vegetarian',
    ingredients: ['Chicken', 'Rice', 'Onions', 'Spices'],
    cookTime: 25,
    description: 'Fragrant rice with tender chicken and aromatic spices',
    price: 16.99
  },
  {
    name: 'Fish Curry',
    category: 'Non-Vegetarian',
    ingredients: ['Fish', 'Coconut Milk', 'Onions', 'Spices'],
    cookTime: 20,
    description: 'Fresh fish in coconut milk and spices',
    price: 17.99
  },
  {
    name: 'Lamb Curry',
    category: 'Non-Vegetarian',
    ingredients: ['Lamb', 'Onions', 'Tomatoes', 'Spices'],
    cookTime: 25,
    description: 'Tender lamb in rich onion and tomato gravy',
    price: 18.99
  },
  {
    name: 'Aloo Paratha',
    category: 'Breads',
    ingredients: ['Potatoes', 'Wheat', 'Oil', 'Spices'],
    cookTime: 8,
    description: 'Whole wheat flatbread stuffed with spiced potato filling',
    price: 4.99
  },
  {
    name: 'Naan',
    category: 'Breads',
    ingredients: ['Wheat', 'Yogurt', 'Oil'],
    cookTime: 5,
    description: 'Soft leavened flatbread baked in tandoor',
    price: 3.99
  },
  {
    name: 'Jeera Rice',
    category: 'Rice',
    ingredients: ['Rice', 'Onions', 'Spices'],
    cookTime: 10,
    description: 'Fragrant basmati rice with cumin seeds',
    price: 5.99
  },
  {
    name: 'Kheer',
    category: 'Desserts',
    ingredients: ['Milk', 'Sugar', 'Cardamom'],
    cookTime: 20,
    description: 'Traditional rice pudding with cardamom and nuts',
    price: 6.99
  },
  {
    name: 'Tiramisu',
    category: 'Desserts',
    ingredients: ['Mascarpone', 'Coffee', 'Ladyfingers', 'Eggs'],
    cookTime: 15,
    description: 'Italian coffee-flavored dessert',
    price: 8.99
  }
];

export const availableDishesFlow = ai.defineFlow(
  {
    name: 'availableDishesFlow',
    inputSchema: z.object({
      category: z.string().optional().describe('Optional category filter'),
      preferences: z.string().optional().describe('Optional dietary preferences'),
    }),
  },
  async ({ category, preferences }) => {
    console.log('[AVAILABLE DISHES FLOW] Computing feasible dishes...');
    
    try {
      // Get current inventory
      const inventory = await inventoryTool({});
      const availableIngredients = inventory.filter((item: any) => 
        item.available && item.quantity > 0
      );
      
      // Create ingredient availability map
      const ingredientMap = new Map(
        availableIngredients.map((item: any) => [item.ingredient.toLowerCase(), item])
      );
      
      // Filter recipes based on available ingredients
      const feasibleDishes = RECIPE_DATABASE.filter(recipe => {
        const hasAllIngredients = recipe.ingredients.every(ingredient => {
          const available = ingredientMap.get(ingredient.toLowerCase());
          return available && (available as any).quantity > 0;
        });
        return hasAllIngredients;
      });
      
      // Apply category filter if specified
      let filteredDishes = feasibleDishes;
      if (category) {
        filteredDishes = feasibleDishes.filter(dish => 
          dish.category.toLowerCase().includes(category.toLowerCase())
        );
      }
      
      // Apply dietary preferences if specified
      if (preferences) {
        const pref = preferences.toLowerCase();
        if (pref.includes('vegetarian')) {
          filteredDishes = filteredDishes.filter(dish => 
            dish.category === 'Vegetarian'
          );
        } else if (pref.includes('non-vegetarian') || pref.includes('meat')) {
          filteredDishes = filteredDishes.filter(dish => 
            dish.category === 'Non-Vegetarian'
          );
        }
      }
      
      console.log(`[AVAILABLE DISHES FLOW] Found ${filteredDishes.length} feasible dishes`);
      
      return {
        success: true,
        feasibleDishes: filteredDishes,
        totalAvailable: filteredDishes.length,
        category: category || 'all',
        preferences: preferences || 'none',
        inventoryStatus: 'healthy',
        message: `Generated ${filteredDishes.length} available dishes based on current inventory`
      };
      
    } catch (error) {
      console.error('[AVAILABLE DISHES FLOW] Error:', error);
      
      return {
        success: false,
        error: 'Failed to compute available dishes',
        details: error instanceof Error ? error.message : 'Unknown error',
        feasibleDishes: [],
        totalAvailable: 0
      };
    }
  }
);
