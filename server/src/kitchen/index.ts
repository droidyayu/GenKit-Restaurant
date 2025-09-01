// Kitchen Multi-Agent System - Main Export
// This file exports all components of the kitchen system

// Kitchen Multi-Agent System - Main Export

// Tools (Stateless utilities)
export * from '../tools/index.js';

// Supporting flows (Logic helpers)
export * from '../flows/index.js';

// Agent services (Flows with personas)
export * from '../agents/index.js';

// Main system exports
export { kitchenOrchestratorAgent as kitchenSystem } from '../agents/kitchenOrchestratorAgent.js';
export { availableDishesFlow } from '../flows/availableDishesFlow.js';
export { cookingFlow } from '../flows/cookingFlow.js';
export { deliveryFlow } from '../flows/deliveryFlow.js';

// Re-export key components for easy access
export { kitchenOrchestratorAgent } from '../agents/kitchenOrchestratorAgent.js';
export { menuRecipeAgent } from '../agents/menuRecipeAgent.js';
export { orderManagerAgent } from '../agents/orderManagerAgent.js';
export { chefAgent } from '../agents/chefAgent.js';
export { waiterAgent } from '../agents/waiterAgent.js';
