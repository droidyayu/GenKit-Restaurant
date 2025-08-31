
import type { InventoryItem, MenuItem } from './kitchenTypes.js';

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

export const KITCHEN_MENU: MenuItem[] = [
  // Vegetarian Dishes
  {
    name: 'Palak Paneer',
    category: 'Vegetarian',
    description: 'Fresh spinach cooked with cottage cheese in aromatic spices',
    spiceLevels: ['Mild', 'Medium', 'Hot', 'Extra Hot'],
    estimatedTime: '15-20 minutes',
    price: 12.99
  },
  {
    name: 'Paneer Butter Masala',
    category: 'Vegetarian',
    description: 'Cottage cheese in rich tomato and cream gravy',
    spiceLevels: ['Mild', 'Medium', 'Hot', 'Extra Hot'],
    estimatedTime: '15-20 minutes',
    price: 13.99
  },
  {
    name: 'Dal Tadka',
    category: 'Vegetarian',
    description: 'Yellow lentils tempered with aromatic spices',
    spiceLevels: ['Mild', 'Medium', 'Hot'],
    estimatedTime: '12-15 minutes',
    price: 9.99
  },
  {
    name: 'Gobi Masala',
    category: 'Vegetarian',
    description: 'Cauliflower cooked with onions, tomatoes, and spices',
    spiceLevels: ['Mild', 'Medium', 'Hot', 'Extra Hot'],
    estimatedTime: '15-18 minutes',
    price: 11.99
  },
  {
    name: 'Mixed Vegetable Curry',
    category: 'Vegetarian',
    description: 'Assorted vegetables in flavorful curry sauce',
    spiceLevels: ['Mild', 'Medium', 'Hot'],
    estimatedTime: '12-15 minutes',
    price: 10.99
  },
  
  // Non-Vegetarian Dishes
  {
    name: 'Butter Chicken',
    category: 'Non-Vegetarian',
    description: 'Tender chicken in rich tomato and cream gravy',
    spiceLevels: ['Mild', 'Medium', 'Hot', 'Extra Hot'],
    estimatedTime: '18-22 minutes',
    price: 15.99
  },
  {
    name: 'Chicken Biryani',
    category: 'Non-Vegetarian',
    description: 'Fragrant rice with tender chicken and aromatic spices',
    spiceLevels: ['Mild', 'Medium', 'Hot'],
    estimatedTime: '25-30 minutes',
    price: 16.99
  },
  {
    name: 'Fish Curry',
    category: 'Non-Vegetarian',
    description: 'Fresh fish in coconut milk and spices',
    spiceLevels: ['Mild', 'Medium', 'Hot'],
    estimatedTime: '20-25 minutes',
    price: 17.99
  },
  {
    name: 'Lamb Curry',
    category: 'Non-Vegetarian',
    description: 'Tender lamb in rich onion and tomato gravy',
    spiceLevels: ['Mild', 'Medium', 'Hot', 'Extra Hot'],
    estimatedTime: '25-30 minutes',
    price: 18.99
  },
  {
    name: 'Prawn Curry',
    category: 'Non-Vegetarian',
    description: 'Fresh prawns in coconut milk and spices',
    spiceLevels: ['Mild', 'Medium', 'Hot'],
    estimatedTime: '20-25 minutes',
    price: 19.99
  },
  
  // Breads
  {
    name: 'Naan',
    category: 'Breads',
    description: 'Soft leavened bread baked in tandoor',
    spiceLevels: [],
    estimatedTime: '5-8 minutes',
    price: 2.99
  },
  {
    name: 'Roti',
    category: 'Breads',
    description: 'Whole wheat flatbread',
    spiceLevels: [],
    estimatedTime: '3-5 minutes',
    price: 1.99
  },
  {
    name: 'Garlic Naan',
    category: 'Breads',
    description: 'Naan bread topped with garlic and butter',
    spiceLevels: [],
    estimatedTime: '5-8 minutes',
    price: 3.99
  },
  
  // Rice
  {
    name: 'Basmati Rice',
    category: 'Rice',
    description: 'Fragrant long-grain basmati rice',
    spiceLevels: [],
    estimatedTime: '15-18 minutes',
    price: 3.99
  },
  {
    name: 'Jeera Rice',
    category: 'Rice',
    description: 'Basmati rice flavored with cumin seeds',
    spiceLevels: [],
    estimatedTime: '15-18 minutes',
    price: 4.99
  },
  {
    name: 'Biryani Rice',
    category: 'Rice',
    description: 'Aromatic rice with spices and herbs',
    spiceLevels: [],
    estimatedTime: '20-25 minutes',
    price: 5.99
  },
  
  // Side Dishes
  {
    name: 'Raita',
    category: 'Side Dishes',
    description: 'Cooling yogurt with cucumber and mint',
    spiceLevels: [],
    estimatedTime: '3-5 minutes',
    price: 2.99
  },
  {
    name: 'Salad',
    category: 'Side Dishes',
    description: 'Fresh mixed vegetable salad',
    spiceLevels: [],
    estimatedTime: '3-5 minutes',
    price: 2.99
  },
  {
    name: 'Dal',
    category: 'Side Dishes',
    description: 'Simple lentil preparation',
    spiceLevels: [],
    estimatedTime: '10-12 minutes',
    price: 3.99
  },
  
  // Desserts
  {
    name: 'Gulab Jamun',
    category: 'Desserts',
    description: 'Sweet milk dumplings in rose-flavored syrup',
    spiceLevels: [],
    estimatedTime: '10-15 minutes',
    price: 4.99
  },
  {
    name: 'Rasmalai',
    category: 'Desserts',
    description: 'Soft cottage cheese patties in sweetened milk',
    spiceLevels: [],
    estimatedTime: '10-15 minutes',
    price: 5.99
  },
  {
    name: 'Gajar Ka Halwa',
    category: 'Desserts',
    description: 'Carrot pudding with nuts and cardamom',
    spiceLevels: [],
    estimatedTime: '15-20 minutes',
    price: 4.99
  },
  {
    name: 'Kulfi',
    category: 'Desserts',
    description: 'Traditional Indian ice cream with cardamom',
    spiceLevels: [],
    estimatedTime: '5-8 minutes',
    price: 3.99
  },
  {
    name: 'Mango Lassi',
    category: 'Desserts',
    description: 'Sweet yogurt drink with fresh mango',
    spiceLevels: [],
    estimatedTime: '3-5 minutes',
    price: 3.99
  }
];

export function getInventoryByCategory() {
  const categories: Record<string, InventoryItem[]> = {};
  
  Object.values(KITCHEN_INVENTORY).forEach(item => {
    if (!categories[item.category]) {
      categories[item.category] = [];
    }
    categories[item.category].push(item);
  });
  
  return categories;
}

export function getMenuByCategory() {
  const categories: Record<string, MenuItem[]> = {};
  
  KITCHEN_MENU.forEach(item => {
    if (!categories[item.category]) {
      categories[item.category] = [];
    }
    categories[item.category].push(item);
  });
  
  return categories;
}
