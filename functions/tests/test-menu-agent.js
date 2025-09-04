const {kitchenOrchestratorFlow} = require('../lib/flows/kitchenOrchestratorFlow.js');
const {loadCsv, printTestResults, setupGracefulShutdown} = require('./utils/common.js');

// Common test runner utility
async function runMenuTest(testCase) {
  const step = testCase.steps[0]; // Menu tests are single-turn

  console.log(`👤 Input: "${step.input}"`);
  console.log(`🎯 Expected: "${step.expected}"`);

  // Use the kitchen orchestrator flow which will route to menuRecipeAgent
  const result = await kitchenOrchestratorFlow.run({
    userId: 'menu-test-user',
    message: step.input
  });

  console.log(`🍽️  Response: "${result.result.message.substring(0, 100)}${result.result.message.length > 100 ? '...' : ''}"`);

  // Check if response contains the expected keyword
  const response = result.result.message.toLowerCase();
  const hasExpectedKeyword = response.includes(step.expected.toLowerCase());

  // Additional validation - check for menu structure
  const hasCategories = /\*\*.*\*\*\s*\*\(.*\)/.test(result.result.message);
  const hasDishes = /\*\*.*\*\*\s*\*\(.*\)\*:/.test(result.result.message);

  console.log(`📋 Menu structure: ${hasCategories ? '✅' : '❌'} Categories, ${hasDishes ? '✅' : '❌'} Dishes`);
  console.log(`🔍 Expected keyword "${step.expected}": ${hasExpectedKeyword ? '✅' : '❌'}`);

  // Pass if we have expected keyword OR good menu structure
  return hasExpectedKeyword || (hasCategories && hasDishes);
}

async function testMenuRecipeAgent() {
  console.log('🍽️ TESTING MENU RECIPE AGENT VIA KITCHEN FLOW\n');
  console.log('=' .repeat(60));

  try {
    // Load test cases from CSV using common utility
    const testCases = loadCsv('menuAgent');
    console.log(`📋 Loaded ${testCases.length} menu test scenarios from CSV\n`);

    const results = {
      passed: 0,
      failed: 0,
      total: testCases.length
    };

    for (const testCase of testCases) {
      console.log(`\n🎯 TESTING SCENARIO: ${testCase.id}`);
      console.log('-'.repeat(40));

      try {
        // Use common test runner utility
        const passed = await runMenuTest(testCase);

        if (passed) {
          console.log('✅ PASSED: Expected keyword found or good menu structure');
          results.passed++;
        } else {
          console.log('❌ FAILED: Missing expected keyword and poor menu structure');
          results.failed++;
        }

      } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
        results.failed++;
      }

      console.log('=' .repeat(60));

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
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
testMenuRecipeAgent();
