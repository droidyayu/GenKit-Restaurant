import 'dotenv/config';
import { ai } from '../genkit.js';
import { chefAgent } from '../chefAgent.js';
import type { KitchenState } from '../kitchenTypes.js';

async function testIntegration() {
  console.log('🧪 Kitchen System Integration Test\n');

  // Initialize session state
  const initialState: KitchenState = {
    customerId: 1,
    customerName: 'Test Customer',
    orderHistory: []
  };

  // Test 1: Menu Request
  console.log('📋 Test 1: Menu Request');
  try {
    const chat = ai
      .createSession({ initialState })
      .chat(chefAgent);
    
    const result = await chat.send('What\'s in the menu?');
    console.log('✅ Menu Response:');
    console.log(result.text.substring(0, 300) + '...');
  } catch (error: any) {
    console.error('❌ Menu Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Order Request
  console.log('📋 Test 2: Order Request');
  try {
    const chat = ai
      .createSession({ initialState })
      .chat(chefAgent);
    
    const result = await chat.send('I want Palak Paneer');
    console.log('✅ Order Response:');
    console.log(result.text.substring(0, 300) + '...');
  } catch (error: any) {
    console.error('❌ Order Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Order Status Request
  console.log('📋 Test 3: Order Status Request');
  try {
    const chat = ai
      .createSession({ initialState })
      .chat(chefAgent);
    
    const result = await chat.send('What my order status?');
    console.log('✅ Status Response:');
    console.log(result.text.substring(0, 300) + '...');
  } catch (error: any) {
    console.error('❌ Status Error:', error.message);
  }

  console.log('\n✅ Integration test completed!');
}

testIntegration();
