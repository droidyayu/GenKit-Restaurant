import 'dotenv/config';
import { ai } from '../genkit.js';
import { chefAgent } from '../chefAgent.js';
import type { KitchenState } from '../kitchenTypes.js';

async function testCompleteOrderFlow() {
  console.log('🧪 Complete Order Flow Test\n');

  // Initialize session state
  const initialState: KitchenState = {
    customerId: 1,
    customerName: 'Test Customer',
    orderHistory: []
  };

  const chat = ai
    .createSession({ initialState })
    .chat(chefAgent);

  try {
    // Step 1: Ask for menu
    console.log('📋 Step 1: Menu Request');
    const menuResult = await chat.send('What\'s in the menu?');
    console.log('✅ Menu Response:');
    console.log(menuResult.text.substring(0, 400) + '...\n');

    // Step 2: Place an order
    console.log('📋 Step 2: Place Order');
    const orderResult = await chat.send('I want Palak Paneer');
    console.log('✅ Order Response:');
    console.log(orderResult.text.substring(0, 400) + '...\n');

    // Step 3: Provide order details
    console.log('📋 Step 3: Provide Order Details');
    const detailsResult = await chat.send('Mild Spicy for 1 people');
    console.log('✅ Details Response:');
    console.log(detailsResult.text.substring(0, 400) + '...\n');

    // Step 4: Confirm order
    console.log('📋 Step 4: Confirm Order');
    const confirmResult = await chat.send('Confirm the order');
    console.log('✅ Confirm Response:');
    console.log(confirmResult.text.substring(0, 400) + '...\n');

    // Step 5: Check order status
    console.log('📋 Step 5: Check Order Status');
    const statusResult = await chat.send('What my order status?');
    console.log('✅ Status Response:');
    console.log(statusResult.text.substring(0, 400) + '...\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  console.log('✅ Complete order flow test finished!');
}

testCompleteOrderFlow();
