const {kitchenOrchestratorFlow} = require('../lib/flows/kitchenOrchestratorFlow.js');
const {getRecentOrders} = require('../lib/data/orderRepository.js');
const {loadCsv, printTestResults, setupGracefulShutdown} = require('./utils/common.js');

async function testWaiterAgent() {
  console.log('🍽️  STARTING WAITER AGENT INTEGRATION TESTS\n');
  console.log('=' .repeat(60));

  try {
    // Load test cases from CSV
    const testCases = loadCsv('waiterAgent');
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

      const userId = `test-waiter-${testCase.id}`;
      let scenarioPassed = true;

      try {
        // Create a test order first to have something to check status on
        console.log(`📝 Creating test order for user ${userId}...`);
        const orderResult = await kitchenOrchestratorFlow.run({
          userId: userId,
          message: "I want 2 Butter Chicken medium spicy"
        });

        console.log(`✅ Test order created: ${orderResult.result.message.substring(0, 60)}...`);

        // Small delay to let the order be processed
        await new Promise(resolve => setTimeout(resolve, 500));

        // Run status inquiry conversation steps
        for (const step of testCase.steps) {
          console.log(`\n👤 Step ${step.turn}: "${step.input}"`);

          const result = await kitchenOrchestratorFlow.run({
            userId: userId,
            message: step.input
          });

          console.log(`🍽️  Agent: "${result.result.message.substring(0, 80)}${result.result.message.length > 80 ? '...' : ''}"`);

          // Check if the response contains status-related keywords
          const message = result.result.message.toLowerCase();
          const hasStatusKeywords = message.includes('order') ||
                                   message.includes('ready') ||
                                   message.includes('cooking') ||
                                   message.includes('delivery') ||
                                   message.includes('status') ||
                                   message.includes('eta') ||
                                   message.includes('time') ||
                                   message.includes('progress') ||
                                   message.includes('waiting');

          if (!hasStatusKeywords) {
            console.log('⚠️  Warning: Response may not be status-related');
            scenarioPassed = false;
          }

          // Small delay between steps
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Verify order status was checked by looking at recent orders
        console.log(`\n🔍 VERIFYING ORDER STATUS CHECK...`);
        const ordersAfter = await getRecentOrders(userId, 5);

        if (ordersAfter.length > 0) {
          const order = ordersAfter[0];
          console.log('✅ Order found in database:');
          console.log(`📋 Order ID: ${order.orderId}`);
          console.log(`👤 Customer: ${order.customerName}`);
          console.log(`📊 Status: ${order.status}`);
          console.log(`💰 Total: $${order.totalAmount}`);
          console.log(`🍽️  Dishes: ${order.dishes.map(d => `${d.name} x${d.quantity}${d.spiceLevel ? ` (${d.spiceLevel})` : ''}`).join(', ')}`);

          // Check if order was marked as complete (typical for status checks)
          if (order.status === 'DELIVERED') {
            console.log('✅ Order status was properly updated');
          } else {
            console.log(`ℹ️  Order status: ${order.status} (this is expected for some scenarios)`);
          }
        } else {
          console.log('❌ No orders found in database - status check may have failed');
          scenarioPassed = false;
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
testWaiterAgent();
