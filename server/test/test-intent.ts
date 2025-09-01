import { kitchenOrchestratorFlow } from '../src/flows/kitchenOrchestratorFlow.js';

console.log('🧪 Testing Intent Classification...\n');

async function testIntentClassification() {
  try {
    const userId = 'test-user-1';
    
    const testMessages = [
      'What is the menu?',
      'Show me the menu',
      'I want to order Palak Paneer',
      'Palak Paneer for 1 person',
      'Palak Paneer for 2 people',
      'What dishes can you make?',
      'Where is my order?',
      'Hello there'
    ];
    
    for (const message of testMessages) {
      console.log(`📝 Testing: "${message}"`);
      
      try {
        const result = await kitchenOrchestratorFlow({
          userId,
          message
        });
        
        console.log(`   ✅ Intent: ${result.intent} (confidence: ${result.confidence})`);
        
        if (result.intent === 'PlaceOrder' && result.orderId) {
          console.log(`   📦 Order ID: ${result.orderId}`);
          console.log(`   🍽️ Dish: ${result.dishName}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      console.log();
    }
    
    console.log('🎉 Intent Classification Test Completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testIntentClassification();
