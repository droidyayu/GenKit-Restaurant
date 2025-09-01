import { kitchenOrchestratorFlow } from '../src/flows/kitchenOrchestratorFlow.js';

console.log('🧪 Testing Kitchen Agent Orchestration...\n');

async function testOrchestration() {
  try {
    const userId = 'test-user-1';
    
    // Test 1: Menu Request
    console.log('1️⃣ Testing Menu Request...');
    const menuResult = await kitchenOrchestratorFlow({
      userId,
      message: 'What is the menu?'
    });
    console.log('✅ Menu Result:', menuResult.success ? 'SUCCESS' : 'FAILED');
    if (menuResult.success) {
      console.log(`   Found ${menuResult.totalAvailable} dishes`);
    }
    console.log();

    // Test 2: Place Order
    console.log('2️⃣ Testing Order Placement...');
    const orderResult = await kitchenOrchestratorFlow({
      userId,
      message: 'I want to order Palak Paneer'
    });
    console.log('✅ Order Result:', orderResult.success ? 'SUCCESS' : 'FAILED');
    if (orderResult.success) {
      console.log(`   Order ID: ${orderResult.orderId}`);
      console.log(`   Dish: ${orderResult.dishName}`);
      console.log(`   Status: ${orderResult.cookingStatus}`);
      console.log(`   Action: ${orderResult.action}`);
    }
    console.log();

    // Test 3: Check Status
    if (orderResult.success) {
      console.log('3️⃣ Testing Status Check...');
      const statusResult = await kitchenOrchestratorFlow({
        userId,
        message: 'What is the status of my order?'
      });
      console.log('✅ Status Result:', statusResult.success ? 'SUCCESS' : 'FAILED');
      if (statusResult.success) {
        console.log(`   Status: ${statusResult.status}`);
        console.log(`   Progress: ${statusResult.progress}%`);
      }
      console.log();
    }

    console.log('🎉 Orchestration Test Completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testOrchestration();
