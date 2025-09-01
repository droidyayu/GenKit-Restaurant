import { kitchenOrchestratorFlow } from '../src/flows/kitchenOrchestratorFlow.js';

console.log('🧪 Testing Intent Classification...\n');

async function testIntentClassification() {
  const testCases = [
    'Show me the menu',
    'What dishes can you make?',
    'I want to order Palak Paneer',
    'Order status please',
    'How long until my food is ready?',
    'Can you make Butter Chicken?',
    'What\'s available today?',
    'I\'ll have Dal Tadka for 2 people'
  ];

  for (const testCase of testCases) {
    console.log(`Testing: "${testCase}"`);
    
    try {
      const result = await kitchenOrchestratorFlow({
        userId: 'test-user',
        message: testCase
      });
      
      console.log(`✅ Intent: ${result.intent}`);
      console.log(`   Confidence: ${result.confidence || 'N/A'}`);
      console.log(`   Success: ${result.success}`);
      if (result.message) {
        console.log(`   Response: ${result.message.substring(0, 100)}...`);
      }
      console.log();
      
    } catch (error) {
      console.log(`❌ Error: ${error}`);
      console.log();
    }
  }
}

// Run the test
testIntentClassification();
