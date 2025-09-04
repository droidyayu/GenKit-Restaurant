const fs = require('fs');
const path = require('path');

/**
 * Common CSV loader utility shared across all test files
 * @param {string} csvFileName - Name of the CSV file (without .csv extension)
 * @returns {Array} Array of conversation test cases grouped by test_id
 */
function loadCsv(csvFileName) {
  const csvPath = path.join(__dirname, '..', 'data', `${csvFileName}.csv`);
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());

  // Parse CSV (simple implementation)
  const headers = lines[0].split(',');
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const record = {};
    headers.forEach((header, index) => {
      record[header.trim()] = values[index] ? values[index].trim() : '';
    });
    records.push(record);
  }

  // Group by test_id
  const conversations = new Map();

  for (const record of records) {
    if (!conversations.has(record.test_id)) {
      conversations.set(record.test_id, []);
    }
    conversations.get(record.test_id).push({
      test_id: record.test_id,
      turn: Number(record.turn),
      input: record.input,
      expected: record.expected,
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
 * Common test result formatter
 * @param {Object} results - Test results object
 */
function printTestResults(results) {
  console.log('\n🎉 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`📊 Total Scenarios: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${results.failed} test(s) failed.`);
    process.exit(1);
  }
}

/**
 * Common error handler for test interruptions
 */
function setupGracefulShutdown() {
  process.on('SIGINT', () => {
    console.log('\n⏹️  Test interrupted by user');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}

module.exports = {
  loadCsv,
  printTestResults,
  setupGracefulShutdown
};
