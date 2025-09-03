const {kitchenOrchestratorFlow} = require('../lib/flows/kitchenOrchestratorFlow.js');
const {loadCsv, printTestResults, setupGracefulShutdown} = require('./utils/common.js');

async function testOrderWithCustomerName() {
  console.log('=== TESTING ORDER CREATION WITH CUSTOMER NAME ===\n');

  // Test the complete order flow (could be moved to CSV in future)
  const conversationSteps = [
    'I want 2 aloo paratha hot spice',
    'My name is John',
    'Yes'
  ];

  console.log('Simulating order conversation with customer name...\n');

  for (let i = 0; i < conversationSteps.length; i++) {
    const userMessage = conversationSteps[i];
    console.log(`👤 Step ${i + 1}: "${userMessage}"`);

    try {
      const result = await kitchenOrchestratorFlow.run({
        userId: 'order-test-user',
        message: userMessage
      });

      console.log(`🍽️  Agent: "${result.result.message.substring(0, 100)}${result.result.message.length > 100 ? '...' : ''}"`);

      // Check if order was created after final step
      if (i === conversationSteps.length - 1) {
        console.log('\n=== CHECKING ORDER CREATION ===');

        // Check if order was created
        const {getRecentOrders} = require('../lib/data/orderRepository.js');
        const recentOrders = await getRecentOrders('order-test-user', 10);

        if (recentOrders.length > 0) {
          const order = recentOrders[0];
          console.log('✅ ORDER CREATED SUCCESSFULLY!');
          console.log(`📋 Order ID: ${order.orderId}`);
          console.log(`👤 Customer: ${order.customerName}`);
          console.log(`📊 Status: ${order.status}`);
          console.log(`💰 Total: $${order.totalAmount}`);
          console.log(`🍽️  Dishes:`);
          order.dishes.forEach((dish, index) => {
            console.log(`   ${index + 1}. ${dish.name} x${dish.quantity} (${dish.spiceLevel})`);
          });
        } else {
          console.log('❌ No order was created');
        }
      }

    } catch (error) {
      console.error(`❌ Error in step ${i + 1}: ${error.message}`);
    }

    console.log('─'.repeat(50));
  }
}

// Setup graceful shutdown using shared utility
setupGracefulShutdown();

testOrderWithCustomerName();
