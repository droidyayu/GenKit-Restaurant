
import 'dotenv/config';
import { ai } from '../genkit.js';
import { getInventory, getMenu, createOrder } from '../kitchenTools.js';
import type { KitchenState } from '../kitchenTypes.js';

const TEST_KITCHEN_STATE: KitchenState = {
  customerId: 1001,
  customerName: 'Test Customer',
  orderHistory: [],
};

async function simpleTest() {
  console.log('🧪 Simple Kitchen System Test\n');
  
  // Test 1: Inventory
  console.log('📦 Testing Inventory...');
  try {
    const inventory = await getInventory({});
    console.log(`✅ Inventory: ${inventory.length} items available`);
  } catch (error) {
    console.log(`❌ Inventory error: ${error}`);
  }
  
  // Test 2: Menu
  console.log('\n🍽️ Testing Menu...');
  try {
    const menu = await getMenu({});
    console.log(`✅ Menu: ${menu.length} items available`);
  } catch (error) {
    console.log(`❌ Menu error: ${error}`);
  }
  
  // Test 3: Order Creation
  console.log('\n📋 Testing Order Creation...');
  try {
    const order = await createOrder({
      dishes: [
        { name: 'Palak Paneer', quantity: 1, spiceLevel: 'Medium' }
      ],
      customerName: 'Test Customer'
    });
    console.log(`✅ Order created: ${order.orderId}`);
  } catch (error) {
    console.log(`❌ Order creation error: ${error}`);
  }
  
  // Test 4: AI Chat
  console.log('\n🤖 Testing AI Chat...');
  try {
    const chat = ai
      .createSession({ initialState: TEST_KITCHEN_STATE })
      .chat();
    
    const { text } = await chat.send('What\'s on the menu?');
    console.log(`✅ AI Response: ${text.substring(0, 100)}...`);
  } catch (error) {
    console.log(`❌ AI Chat error: ${error}`);
  }
  
  console.log('\n✅ Simple test completed!');
}

simpleTest().catch(console.error);
