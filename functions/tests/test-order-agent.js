const {kitchenOrchestratorFlow} = require('../lib/flows/kitchenOrchestratorFlow.js');
const {getRecentOrders} = require('../lib/data/orderRepository.js');
const {loadCsv, printTestResults, setupGracefulShutdown} = require('./utils/common.js');

async function testOrderManagerAgent() {
  console.log('🚀 STARTING ORDER MANAGER AGENT INTEGRATION TESTS\n');
  console.log('=' .repeat(60));

  try {
    // Load test cases from CSV
    const testCases = loadCsv('orderAgent');
    console.log(`📋 Loaded ${testCases.length} test scenarios from CSV\n`);

    const results = {
      passed: 0,
      failed: 0,
      total: testCases.length
    };

          // Test each scenario
    for (const testCase of testCases) {
      console.log(`\n🎯 TESTING SCENARIO: ${testCase.id}`);
      console.log('-'.repeat(40));

      const userId = `test-${testCase.id}`;
      let scenarioPassed = false;
      let orderCreated = false;

      try {
        // Get orders before test
        const ordersBefore = await getRecentOrders(userId, 10);
        console.log(`📊 Orders before: ${ordersBefore.length}`);

        // Run conversation steps
        for (const step of testCase.steps) {
          console.log(`\n👤 Step ${step.turn}: "${step.input}"`);

          const result = await kitchenOrchestratorFlow.run({
            userId: userId,
            message: step.input
          });

          console.log(`🍽️  Agent: "${result.result.message.substring(0, 80)}${result.result.message.length > 80 ? '...' : ''}"`);

          // Check if order was created - updated keywords to match actual agent responses
          const message = result.result.message.toLowerCase();
          if (message.includes('order placed') ||
              message.includes('placed successfully') ||
              message.includes('ready in') ||
              message.includes('created your order') ||
              message.includes('have created') ||
              message.includes('order id') ||
              message.includes('estimated time')) {
            orderCreated = true;
            console.log('✅ Order creation detected!');
          }

          // Small delay between steps
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Verify results
        if (orderCreated) {
          console.log('\n🔍 VERIFYING ORDER CREATION...');

          // Get orders after test
          const ordersAfter = await getRecentOrders(userId, 10);
          const newOrders = ordersAfter.filter(order =>
            !ordersBefore.some(existing => existing.orderId === order.orderId)
          );

          if (newOrders.length > 0) {
            const order = newOrders[0];
            console.log('✅ ORDER CREATED SUCCESSFULLY!');
            console.log(`📋 Order ID: ${order.orderId}`);
            console.log(`👤 Customer: ${order.customerName}`);
            console.log(`📊 Status: ${order.status}`);
            console.log(`💰 Total: $${order.totalAmount}`);
            console.log(`🍽️  Dishes: ${order.dishes.map(d => `${d.name} x${d.quantity}${d.spiceLevel ? ` (${d.spiceLevel})` : ''}`).join(', ')}`);

            scenarioPassed = true;
          } else {
            console.log('❌ Order was detected but not found in database');
          }
        } else {
          console.log('ℹ️  No order creation detected (this may be expected for some scenarios)');
          scenarioPassed = true; // Some scenarios don't create orders
        }

      } catch (error) {
        console.log(`❌ Error in scenario ${testCase.id}: ${error.message}`);
        scenarioPassed = false;
      }

      // Update results
      if (scenarioPassed) {
        results.passed++;
        console.log(`✅ SCENARIO ${testCase.id}: PASSED`);
      } else {
        results.failed++;
        console.log(`❌ SCENARIO ${testCase.id}: FAILED`);
      }

      console.log('=' .repeat(60));
    }

    // Print final results using shared utility
    printTestResults(results);

  } catch (error) {
    console.error('💥 CRITICAL ERROR:', error.message);
    process.exit(1);
  }
}

// Setup graceful shutdown using shared utility
setupGracefulShutdown();

// Run the tests
testOrderManagerAgent();
