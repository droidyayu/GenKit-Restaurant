
import 'dotenv/config';
import { ai } from '../genkit.js';
import { chefAgent } from '../chefAgent.js';
import type { KitchenState } from '../kitchenTypes.js';

const TEST_KITCHEN_STATE: KitchenState = {
  customerId: 1001,
  customerName: 'Test Customer',
  orderHistory: [],
};

async function testChefAgent() {
  console.log('👨‍🍳 Testing Chef Agent (Kitchen Multi-Agent System)\n');
  
  const chat = ai
    .createSession({ initialState: TEST_KITCHEN_STATE })
    .chat(chefAgent);
  
  const testCases = [
    {
      input: 'What\'s on the menu?',
      description: 'Menu Request'
    },
    {
      input: 'What ingredients do you have?',
      description: 'Inventory Request'
    },
    {
      input: 'I want Palak Paneer with Medium spice level',
      description: 'Order Placement'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.description}`);
    console.log(`💬 Input: "${testCase.input}"`);
    
    try {
      const { stream, response } = await chat.sendStream(testCase.input);
      
      // Collect the streamed response
      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk.text;
      }
      
      console.log(`✅ Response received successfully`);
      console.log(`📄 Response: ${fullResponse.substring(0, 200)}...`);
      
      // Wait for the response to complete and check tools used
      const finalResponse = await response;
      const toolsUsed = finalResponse.messages
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
      console.log(`❌ Error: ${error}`);
    }
  }
  
  console.log('\n✅ Chef Agent test completed!');
}

testChefAgent().catch(console.error);
