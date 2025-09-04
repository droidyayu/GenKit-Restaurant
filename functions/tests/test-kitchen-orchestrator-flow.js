const {kitchenOrchestratorFlow} = require('../lib/flows/kitchenOrchestratorFlow.js');
const {loadCsv, printTestResults, setupGracefulShutdown} = require('./utils/common.js');

/**
 * Load and adapt CSV test cases for kitchen orchestrator flow
 * @param {string} csvFileName - Name of the CSV file (without .csv extension)
 * @returns {Array} Array of conversation test cases with adapted format
 */
function loadKitchenOrchestratorCsv(csvFileName) {
  // First, let's read the CSV manually to get the custom columns
  const fs = require('fs');
  const path = require('path');
  const csvPath = path.join(__dirname, 'data', `${csvFileName}.csv`);
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());

  // Parse CSV headers
  const headers = lines[0].split(',').map(h => h.trim());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] ? values[index].trim() : '';
    });
    records.push(record);
  }

  // Group by test_id and adapt to expected format
  const conversations = new Map();

  for (const record of records) {
    if (!conversations.has(record.test_id)) {
      conversations.set(record.test_id, []);
    }
    conversations.get(record.test_id).push({
      test_id: record.test_id,
      turn: Number(record.turn),
      input: record.input,
      expected_agent: record.expected_agent,
      expected_keyword: record.expected_keyword,
      // Combine agent and keyword for the 'expected' field used by common.js
      expected: `${record.expected_agent}:${record.expected_keyword}`,
    });
  }

  // Convert to array and sort steps
  const result = [];
  for (const [id, steps] of conversations) {
    result.push({
      id,
      steps: steps.sort((a, b) => a.turn - b.turn),
    });
  }

  return result;
}

/**
 * Determine which agent was likely used based on response content
 * @param {string} response - The response text from the flow
 * @returns {string} - 'menuRecipeAgent' or 'orderManagerAgent'
 */
function detectAgentFromResponse(response) {
  const lowerResponse = response.toLowerCase();

  // Strong indicators for orderManagerAgent
  const strongOrderIndicators = [
    'created an order', 'placed your order', 'order id',
    'how many', 'what spice', 'what dish', 'how many servings',
    'what would you like', 'quantity of'
  ];

  // Strong indicators for menuRecipeAgent
  const strongMenuIndicators = [
    '```markdown', '**🍽️ appetizers**', '**🥗 vegetarian**',
    '**🌿 vegetarian appetizers**', '**🥗 gluten-free**',
    '**🌶️ appetizers**', '**🍲 soups**'
  ];

  // Check for strong indicators first
  const hasStrongOrder = strongOrderIndicators.some(indicator => lowerResponse.includes(indicator));
  const hasStrongMenu = strongMenuIndicators.some(indicator => lowerResponse.includes(indicator));

  if (hasStrongOrder && !hasStrongMenu) {
    return 'orderManagerAgent';
  }
  if (hasStrongMenu && !hasStrongOrder) {
    return 'menuRecipeAgent';
  }

  // Fallback to broader keyword matching
  const orderKeywords = [
    'order', 'created', 'placed', 'quantity', 'spice',
    'confirmation', 'delivery', 'estimated'
  ];

  const menuKeywords = [
    'menu', 'vegetarian', 'appetizers', 'soups', 'recommend',
    'special', 'healthy', 'chef', 'dish', 'paneer', 'chicken'
  ];

  const orderScore = orderKeywords.filter(keyword => lowerResponse.includes(keyword)).length;
  const menuScore = menuKeywords.filter(keyword => lowerResponse.includes(keyword)).length;

  return orderScore > menuScore ? 'orderManagerAgent' : 'menuRecipeAgent';
}

/**
 * Test individual conversation turn
 * @param {Object} step - Test step with input, expected_agent, expected_keyword
 * @param {string} userId - Test user ID
 * @returns {Object} - Test result with pass/fail status and details
 */
async function testConversationTurn(step, userId) {
  try {
    console.log(`👤 Turn ${step.turn}: "${step.input}"`);

    const result = await kitchenOrchestratorFlow.run({
      userId: userId,
      message: step.input
    });

    const response = result.result.message;
    console.log(`🤖 Response: "${response.substring(0, 100)}${response.length > 100 ? '...' : ''}"`);

    // Detect which agent was used
    const detectedAgent = detectAgentFromResponse(response);
    console.log(`🔍 Detected agent: ${detectedAgent} (expected: ${step.expected_agent})`);

    // Check agent routing
    const agentCorrect = detectedAgent === step.expected_agent;

    // Check keyword presence
    const keywordPresent = response.toLowerCase().includes(step.expected_keyword.toLowerCase());
    console.log(`🔍 Keyword "${step.expected_keyword}" present: ${keywordPresent}`);

    const stepPassed = agentCorrect && keywordPresent;

    if (stepPassed) {
      console.log(`✅ Step ${step.turn}: PASSED`);
    } else {
      console.log(`❌ Step ${step.turn}: FAILED`);
      if (!agentCorrect) {
        console.log(`   Expected agent: ${step.expected_agent}, Detected: ${detectedAgent}`);
      }
      if (!keywordPresent) {
        console.log(`   Expected keyword "${step.expected_keyword}" not found in response`);
      }
    }

    return {
      passed: stepPassed,
      agentCorrect,
      keywordPresent,
      detectedAgent,
      expectedAgent: step.expected_agent,
      keyword: step.expected_keyword,
      response: response
    };

  } catch (error) {
    console.log(`❌ Error in turn ${step.turn}: ${error.message}`);
    return {
      passed: false,
      error: error.message,
      expectedAgent: step.expected_agent,
      keyword: step.expected_keyword
    };
  }
}

/**
 * Run all test conversations
 * @param {number} limit - Maximum number of test scenarios to run (0 = all)
 */
async function runKitchenOrchestratorTests(limit = 5) {
  console.log('🚀 STARTING KITCHEN ORCHESTRATOR FLOW TESTS\n');
  console.log('=' .repeat(80));

  try {
    // Load test cases from CSV using adapted loader
    const allTestCases = loadKitchenOrchestratorCsv('kitchenOrchestratorFlow');
    const testCases = limit > 0 ? allTestCases.slice(0, limit) : allTestCases;
    console.log(`📋 Loaded ${allTestCases.length} test scenarios from CSV`);
    console.log(`🎯 Running ${testCases.length} test scenarios (limit: ${limit > 0 ? limit : 'all'})\n`);

    const results = {
      passed: 0,
      failed: 0,
      total: testCases.length,
      totalSteps: 0,
      passedSteps: 0
    };

    // Test each conversation scenario
    for (const testCase of testCases) {
      console.log(`\n🎯 TESTING SCENARIO: ${testCase.id}`);
      console.log('-'.repeat(60));

      const userId = `test-kitchen-${testCase.id}`;
      let scenarioPassed = true;
      let scenarioStepResults = [];

      // Run each turn in the conversation
      for (const step of testCase.steps) {
        const stepResult = await testConversationTurn(step, userId);
        scenarioStepResults.push(stepResult);
        results.totalSteps++;

        if (stepResult.passed) {
          results.passedSteps++;
        } else {
          scenarioPassed = false;
        }

        // Small delay between steps to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Update scenario results
      if (scenarioPassed) {
        results.passed++;
        console.log(`\n✅ SCENARIO ${testCase.id}: PASSED (${scenarioStepResults.length} steps)`);
      } else {
        results.failed++;
        console.log(`\n❌ SCENARIO ${testCase.id}: FAILED (${scenarioStepResults.filter(s => !s.passed).length}/${scenarioStepResults.length} steps failed)`);

        // Show detailed failures
        console.log('\n📋 FAILED STEPS:');
        scenarioStepResults.forEach((step, index) => {
          if (!step.passed) {
            const stepDetail = testCase.steps[index];
            console.log(`   Step ${stepDetail.turn}: ${step.error || 'Validation failed'}`);
          }
        });
      }

      console.log('=' .repeat(80));
    }

    // Print final results using common function
    printTestResults(results);

  } catch (error) {
    console.error('💥 CRITICAL ERROR:', error.message);
    process.exit(1);
  }
}

// Setup graceful shutdown using common function
setupGracefulShutdown();

// Get limit from command line argument (default: 5)
const limitArg = process.argv[2];
const limit = limitArg ? parseInt(limitArg) : 5;

// Run the tests
runKitchenOrchestratorTests(limit);
