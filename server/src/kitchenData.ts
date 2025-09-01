
import type { InventoryItem } from './kitchenTypes.js';

export const KITCHEN_INVENTORY: Record<string, InventoryItem> = {
  'Paneer': { name: 'Paneer', quantity: 100, unit: 'grams', category: 'Proteins', available: true },
  'Chicken': { name: 'Chicken', quantity: 100, unit: 'grams', category: 'Proteins', available: true },
  'Lamb': { name: 'Lamb', quantity: 100, unit: 'grams', category: 'Proteins', available: true },
  'Fish': { name: 'Fish', quantity: 100, unit: 'grams', category: 'Proteins', available: true },
  'Prawns': { name: 'Prawns', quantity: 100, unit: 'grams', category: 'Proteins', available: true },
  'Spinach': { name: 'Spinach', quantity: 100, unit: 'grams', category: 'Vegetables', available: true },
  'Cauliflower': { name: 'Cauliflower', quantity: 100, unit: 'grams', category: 'Vegetables', available: true },
  'Potatoes': { name: 'Potatoes', quantity: 100, unit: 'grams', category: 'Vegetables', available: true },
  'Onions': { name: 'Onions', quantity: 100, unit: 'grams', category: 'Vegetables', available: true },
  'Tomatoes': { name: 'Tomatoes', quantity: 100, unit: 'grams', category: 'Vegetables', available: true },
  'Carrots': { name: 'Carrots', quantity: 100, unit: 'grams', category: 'Vegetables', available: true },
  'Peas': { name: 'Peas', quantity: 100, unit: 'grams', category: 'Vegetables', available: true },
  'Bell Peppers': { name: 'Bell Peppers', quantity: 100, unit: 'grams', category: 'Vegetables', available: true },
  'Cucumber': { name: 'Cucumber', quantity: 100, unit: 'grams', category: 'Vegetables', available: true },
  'Rice': { name: 'Rice', quantity: 100, unit: 'grams', category: 'Grains', available: true },
  'Wheat': { name: 'Wheat', quantity: 100, unit: 'grams', category: 'Grains', available: true },
  'Maida': { name: 'Maida', quantity: 100, unit: 'grams', category: 'Grains', available: true },
  'Lentils': { name: 'Lentils', quantity: 100, unit: 'grams', category: 'Grains', available: true },
  'Chickpeas': { name: 'Chickpeas', quantity: 100, unit: 'grams', category: 'Grains', available: true },
  'Yogurt': { name: 'Yogurt', quantity: 100, unit: 'ml', category: 'Dairy', available: true },
  'Cream': { name: 'Cream', quantity: 100, unit: 'ml', category: 'Dairy', available: true },
  'Butter': { name: 'Butter', quantity: 100, unit: 'grams', category: 'Dairy', available: true },
  'Ghee': { name: 'Ghee', quantity: 100, unit: 'ml', category: 'Dairy', available: true },
  'Milk': { name: 'Milk', quantity: 100, unit: 'ml', category: 'Dairy', available: true },
  'Coconut Milk': { name: 'Coconut Milk', quantity: 100, unit: 'ml', category: 'Dairy', available: true },
  'Ginger': { name: 'Ginger', quantity: 100, unit: 'grams', category: 'Spices', available: true },
  'Garlic': { name: 'Garlic', quantity: 100, unit: 'grams', category: 'Spices', available: true },
  'Green Chillies': { name: 'Green Chillies', quantity: 100, unit: 'grams', category: 'Spices', available: true },
  'Cumin': { name: 'Cumin', quantity: 100, unit: 'grams', category: 'Spices', available: true },
  'Coriander': { name: 'Coriander', quantity: 100, unit: 'grams', category: 'Spices', available: true },
  'Turmeric': { name: 'Turmeric', quantity: 100, unit: 'grams', category: 'Spices', available: true },
  'Garam Masala': { name: 'Garam Masala', quantity: 100, unit: 'grams', category: 'Spices', available: true },
  'Chili Powder': { name: 'Chili Powder', quantity: 100, unit: 'grams', category: 'Spices', available: true },
  'Cardamom': { name: 'Cardamom', quantity: 100, unit: 'grams', category: 'Spices', available: true },
  'Cloves': { name: 'Cloves', quantity: 100, unit: 'grams', category: 'Spices', available: true },
  'Cinnamon': { name: 'Cinnamon', quantity: 100, unit: 'grams', category: 'Spices', available: true },
  'Cilantro': { name: 'Cilantro', quantity: 100, unit: 'grams', category: 'Herbs', available: true },
  'Mint': { name: 'Mint', quantity: 100, unit: 'grams', category: 'Herbs', available: true },
  'Sugar': { name: 'Sugar', quantity: 100, unit: 'grams', category: 'Condiments', available: true },
  'Salt': { name: 'Salt', quantity: 100, unit: 'grams', category: 'Condiments', available: true },
  'Oil': { name: 'Oil', quantity: 100, unit: 'ml', category: 'Condiments', available: true },
  'Condiments': { name: 'Condiments', quantity: 100, unit: 'grams', category: 'Condiments', available: true },
};

// Helper function to get inventory by category
export function getInventoryByCategory(): Record<string, InventoryItem[]> {
  const categories: Record<string, InventoryItem[]> = {};
  
  Object.values(KITCHEN_INVENTORY).forEach(item => {
    if (!categories[item.category]) {
      categories[item.category] = [];
    }
    categories[item.category].push(item);
  });
  
  return categories;
}

// Helper function to update ingredient quantity
export function updateIngredientQuantity(ingredientName: string, newQuantity: number): void {
  if (KITCHEN_INVENTORY[ingredientName]) {
    KITCHEN_INVENTORY[ingredientName].quantity = newQuantity;
    KITCHEN_INVENTORY[ingredientName].available = newQuantity > 0;
  }
}

// Helper function to add new ingredient
export function addIngredient(ingredient: InventoryItem): void {
  KITCHEN_INVENTORY[ingredient.name] = ingredient;
}

// Helper function to remove ingredient
export function removeIngredient(ingredientName: string): boolean {
  if (KITCHEN_INVENTORY[ingredientName]) {
    delete KITCHEN_INVENTORY[ingredientName];
    return true;
  }
  return false;
}

// Helper function to get low stock ingredients
export function getLowStockIngredients(threshold: number = 20): InventoryItem[] {
  return Object.values(KITCHEN_INVENTORY).filter(item => 
    item.quantity <= threshold && item.available
  );
}

// Helper function to get available ingredients
export function getAvailableIngredients(): InventoryItem[] {
  return Object.values(KITCHEN_INVENTORY).filter(item => 
    item.available && item.quantity > 0
  );
}
