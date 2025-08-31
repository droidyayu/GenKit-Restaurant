# Kitchen Multi-Agent System

A demonstration of a conversational, multi-agent assistant for restaurant management using GenKit and Google's Gemini Pro. This system provides a comprehensive restaurant management solution with specialized agents for inventory, menu generation, order processing, and kitchen workflow orchestration.

In this example we have a ChefAgent which is the main, customer-facing agent.
This agent comes equipped with additional specialized agents, that it can hand-off to as needed.

These specialized agents are represented as prompts and embedded as tools to the original agent.

## Agent Tools & Capabilities

- **Agent Structure**:
  - `ChefAgent`: Main entry point and customer interface, handling general queries and delegating to specialized agents
  - `InventoryAgent`: Specialized agent for ingredient management and availability
  - `MenuAgent`: Manages dynamic menu generation based on available ingredients
  - `OrderAgent`: Handles order collection and meal planning
  - `KitchenWorkflow`: Orchestrates the complete cooking process
  - `DeliveryAgent`: Manages delivery and dessert upselling

Each specialized agent has its own set of tools that are only accessible to that specific agent:

- **InventoryAgent**:
  - `getInventory`: Retrieve ingredient availability
  - `getIngredientDetails`: Get detailed ingredient information
- **MenuAgent**:
  - `getMenu`: Generate dynamic menus based on preferences
- **OrderAgent**:
  - `createOrder`: Create new orders with complete details
- **KitchenWorkflow**:
  - `kitchenTimer`: Simulate cooking phases
  - `updateOrderStatus`: Update order progress
  - `prepAgent`: Handle ingredient preparation
  - `cookAgent`: Manage cooking process
  - `plateAgent`: Handle final presentation
- **DeliveryAgent**:
  - `completeOrder`: Finalize orders and handle delivery

The main ChefAgent cannot directly access these specialized tools - it can only access its own tools and delegate to the specialized agents. This means the specialized agent descriptions need to clearly communicate their capabilities, since the main agent relies on these descriptions for appropriate routing.

This architectural pattern:

- Maintains clear separation of concerns
- Allows specialized agents to evolve independently
- Allows scaling up to a larger number of tools
- Provides a complete restaurant management solution

## Features

### Menu System
- **24 Menu Items** across 6 categories:
  - Vegetarian Dishes (5 items)
  - Non-Vegetarian Dishes (5 items)
  - Breads (3 items)
  - Rice (3 items)
  - Side Dishes (3 items)
  - Desserts (5 items)

### Inventory Management
- **42 Ingredients** organized by categories:
  - Proteins (5 items)
  - Vegetables (8 items)
  - Grains (5 items)
  - Dairy (6 items)
  - Spices (10 items)
  - Herbs (2 items)
  - Condiments (6 items)

### Order Processing
- Complete order collection with quantity and spice levels
- Special handling for sweet dishes (no spice level required)
- Automatic meal planning with accompaniments
- Real-time order status tracking

### Kitchen Workflow
- **Preparation Phase**: Ingredient setup and preparation
- **Cooking Phase**: Actual cooking with timing simulation
- **Plating Phase**: Final presentation and quality checks
- **Delivery Phase**: Order delivery and dessert upselling

## Prerequisites

- Node.js and genkit CLI installed
- Google AI API key

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Set up your Google AI API key:

```bash
export GOOGLE_GENAI_API_KEY=your_api_key_here
```

3. Start the development server:

```bash
npm run genkit:dev
```

In your terminal, a commandline chat interface should show up:

```terminal
Telemetry API running on http://localhost:4033
Genkit Developer UI: http://localhost:4000

> school-agent@1.0.0 dev
> tsx --no-warnings --watch src/kitchenTerminal.ts

chef> Hi there! I'm Chef Raj, your friendly AI chef at Indian Grill! 🍽️ I can help you with our menu, ingredients, orders, and more. What would you like to know?

prompt> [insert your chats here]
```

You can feel free to tweak the sample. The project builds in watch mode, so any changes will be picked up immediately and should restart the conversation.

## Usage

The agent uses a multi-agent architecture:

- Chef Agent: Acts as the main entry point and customer interface, handling general queries while delegating specialized requests to appropriate agents
- Inventory Agent: Specialized agent focused on ingredient management and availability
- Menu Agent: Manages dynamic menu generation based on available ingredients
- Order Agent: Handles order collection and complete meal planning
- Kitchen Workflow: Orchestrates the complete cooking process through sequential phases
- Delivery Agent: Manages delivery and dessert upselling

Example queries:

- "What's on the menu?"
- "What ingredients do you have?"
- "I want Palak Paneer with Medium spice level"
- "How's my order?"

## Development

- `npm run dev` - Run in development mode with hot reloading
- `npm run build` - Build the project
- `npm start` - Run the built version

## Project Structure

- `src/`
  - `chefAgent.ts` - Main customer interface agent
  - `inventoryAgent.ts` - Ingredient management agent
  - `menuAgent.ts` - Menu generation agent
  - `orderAgent.ts` - Order processing agent
  - `kitchenWorkflow.ts` - Cooking process orchestration
  - `prepAgent.ts` - Ingredient preparation phase
  - `cookAgent.ts` - Cooking process phase
  - `plateAgent.ts` - Final presentation phase
  - `deliveryAgent.ts` - Delivery and upselling agent
  - `kitchenTools.ts` - Tool definitions
  - `kitchenTypes.ts` - TypeScript types
  - `kitchenData.ts` - Menu and inventory data
  - `kitchenTerminal.ts` - Terminal interface
  - `test/` - Test files
    - `kitchenTests.ts` - Comprehensive test suite
    - `chefTest.ts` - Chef agent demonstration
    - `simpleKitchenTest.ts` - Simple verification test
  