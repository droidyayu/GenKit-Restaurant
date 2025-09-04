# Integration Tests for Restaurant AI Agents

This directory contains comprehensive integration tests for all Restaurant AI agents (OrderManagerAgent, MenuRecipeAgent, and WaiterAgent) that work with actual Firebase services and AI agents.

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

### `test-waiter-agent.js`
Comprehensive integration test for the WaiterAgent:
- Tests order status inquiries and delivery coordination
- Validates status updates and customer service responses
- Tests various status inquiry scenarios (waiting, delivery time, readiness)
- Uses the kitchen orchestrator flow for realistic testing
- Verifies order status changes and delivery confirmations

**Run the waiter agent test:**
```bash
cd functions
GOOGLE_GENAI_API_KEY=your_api_key node tests/test-waiter-agent.js
```

### `test-kitchen-orchestrator-flow.js`
End-to-end integration test for the complete Kitchen Orchestrator Flow:
- Tests the main routing and orchestration system
- Validates agent selection and response handling
- Tests complex multi-turn conversations
- Uses comprehensive test scenarios from `data/kitchenOrchestratorFlow.csv`

**Run the kitchen orchestrator flow test:**
```bash
cd functions
GOOGLE_GENAI_API_KEY=your_api_key node tests/test-kitchen-orchestrator-flow.js
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
npm run test:simple           # Quick smoke test
npm run test:order-agent      # Comprehensive order testing
npm run test:menu-agent       # Menu generation testing
npm run test:waiter-agent     # Status and delivery testing
npm run test:kitchen-flow     # Main orchestration testing
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

### `data/menuAgent.csv`
Contains test scenarios for menu generation and exploration:
- Basic menu requests
- Dietary-specific menus (vegetarian, etc.)
- Category-specific requests (appetizers, desserts)
- Menu routing validation

### `data/waiterAgent.csv`
Contains test scenarios for order status and delivery inquiries:
- Basic status checks
- Delivery time inquiries
- Readiness confirmations
- Impatient customer scenarios
- Multiple order status checks

### `data/kitchenOrchestratorFlow.csv`
Contains comprehensive test scenarios for the main orchestration flow:
- Complete conversation flows
- Agent routing validation
- Multi-turn interactions
- Error handling scenarios

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
- AI agent behavior verification (OrderManagerAgent, MenuRecipeAgent, WaiterAgent)
- Database integration testing with real Firestore operations
- Regression testing after code changes
- Menu generation, order creation, and status inquiry validation
- Multi-turn conversation testing across all agents
- Production-like integration testing for the complete system

## Test Architecture

The test suite uses a **common utilities approach**:
- **`utils/common.js`** - Shared CSV loader, test result formatter, and graceful shutdown utilities
- **CSV-driven testing** - Each test scenario defined in structured CSV files
- **Real agent integration** - Tests actual AI agents with live Firebase services
- **Conversation flow validation** - Tests complete user-agent interaction patterns

## Test Coverage

### Order Agent Tests
- ✅ Order creation and validation
- ✅ Multi-turn conversation handling
- ✅ Spice level and quantity management
- ✅ Confirmation workflows
- ✅ Database persistence verification

### Menu Agent Tests
- ✅ Dynamic menu generation
- ✅ Dietary preference handling
- ✅ Category-specific menu requests
- ✅ Inventory-based menu adaptation
- ✅ Menu structure validation

### Waiter Agent Tests
- ✅ Order status inquiries
- ✅ Delivery time coordination
- ✅ Customer service responses
- ✅ Status update validation
- ✅ Multi-order status handling

### Kitchen Orchestrator Tests
- ✅ Agent routing and selection
- ✅ Intent classification accuracy
- ✅ Complete conversation flows
- ✅ Error handling and fallback scenarios