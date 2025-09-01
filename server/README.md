# 🍽️ Kitchen Multi-Agent System

A sophisticated restaurant kitchen simulation built with **Genkit SDK** and **Firebase Functions**, featuring multiple AI agents that collaborate to provide a complete dining experience.

## 🏗️ System Architecture

The system is built around **5 specialized agents** that work together through **3 supporting flows** and **4 utility tools**:

```
User Request → Kitchen Orchestrator Agent → Route to Appropriate Agent/Flow
                ↓
    ┌─────────────────────────────────────────────────────────┐
    │                    AGENTS (Flows)                      │
    ├─────────────────────────────────────────────────────────┤
    │ • Kitchen Orchestrator Agent (Central Router)          │
    │ • Menu & Recipe Agent (Dynamic Menu Generation)        │
    │ • Order Manager Agent (Order Lifecycle)                │
    │ • Chef Agent (Cooking Execution)                       │
    │ • Waiter Agent (Customer Communication)                │
    └─────────────────────────────────────────────────────────┘
                ↓
    ┌─────────────────────────────────────────────────────────┐
    │                  SUPPORTING FLOWS                      │
    ├─────────────────────────────────────────────────────────┤
    │ • Available Dishes Flow (Recipe Filtering)             │
    │ • Cooking Flow (Simulated Cooking)                     │
    │ • Delivery Flow (Order Delivery)                       │
    └─────────────────────────────────────────────────────────┘
                ↓
    ┌─────────────────────────────────────────────────────────┐
    │                     TOOLS                              │
    ├─────────────────────────────────────────────────────────┤
    │ • Inventory Tool (Ingredient Management)               │
    │ • Timer Tool (Accelerated Cooking)                     │
    │ • Notification Tool (Customer Updates)                 │
    │ • Order Tools (Order Management)                       │
    └─────────────────────────────────────────────────────────┘
```

## 🧩 Agent Details

### 1. Kitchen Orchestrator Agent
- **Purpose**: Central router and coordinator
- **Input**: `{ userId, message }`
- **Process**: Classifies intent and routes to appropriate agent
- **Capabilities**: Intent classification, request routing, system coordination

### 2. Menu & Recipe Agent
- **Purpose**: Culinary "brain" for menu generation
- **Input**: `{ userId?, availableIngredients?, category?, preferences?, requestType }`
- **Process**: Generates dynamic menus based on inventory
- **Capabilities**: Menu generation, recipe suggestions, dessert upsell

### 3. Order Manager Agent
- **Purpose**: Handles order lifecycle management
- **Input**: `{ userId, dish, quantity?, specialInstructions? }`
- **Process**: Validates orders and coordinates with Chef Agent
- **Capabilities**: Order validation, ingredient checking, order creation

### 4. Chef Agent
- **Purpose**: Executes cooking tasks
- **Input**: `{ orderId, dishName, userId, specialInstructions? }`
- **Process**: Manages cooking process with accelerated timing
- **Capabilities**: Ingredient validation, cooking execution, status updates

### 5. Waiter Agent
- **Purpose**: Customer communication and delivery
- **Input**: `{ userId, orderId?, action, message? }`
- **Process**: Handles customer interactions and order delivery
- **Capabilities**: Status checks, order delivery, dessert upsell

## 🛠️ Supporting Flows

### Available Dishes Flow
- **Purpose**: Compute feasible dishes given inventory
- **Input**: `{ category?, preferences? }`
- **Output**: List of dishes that can be made with available ingredients

### Cooking Flow
- **Purpose**: Simulate cooking process with accelerated time
- **Input**: `{ orderId, dishName, userId }`
- **Output**: Cooking completion status and timing

### Delivery Flow
- **Purpose**: Handle order delivery and customer notification
- **Input**: `{ orderId, userId, dishName }`
- **Output**: Delivery completion and notification status

## 🔧 Tools

### Inventory Tool
- **Purpose**: Check ingredient availability and quantities
- **Input**: `{ ingredientName? }`
- **Output**: Current inventory status

### Timer Tool
- **Purpose**: Simulate accelerated cooking time (1s = 1min)
- **Input**: `{ phase, duration, message }`
- **Output**: Timer completion status

### Notification Tool
- **Purpose**: Send push notifications to customers
- **Input**: `{ userId, title, body, data?, priority? }`
- **Output**: Notification delivery status

### Order Tools
- **Purpose**: Manage order lifecycle
- **Includes**: Create, update, check status, complete orders

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Genkit SDK
- Firebase Functions (for production)

### Installation
```bash
cd server
npm install
```

### Running the System

#### Local Development
```bash
npm run dev
```
This starts the interactive terminal interface using the Kitchen Orchestrator Agent.

#### Testing
```bash
npm run test:kitchen
```
Runs comprehensive tests of all agents and flows.

#### Production (Firebase Functions)
```bash
cd functions
npm run deploy
```

## 📋 Usage Examples

### 1. Ask for Menu
```
User: "Show me the menu"
→ Orchestrator → Menu Agent → Available Dishes Flow → Inventory Tool
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
→ Orchestrator → Waiter Agent → Order Status Tool
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
- Cooking phases: Prep (3 min), Cooking (8 min), Plating (2 min)
- Total cooking time: ~13 minutes (simulated in ~13 seconds)

## 🔄 Agent Connections

```
User Request
    ↓
Kitchen Orchestrator Agent
    ↓
┌─────────────────────────────────────────────────┐
│              ROUTING LOGIC                     │
├─────────────────────────────────────────────────┤
│ • AskMenu → Menu & Recipe Agent                │
│ • AskAvailableDishes → Available Dishes Flow   │
│ • PlaceOrder → Order Manager Agent             │
│ • CheckStatus → Waiter Agent                   │
│ • Fallback → Helpful suggestions               │
└─────────────────────────────────────────────────┘
    ↓
Specialized Agent/Flow
    ↓
Tools (Inventory, Timer, Notification, Orders)
    ↓
Response to User
```

## 🧪 Testing

The system includes comprehensive testing:

```bash
# Test individual components
npm run test:kitchen

# Test specific flows
npm run test:flows

# Test agent interactions
npm run test:agents
```

## 🔧 Configuration

### Environment Variables
```bash
GOOGLE_GENAI_API_KEY=your_api_key
FIREBASE_PROJECT_ID=your_project_id
```

### Customization
- **Recipe Database**: Modify `availableDishesFlow.ts` for new dishes
- **Cooking Times**: Adjust timing in `cookingFlow.ts`
- **Agent Behavior**: Customize prompts and logic in agent files

## 🚀 Future Enhancements

- **Real-time Collaboration**: Multiple chefs working simultaneously
- **Inventory Management**: Automatic reordering and stock alerts
- **Customer Preferences**: Personalized recommendations and dietary restrictions
- **Kitchen Analytics**: Performance metrics and optimization suggestions
- **Integration**: POS systems, delivery platforms, customer apps

## 📁 Project Structure

```
server/
├── src/
│   ├── agents/           # Agent services (flows with personas)
│   │   ├── kitchenOrchestratorAgent.ts
│   │   ├── menuRecipeAgent.ts
│   │   ├── orderManagerAgent.ts
│   │   ├── chefAgent.ts
│   │   └── waiterAgent.ts
│   ├── flows/            # Supporting flows (logic helpers)
│   │   ├── availableDishesFlow.ts
│   │   ├── cookingFlow.ts
│   │   └── deliveryFlow.ts
│   ├── tools/            # Utility tools (stateless functions)
│   │   ├── inventoryTool.ts
│   │   ├── timerTool.ts
│   │   ├── notificationTool.ts
│   │   └── orderTool.ts
│   ├── kitchen/          # Main system exports
│   │   └── index.ts
│   ├── genkit.ts         # Genkit configuration
│   ├── genkit.ts         # Genkit configuration
│   └── terminal.ts       # Interactive terminal interface
├── functions/            # Firebase Functions (production)
│   └── src/
│       └── kitchen/      # Production kitchen system
└── README.md
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
  