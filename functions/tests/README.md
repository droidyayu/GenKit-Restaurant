# Integration Tests for Restaurant AI Agents

This directory contains standalone integration tests for the Restaurant AI agents (OrderManagerAgent and MenuRecipeAgent) that work with actual Firebase services and AI agents.

## Test Files

### `test-order-agent.js`
Comprehensive integration test that runs through all test scenarios from `data/orderAgent.csv`:
- Tests complete order creation workflows
- Validates database operations
- Tests multi-turn conversations
- Provides detailed success/failure reporting

**Run the comprehensive order agent test:**
```bash
cd functions
GOOGLE_GENAI_API_KEY=your_api_key node tests/test-order-agent.js
```

### `test-menu-agent.js`
Comprehensive integration test for the MenuRecipeAgent:
- Tests menu generation and routing
- Validates menu structure and content
- Tests different menu request types (vegetarian, appetizers, desserts)
- Uses the kitchen orchestrator flow for realistic testing

**Run the menu agent test:**
```bash
cd functions
GOOGLE_GENAI_API_KEY=your_api_key node tests/test-menu-agent.js
```

### `test-script.js`
Simple integration test for basic order creation with customer name handling:
- Tests a single conversation flow
- Validates order creation and database storage
- Good for quick smoke tests

**Run the simple test:**
```bash
cd functions
GOOGLE_GENAI_API_KEY=your_api_key node tests/test-script.js
```

## Running All Tests

**Run all tests at once:**
```bash
cd functions
npm test
```

**Run individual test suites:**
```bash
cd functions
npm run test:simple      # Quick smoke test
npm run test:order-agent # Comprehensive order testing
npm run test:menu-agent  # Menu generation testing
```

## Test Data

### `data/orderAgent.csv`
Contains test scenarios for various order creation workflows:
- Single-turn complete orders
- Multi-turn slot filling
- Sweet dishes (no spice required)
- Multi-item orders
- Confirmation handling
- Edge cases

## Environment Requirements

1. **Firebase Emulators** running:
   ```bash
   firebase emulators:start
   ```

2. **Google AI API Key** set:
   ```bash
   export GOOGLE_GENAI_API_KEY=your_api_key_here
   ```

## Test Results

The tests will provide detailed output showing:
- ✅ Scenarios that passed
- ❌ Scenarios that failed
- 📊 Success rate percentage
- 🔍 Detailed order creation verification
- 📋 Order details (ID, customer, status, dishes)
- 📋 Menu structure validation

## Advantages of Standalone Testing

- ✅ **No mocking required** - Tests actual services and database operations
- ✅ **Real AI validation** - Tests actual AI agent responses and behavior
- ✅ **Better debugging** - Direct console output with detailed logs
- ✅ **No framework overhead** - Lightweight and fast execution
- ✅ **Live integration testing** - End-to-end validation of complete workflows
- ✅ **Real database persistence** - Verifies actual data storage and retrieval
- ✅ **Production-like testing** - Uses same services as production environment

## Usage

These tests are perfect for:
- End-to-end validation of complete restaurant workflows
- AI agent behavior verification (OrderManagerAgent + MenuRecipeAgent)
- Database integration testing with real Firestore operations
- Regression testing after code changes
- Menu generation and routing validation
- Multi-turn conversation testing
- Production-like integration testing