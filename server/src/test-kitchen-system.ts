import { kitchenOrchestratorAgent, availableDishesFlow, menuRecipeAgent, orderManagerAgent, chefAgent, waiterAgent } from './kitchen/index.js';

console.log('🧪 Testing Kitchen Multi-Agent System...\n');

async function testKitchenSystem() {
  try {
    // Test 1: Available Dishes Flow
    console.log('1️⃣ Testing Available Dishes Flow...');
    const dishesResult = await availableDishesFlow({});
    console.log('✅ Available Dishes Flow:', dishesResult.success ? 'SUCCESS' : 'FAILED');
    if (dishesResult.success) {
      console.log(`   Found ${dishesResult.totalAvailable} available dishes`);
    }
    console.log();

    // Test 2: Menu Recipe Agent
    console.log('2️⃣ Testing Menu Recipe Agent...');
    const menuResult = await menuRecipeAgent({
      userId: 'test-user-1',
      requestType: 'menu_generation'
    });
    console.log('✅ Menu Recipe Agent:', menuResult.success ? 'SUCCESS' : 'FAILED');
    if (menuResult.success) {
      console.log(`   Generated menu with ${menuResult.totalAvailable} dishes`);
    }
    console.log();

    // Test 3: Order Manager Agent
    console.log('3️⃣ Testing Order Manager Agent...');
    const orderResult = await orderManagerAgent({
      userId: 'test-user-1',
      dish: 'Palak Paneer'
    });
    console.log('✅ Order Manager Agent:', orderResult.success ? 'SUCCESS' : 'FAILED');
    if (orderResult.success) {
      console.log(`   Order created: ${orderResult.orderId}`);
      console.log(`   Dish: ${orderResult.dish}`);
      console.log(`   Status: ${orderResult.status}`);
    }
    console.log();

    // Test 4: Chef Agent (if order was created)
    if (orderResult.success) {
      console.log('4️⃣ Testing Chef Agent...');
      const chefResult = await chefAgent({
        orderId: orderResult.orderId,
        dishName: orderResult.dish,
        userId: orderResult.userId
      });
      console.log('✅ Chef Agent:', chefResult.success ? 'SUCCESS' : 'FAILED');
      if (chefResult.success) {
        console.log(`   Cooking completed in ${chefResult.totalCookTime} minutes`);
        console.log(`   Final status: ${chefResult.status}`);
      }
      console.log();

      // Test 5: Waiter Agent
      if (chefResult.success) {
        console.log('5️⃣ Testing Waiter Agent...');
        const waiterResult = await waiterAgent({
          userId: orderResult.userId,
          orderId: orderResult.orderId,
          action: 'checkStatus'
        });
        console.log('✅ Waiter Agent:', waiterResult.success ? 'SUCCESS' : 'FAILED');
        if (waiterResult.success) {
          console.log(`   Status: ${waiterResult.status}`);
          console.log(`   Message: ${waiterResult.message}`);
        }
        console.log();
      }
    }

    // Test 6: Kitchen Orchestrator Agent
    console.log('6️⃣ Testing Kitchen Orchestrator Agent...');
    const orchestratorResult = await kitchenOrchestratorAgent({
      userId: 'test-user-2',
      message: 'Show me the menu'
    });
    console.log('✅ Kitchen Orchestrator Agent:', orchestratorResult.success ? 'SUCCESS' : 'FAILED');
    if (orchestratorResult.success) {
      console.log(`   Intent: ${orchestratorResult.intent}`);
      console.log(`   Action: ${orchestratorResult.action}`);
      console.log(`   Total available: ${orchestratorResult.totalAvailable}`);
    }
    console.log();

    console.log('🎉 Kitchen Multi-Agent System Test Completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testKitchenSystem();
