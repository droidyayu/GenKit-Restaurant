
export interface KitchenState {
  customerId: number;
  customerName: string;
  currentOrder?: {
    orderId: string;
    dishes: KitchenDish[];
    status: 'PENDING' | 'PREP' | 'COOKING' | 'PLATING' | 'READY' | 'DELIVERED';
    estimatedTime: string;
    createdAt: number;
  };
  orderHistory: KitchenOrder[];
}

export interface KitchenDish {
  name: string;
  quantity: number;
  spiceLevel?: 'Mild' | 'Medium' | 'Hot' | 'Extra Hot';
  specialInstructions?: string;
}

export interface KitchenOrder {
  orderId: string;
  dishes: KitchenDish[];
  status: 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  createdAt: number;
  completedAt?: number;
}

export interface InventoryItem {
  name: string;
  quantity: number;
  unit: string;
  category: 'Proteins' | 'Vegetables' | 'Grains' | 'Dairy' | 'Spices' | 'Herbs' | 'Condiments';
  available: boolean;
}

export interface MenuItem {
  name: string;
  category: 'Vegetarian' | 'Non-Vegetarian' | 'Breads' | 'Rice' | 'Side Dishes' | 'Desserts';
  description: string;
  spiceLevels: string[];
  estimatedTime: string;
  price: number;
}
