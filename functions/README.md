# 🍽️ Kitchen Multi-Agent System

A sophisticated restaurant kitchen simulation built with **Genkit SDK** and **Firebase Functions**, featuring multiple AI agents that collaborate to provide a complete dining experience.

## 🏗️ System Architecture

The system is built around **4 specialized agents** that work together through **1 main flow** and **4 utility tools**:

```
User Request → Kitchen Orchestrator Flow → Route to Appropriate Agent
                ↓
    ┌─────────────────────────────────────────────────────────┐
    │                    AGENTS                               │
    ├─────────────────────────────────────────────────────────┤
    │ • Menu Recipe Agent (Dynamic Menu Generation)          │
    │ • Order Manager Agent (Order Lifecycle)                │
    │ • Chef Agent (Cooking Execution)                       │
    │ • Waiter Agent (Customer Communication)                │
    └─────────────────────────────────────────────────────────┘
                ↓
    ┌─────────────────────────────────────────────────────────┐
    │                    MAIN FLOW                           │
    ├─────────────────────────────────────────────────────────┤
    │ • Kitchen Orchestrator Flow (Central Router)           │
    └─────────────────────────────────────────────────────────┘
                ↓
    ┌─────────────────────────────────────────────────────────┐
    │                     TOOLS                              │
    ├─────────────────────────────────────────────────────────┤
    │ • Inventory Tool (Ingredient Management)               │
    │ • Timer Tool (Accelerated Cooking)                     │
    │ • Notification Tool (Customer Updates)                 │
    │ • Order Tool (Order Management)                        │
    └─────────────────────────────────────────────────────────┘
```

## 🧩 Agent Details

### 1. Kitchen Orchestrator Flow
- **Purpose**: Central router and coordinator (main flow)
- **Input**: `{ userId, message }`
- **Process**: Classifies intent and routes to appropriate agent
- **Capabilities**: Intent classification, request routing, system coordination
- **Implementation**: `ai.defineFlow` with AI-powered intent recognition

### 2. Menu Recipe Agent
- **Purpose**: Culinary "brain" for menu generation
- **Input**: `{ userId?, category?, preferences?, requestType }`
- **Process**: Generates dynamic menus based on current inventory
- **Capabilities**: Menu generation, recipe suggestions, dessert upsell
- **Implementation**: Async function using `ai.generate` with inventory integration

### 3. Order Manager Agent
- **Purpose**: Handles order lifecycle management
- **Input**: `{ userId, dish, quantity?, specialInstructions? }`
- **Process**: Validates orders and coordinates with Chef Agent
- **Capabilities**: Order validation, ingredient checking, order creation
- **Implementation**: Async function using `ai.generate` for order validation

### 4. Chef Agent
- **Purpose**: Executes cooking tasks
- **Input**: `{ orderId, dishName, userId, specialInstructions? }`
- **Process**: Manages cooking process with accelerated timing
- **Capabilities**: Ingredient validation, cooking execution, status updates
- **Implementation**: Async function with AI-powered cooking validation

### 5. Waiter Agent
- **Purpose**: Customer communication and delivery
- **Input**: `{ userId, orderId?, action, message? }`
- **Process**: Handles customer interactions and order delivery
- **Capabilities**: Status checks, order delivery, dessert upsell
- **Implementation**: Async function with direct delivery simulation

## 🛠️ Main Flow

### Kitchen Orchestrator Flow
- **Purpose**: Central routing and intent classification
- **Input**: `{ userId, message }`
- **Process**: Uses AI to classify user intent and routes to appropriate agent
- **Output**: Structured response based on intent type
- **Implementation**: Single `ai.defineFlow` that orchestrates all interactions

## 🔄 Agent Architecture

The system uses a **hybrid approach**:
- **Kitchen Orchestrator Flow**: Main `ai.defineFlow` with AI-powered intent recognition
- **Other Agents**: Simple async functions that use `ai.generate` internally
- **Benefits**: Simplified architecture, easier maintenance, consistent AI interactions

## 🔧 Tools

### Inventory Tool
- **Purpose**: Check ingredient availability and quantities
- **Input**: `{ category? }`
- **Output**: Current inventory status with filtering by category

### Timer Tool
- **Purpose**: Simulate accelerated cooking time (1s = 1min)
- **Input**: `{ phase, duration, message }`
- **Output**: Timer completion status

### Notification Tool
- **Purpose**: Send push notifications to customers
- **Input**: `{ userId, title, body, data?, priority? }`
- **Output**: Notification delivery status

### Order Tool
- **Purpose**: Manage order lifecycle
- **Includes**: Create, update, check status, complete orders
- **Input**: Various order-related parameters
- **Output**: Order status and information

## 🚀 Getting Started

### Prerequisites
- Node.js 22+
- Firebase CLI
- Genkit SDK
- Google AI API Key

### Installation
```bash
cd functions
npm install
```

### Running the System

#### Local Development
```bash
# Build the project
npm run build

# Start Firebase emulator
npm run serve

# Run interactive terminal
npm run terminal

# Start Genkit development
npm run genkit:start
```

#### Testing
```bash
# Test the kitchen flow
curl -X POST "http://127.0.0.1:5001/demo-project/us-central1/kitchenFlow" \
  -H "Content-Type: application/json" \
  -d '{"data": {"message": "Show me the menu"}}'
```

#### Production (Firebase Functions)
```bash
cd functions
./deploy.sh
```

## 📋 Usage Examples

### 1. Ask for Menu
```
User: "Show me the menu"
→ Orchestrator → Menu Recipe Agent → Inventory Tool
→ Returns: Dynamic menu based on current ingredients
```

### 2. Place an Order
```
User: "I want to order Palak Paneer"
→ Orchestrator → Order Manager Agent → Chef Agent
→ Creates order → Starts cooking → Updates status
```

### 3. Check Order Status
```
User: "Where is my order?"
→ Orchestrator → Waiter Agent → Order Tool
→ Returns: Current cooking progress and estimated completion
```

### 4. Automatic Delivery
```
Chef Agent → Marks order ready → Waiter Agent → Delivery Flow
→ Notification Tool → Customer updated → Dessert upsell
```

## ⚡ Accelerated Time System

The system features **accelerated cooking time** where:
- **1 real second = 1 simulated minute**
- Cooking phases: Prep (2 min), Cooking (8 min), Garnishing (3 min), Plating (2 min)
- Total cooking time: ~15 minutes (simulated in ~15 seconds)

## 🔄 Agent Connections

```
User Request
    ↓
Kitchen Orchestrator Flow
    ↓
┌─────────────────────────────────────────────────┐
│              ROUTING LOGIC                     │
├─────────────────────────────────────────────────┤
│ • AskMenu → Menu Recipe Agent                 │
│ • PlaceOrder → Order Manager Agent             │
│ • CheckStatus → Waiter Agent                   │
│ • Fallback → Helpful suggestions               │
└─────────────────────────────────────────────────┘
    ↓
Specialized Agent
    ↓
Tools (Inventory, Timer, Notification, Orders)
    ↓
Response to User
```

## 🧪 Testing

The system includes comprehensive testing:

```bash
# Test complete kitchen system
npm run terminal

# Test via Firebase emulator
npm run serve

# Test via HTTP requests
curl -X POST "http://127.0.0.1:5001/demo-project/us-central1/kitchenFlow" \
  -H "Content-Type: application/json" \
  -d '{"data": {"message": "Show me the menu"}}'
```

## 🔧 Configuration

### Environment Variables
```bash
GOOGLE_GENAI_API_KEY=your_api_key
FIREBASE_PROJECT_ID=your_project_id
```

### Firebase Secret Manager
```bash
firebase functions:config:set google.genai_api_key="YOUR_API_KEY"
```

### Customization
- **Recipe Templates**: Modify recipe templates in `menuRecipeAgent.ts` for new dishes
- **Cooking Times**: Adjust timing in `chefAgent.ts`
- **Agent Behavior**: Customize prompts and logic in agent files

## 🚀 Future Enhancements

- **Real-time Collaboration**: Multiple chefs working simultaneously
- **Inventory Management**: Automatic reordering and stock alerts
- **Customer Preferences**: Personalized recommendations and dietary restrictions
- **Kitchen Analytics**: Performance metrics and optimization suggestions
- **Integration**: POS systems, delivery platforms, customer apps
- **Firestore Integration**: Persistent storage for orders and inventory

## 📁 Project Structure

```
functions/
├── src/
│   ├── agents/           # Agent services
│   │   ├── menuRecipeAgent.ts
│   │   ├── orderManagerAgent.ts
│   │   ├── chefAgent.ts
│   │   ├── waiterAgent.ts
│   │   └── index.ts
│   ├── flows/            # Main orchestration flow
│   │   ├── kitchenOrchestratorFlow.ts
│   │   └── index.ts
│   ├── tools/            # Utility tools
│   │   ├── inventoryTool.ts
│   │   ├── timerTool.ts
│   │   ├── notificationTool.ts
│   │   ├── orderTool.ts
│   │   └── index.ts
│   ├── genkit.ts         # Genkit configuration and kitchenFlow export
│   ├── index.ts          # Firebase Functions entry point
│   └── terminal.ts       # Interactive terminal interface
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── deploy.sh             # Deployment script
├── MIGRATION_README.md   # Migration documentation
└── README.md             # This file
```

## 🖥️ Available Commands

```bash
cd functions

# Build the project
npm run build

# Start Firebase emulator
npm run serve

# Run interactive terminal
npm run terminal

# Start Genkit development
npm run genkit:start

# Deploy to Firebase
npm run deploy
```

## 🔌 Client Integration

```typescript
import { httpsCallable } from "firebase/functions";

const kitchenFlow = httpsCallable(functions, "kitchenFlow");
const result = await kitchenFlow({ message: "Place order: Spaghetti" });
console.log(result.data);
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions or issues:
1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed information

---

**Built with ❤️ using Genkit SDK and Firebase Functions**
  