
import { ai } from '../genkit.js';
import { chefAgent } from '../chefAgent.js';
import { inventoryAgent } from '../inventoryAgent.js';
import { menuAgent } from '../menuAgent.js';
import { orderAgent } from '../orderAgent.js';
import { kitchenWorkflow } from '../kitchenWorkflow.js';
import { deliveryAgent } from '../deliveryAgent.js';
import { getInventory, getMenu, createOrder, getOrderStatus, updateOrderStatus } from '../kitchenTools.js';
import type { KitchenState } from '../kitchenTypes.js';

// Test data
const TEST_KITCHEN_STATE: KitchenState = {
  customerId: 1001,
  customerName: 'Test Customer',
  orderHistory: [],
};

// Test helper function
async function testAgent(agent: any, input: string, expectedTools: string[] = []) {
  console.log(`\n🧪 Testing: ${input}`);
  
  const chat = ai
    .createSession({ initialState: TEST_KITCHEN_STATE })
    .chat(agent);
  
  try {
    const { response } = await chat.send(input);
    
    // Check if expected tools were used
    const toolsUsed = response.messages
      .filter((m: any) => m.role === 'model')
      .flatMap((m: any) =>
        m.content
          .filter((p: any) => !!p.toolRequest)
          .map((p: any) => p.toolRequest?.name)
      );
    
    console.log(`✅ Response received`);
    console.log(`🔧 Tools used: ${toolsUsed.join(', ')}`);
    
    if (expectedTools.length > 0) {
      const allExpectedUsed = expectedTools.every(tool => toolsUsed.includes(tool));
      if (allExpectedUsed) {
        console.log(`✅ All expected tools used: ${expectedTools.join(', ')}`);
      } else {
        console.log(`❌ Missing expected tools. Expected: ${expectedTools.join(', ')}, Got: ${toolsUsed.join(', ')}`);
      }
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Error: ${error}`);
    return false;
  }
}

// Test individual tools
async function testTools() {
  console.log('\n🔧 Testing Kitchen Tools...');
  
  // Test getInventory
  console.log('\n📦 Testing getInventory tool...');
  try {
    const inventory = await getInventory({});
    console.log(`✅ Inventory retrieved: ${inventory.length} items`);
  } catch (error) {
    console.log(`❌ getInventory error: ${error}`);
  }
  
  // Test getMenu
  console.log('\n🍽️ Testing getMenu tool...');
  try {
    const menu = await getMenu({});
    console.log(`✅ Menu retrieved: ${menu.length} items`);
  } catch (error) {
    console.log(`❌ getMenu error: ${error}`);
  }
  
  // Test createOrder
  console.log('\n📋 Testing createOrder tool...');
  try {
    const order = await createOrder({
      dishes: [
        { name: 'Palak Paneer', quantity: 1, spiceLevel: 'Medium' }
      ],
      customerName: 'Test Customer'
    });
    console.log(`✅ Order created: ${order.orderId}`);
  } catch (error) {
    console.log(`❌ createOrder error: ${error}`);
  }
  
  // Test getOrderStatus
  console.log('\n📊 Testing getOrderStatus tool...');
  try {
    const status = await getOrderStatus({});
    console.log(`✅ Order status retrieved: ${status.status}`);
  } catch (error) {
    console.log(`❌ getOrderStatus error: ${error}`);
  }
}

// Test agents
async function testAgents() {
  console.log('\n🤖 Testing Kitchen Agents...');
  
  // Test Inventory Agent
  await testAgent(inventoryAgent, 'What ingredients do you have?', ['getInventory', 'getIngredientDetails']);
  
  // Test Menu Agent
  await testAgent(menuAgent, 'Show me the menu', ['getMenu']);
  
  // Test Order Agent
  await testAgent(orderAgent, 'I want Palak Paneer', []);
  
  // Test Chef Agent (main interface)
  await testAgent(chefAgent, 'What\'s on the menu?', ['menuAgent']);
  
  await testAgent(chefAgent, 'What ingredients do you have?', ['inventoryAgent']);
  
  await testAgent(chefAgent, 'I want Butter Chicken', ['orderAgent']);
}

// Test complete workflow
async function testCompleteWorkflow() {
  console.log('\n🔄 Testing Complete Kitchen Workflow...');
  
  const chat = ai
    .createSession({ initialState: TEST_KITCHEN_STATE })
    .chat(chefAgent);
  
  const steps = [
    { input: 'What\'s on the menu?', description: 'Menu request' },
    { input: 'I want Palak Paneer with Medium spice level', description: 'Order placement' },
    { input: 'How\'s my order?', description: 'Status check' },
  ];
  
  for (const step of steps) {
    console.log(`\n📝 Step: ${step.description}`);
    console.log(`💬 Input: ${step.input}`);
    
    try {
      const { response } = await chat.send(step.input);
      console.log(`✅ Step completed successfully`);
      
      // Show tools used
      const toolsUsed = response.messages
        .filter((m: any) => m.role === 'model')
        .flatMap((m: any) =>
          m.content
            .filter((p: any) => !!p.toolRequest)
            .map((p: any) => p.toolRequest?.name)
        );
      
      if (toolsUsed.length > 0) {
        console.log(`🔧 Tools used: ${toolsUsed.join(', ')}`);
      }
    } catch (error) {
      console.log(`❌ Step failed: ${error}`);
    }
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 Starting Kitchen Multi-Agent System Tests...\n');
  
  // Test tools
  await testTools();
  
  // Test agents
  await testAgents();
  
  // Test complete workflow
  await testCompleteWorkflow();
  
  console.log('\n✅ All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests };
