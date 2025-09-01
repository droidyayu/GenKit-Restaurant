import 'dotenv/config';
import { ai } from '../genkit.js';
import { chefAgent } from '../agents/chefAgent.js';
import type { KitchenState } from '../kitchenTypes.js';

async function testMultiAgentSystem() {
  console.log('🧪 Multi-Agent System Test\n');

  const initialState: KitchenState = {
    customerId: 1,
    customerName: 'Test Customer',
    orderHistory: []
  };

  const chat = ai
    .createSession({ initialState })
    .chat(chefAgent);

  try {
    // Test 1: Menu Request (should call MenuAgent)
    console.log('📋 Test 1: Menu Request');
    console.log('Expected Agent: MenuAgent');
    const menuResult = await chat.send('What\'s on the menu?');
    console.log('✅ Menu Response:');
    console.log(menuResult.text.substring(0, 200) + '...');
    
    const menuTools = menuResult.messages
      .filter(m => m.role === 'model')
      .flatMap(m => m.content
        .filter(p => p.toolRequest)
        .map(p => p.toolRequest?.name)
      );
    console.log('🔧 Agents Called:', menuTools);
    console.log('---\n');

    // Test 2: Inventory Request (should call InventoryAgent)
    console.log('📋 Test 2: Inventory Request');
    console.log('Expected Agent: InventoryAgent');
    const inventoryResult = await chat.send('What ingredients do you have?');
    console.log('✅ Inventory Response:');
    console.log(inventoryResult.text.substring(0, 200) + '...');
    
    const inventoryTools = inventoryResult.messages
      .filter(m => m.role === 'model')
      .flatMap(m => m.content
        .filter(p => p.toolRequest)
        .map(p => p.toolRequest?.name)
      );
    console.log('🔧 Agents Called:', inventoryTools);
    console.log('---\n');

    // Test 3: Order Request (should call OrderAgent)
    console.log('📋 Test 3: Order Request');
    console.log('Expected Agent: OrderAgent');
    const orderResult = await chat.send('I want Aloo Paratha for 1 person. Medium spicy');
    console.log('✅ Order Response:');
    console.log(orderResult.text.substring(0, 200) + '...');
    
    const orderTools = orderResult.messages
      .filter(m => m.role === 'model')
      .flatMap(m => m.content
        .filter(p => p.toolRequest)
        .map(p => p.toolRequest?.name)
      );
    console.log('🔧 Agents Called:', orderTools);
    console.log('---\n');

    // Test 4: Kitchen Request (should call KitchenAgent)
    console.log('📋 Test 4: Kitchen Request');
    console.log('Expected Agent: KitchenAgent');
    const kitchenResult = await chat.send('Start cooking my order');
    console.log('✅ Kitchen Response:');
    console.log(kitchenResult.text.substring(0, 200) + '...');
    
    const kitchenTools = kitchenResult.messages
      .filter(m => m.role === 'model')
      .flatMap(m => m.content
        .filter(p => p.toolRequest)
        .map(p => p.toolRequest?.name)
      );
    console.log('🔧 Agents Called:', kitchenTools);
    console.log('---\n');

    // Test 5: Status Request (should call getOrderStatus directly)
    console.log('📋 Test 5: Status Request');
    console.log('Expected Tool: getOrderStatus');
    const statusResult = await chat.send('Where is my order?');
    console.log('✅ Status Response:');
    console.log(statusResult.text.substring(0, 200) + '...');
    
    const statusTools = statusResult.messages
      .filter(m => m.role === 'model')
      .flatMap(m => m.content
        .filter(p => p.toolRequest)
        .map(p => p.toolRequest?.name)
      );
    console.log('🔧 Tools Called:', statusTools);
    console.log('---\n');

    // Test 6: Delivery Request (should call DeliveryAgent)
    console.log('📋 Test 6: Delivery Request');
    console.log('Expected Agent: DeliveryAgent');
    const deliveryResult = await chat.send('Deliver my order');
    console.log('✅ Delivery Response:');
    console.log(deliveryResult.text.substring(0, 200) + '...');
    
    const deliveryTools = deliveryResult.messages
      .filter(m => m.role === 'model')
      .flatMap(m => m.content
        .filter(p => p.toolRequest)
        .map(p => p.toolRequest?.name)
      );
    console.log('🔧 Agents Called:', deliveryTools);
    console.log('---\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  console.log('✅ Multi-agent system test completed!');
  console.log('\n🎭 Multi-Agent Workflow Demonstrated:');
  console.log('   1. MenuAgent → Menu display and recommendations');
  console.log('   2. InventoryAgent → Ingredient management');
  console.log('   3. OrderAgent → Order collection and processing');
  console.log('   4. KitchenAgent → Cooking process orchestration');
  console.log('   5. getOrderStatus → Direct status checking');
  console.log('   6. DeliveryAgent → Order delivery and customer service');
}

testMultiAgentSystem();
