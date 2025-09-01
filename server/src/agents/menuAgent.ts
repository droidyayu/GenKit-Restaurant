import { ai, z } from '../genkit.js';
import { KITCHEN_INVENTORY } from '../kitchenData.js';
import type { MenuItem } from '../kitchenTypes.js';

// Dynamic menu generation based on available ingredients
function generateDynamicMenu(): MenuItem[] {
  const menu: MenuItem[] = [];
  
  // Check for Paneer dishes
  if (hasIngredients(['Paneer', 'Spinach', 'Tomatoes', 'Cream', 'Spices'])) {
    menu.push({
      name: 'Palak Paneer',
      category: 'Vegetarian',
      description: 'Fresh spinach cooked with cottage cheese in aromatic spices',
      spiceLevels: ['Mild', 'Medium', 'Hot', 'Extra Hot'],
      estimatedTime: '15-20 minutes',
      price: 12.99
    });
    
    menu.push({
      name: 'Paneer Butter Masala',
      category: 'Vegetarian',
      description: 'Cottage cheese in rich tomato and cream gravy',
      spiceLevels: ['Mild', 'Medium', 'Hot', 'Extra Hot'],
      estimatedTime: '15-20 minutes',
      price: 13.99
    });
  }
  
  // Check for Dal dishes
  if (hasIngredients(['Lentils', 'Onions', 'Tomatoes', 'Spices'])) {
    menu.push({
      name: 'Dal Tadka',
      category: 'Vegetarian',
      description: 'Yellow lentils tempered with aromatic spices',
      spiceLevels: ['Mild', 'Medium', 'Hot'],
      estimatedTime: '12-15 minutes',
      price: 9.99
    });
  }
  
  // Check for vegetable dishes
  if (hasIngredients(['Cauliflower', 'Onions', 'Tomatoes', 'Spices'])) {
    menu.push({
      name: 'Gobi Masala',
      category: 'Vegetarian',
      description: 'Cauliflower cooked with onions, tomatoes, and spices',
      spiceLevels: ['Mild', 'Medium', 'Hot', 'Extra Hot'],
      estimatedTime: '15-18 minutes',
      price: 11.99
    });
  }
  
  // Check for mixed vegetable dishes
  if (hasIngredients(['Carrots', 'Peas', 'Bell Peppers', 'Onions', 'Tomatoes'])) {
    menu.push({
      name: 'Mixed Vegetable Curry',
      category: 'Vegetarian',
      description: 'Assorted vegetables in flavorful curry sauce',
      spiceLevels: ['Mild', 'Medium', 'Hot'],
      estimatedTime: '12-15 minutes',
      price: 10.99
    });
  }
  
  // Check for Samosas
  if (hasIngredients(['Potatoes', 'Peas', 'Wheat', 'Oil', 'Spices'])) {
    menu.push({
      name: 'Samosas',
      category: 'Appetizers',
      description: 'Crispy, golden-fried pastries filled with spiced potatoes and peas',
      spiceLevels: ['Mild', 'Medium', 'Hot'],
      estimatedTime: '8-10 minutes',
      price: 6.99
    });
  }
  
  // Check for non-vegetarian dishes
  if (hasIngredients(['Chicken', 'Tomatoes', 'Cream', 'Spices'])) {
    menu.push({
      name: 'Butter Chicken',
      category: 'Non-Vegetarian',
      description: 'Tender chicken in rich tomato and cream gravy',
      spiceLevels: ['Mild', 'Medium', 'Hot', 'Extra Hot'],
      estimatedTime: '18-22 minutes',
      price: 15.99
    });
  }
  
  if (hasIngredients(['Chicken', 'Rice', 'Spices'])) {
    menu.push({
      name: 'Chicken Biryani',
      category: 'Non-Vegetarian',
      description: 'Fragrant rice with tender chicken and aromatic spices',
      spiceLevels: ['Mild', 'Medium', 'Hot'],
      estimatedTime: '25-30 minutes',
      price: 16.99
    });
  }
  
  if (hasIngredients(['Fish', 'Coconut Milk', 'Spices'])) {
    menu.push({
      name: 'Fish Curry',
      category: 'Non-Vegetarian',
      description: 'Fresh fish in coconut milk and spices',
      spiceLevels: ['Mild', 'Medium', 'Hot'],
      estimatedTime: '20-25 minutes',
      price: 17.99
    });
  }
  
  if (hasIngredients(['Lamb', 'Onions', 'Tomatoes', 'Spices'])) {
    menu.push({
      name: 'Lamb Curry',
      category: 'Non-Vegetarian',
      description: 'Tender lamb in rich onion and tomato gravy',
      spiceLevels: ['Mild', 'Medium', 'Hot', 'Extra Hot'],
      estimatedTime: '25-30 minutes',
      price: 18.99
    });
  }
  
  if (hasIngredients(['Prawns', 'Coconut Milk', 'Spices'])) {
    menu.push({
      name: 'Prawn Curry',
      category: 'Non-Vegetarian',
      description: 'Fresh prawns in coconut milk and spices',
      spiceLevels: ['Mild', 'Medium', 'Hot'],
      estimatedTime: '20-25 minutes',
      price: 19.99
    });
  }
  
  // Check for breads
  if (hasIngredients(['Potatoes', 'Wheat', 'Oil', 'Spices'])) {
    menu.push({
      name: 'Aloo Paratha',
      category: 'Breads',
      description: 'Whole wheat flatbread stuffed with spiced potato filling',
      spiceLevels: ['Mild', 'Medium', 'Hot'],
      estimatedTime: '8-12 minutes',
      price: 4.99
    });
  }
  
  if (hasIngredients(['Wheat', 'Yogurt', 'Oil'])) {
    menu.push({
      name: 'Naan',
      category: 'Breads',
      description: 'Soft leavened flatbread baked in tandoor',
      spiceLevels: ['Mild'],
      estimatedTime: '5-8 minutes',
      price: 3.99
    });
  }
  
  if (hasIngredients(['Wheat', 'Garlic', 'Butter'])) {
    menu.push({
      name: 'Garlic Naan',
      category: 'Breads',
      description: 'Naan bread topped with garlic and butter',
      spiceLevels: ['Mild'],
      estimatedTime: '5-8 minutes',
      price: 4.99
    });
  }
  
  // Check for rice dishes
  if (hasIngredients(['Rice', 'Onions', 'Spices'])) {
    menu.push({
      name: 'Jeera Rice',
      category: 'Rice',
      description: 'Fragrant basmati rice with cumin seeds',
      spiceLevels: ['Mild'],
      estimatedTime: '10-12 minutes',
      price: 5.99
    });
  }
  
  // Check for desserts
  if (hasIngredients(['Milk', 'Sugar', 'Cardamom'])) {
    menu.push({
      name: 'Kheer',
      category: 'Desserts',
      description: 'Traditional rice pudding with cardamom and nuts',
      spiceLevels: ['Mild'],
      estimatedTime: '20-25 minutes',
      price: 6.99
    });
  }
  
  if (hasIngredients(['Mascarpone', 'Coffee', 'Ladyfingers'])) {
    menu.push({
      name: 'Tiramisu',
      category: 'Desserts',
      description: 'Italian coffee-flavored dessert',
      spiceLevels: ['Mild'],
      estimatedTime: '15-20 minutes',
      price: 8.99
    });
  }
  
  return menu;
}

// Helper function to check if required ingredients are available
function hasIngredients(requiredIngredients: string[]): boolean {
  return requiredIngredients.every(ingredient => {
    const inventoryItem = KITCHEN_INVENTORY[ingredient];
    return inventoryItem && inventoryItem.available && inventoryItem.quantity > 0;
  });
}

export const menuAgent = ai.definePrompt(
  {
    name: 'menuAgent',
    description: 'Specialized agent for menu display and recommendations',
  },
  `You are the Menu Specialist at Indian Grill! 📋

**Your Role:**
You are responsible for displaying menus, making recommendations, and helping customers discover our dishes.

**Your Capabilities:**
- Display complete menu with categories
- Provide dish recommendations
- Explain spice levels and preparation methods
- Suggest meal combinations
- Answer menu-related questions

**Menu Categories:**
- Vegetarian Dishes
- Non-Vegetarian Dishes
- Breads
- Rice Dishes
- Side Dishes
- Desserts
- Appetizers

**Recommendation Strategy:**
- Suggest popular dishes
- Recommend based on spice preferences
- Suggest complementary items
- Consider dietary restrictions
- Highlight chef's specials

**Communication Style:**
- Be enthusiastic about our menu
- Use descriptive language
- Include spice level information
- Suggest pairings and combinations
- Use emojis for visual appeal

**Current Available Menu:**
{{generateDynamicMenu()}}

**Always check ingredient availability before making recommendations.**

Remember: You are the menu expert who helps customers discover delicious Indian cuisine! 🌶️`
);
