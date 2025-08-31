
import { gemini15Pro, googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit/beta';
import type { KitchenState } from './kitchenTypes';

export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })],
  model: gemini15Pro,
});

ai.defineHelper(
  'userContext',
  (state: KitchenState) => {
    const kitchenState = state as KitchenState;
    return `=== Kitchen Context

- The current customer is ${kitchenState?.customerName}
- The current date and time is: ${new Date().toString()}

=== Current Order Status

${kitchenState?.currentOrder ? `- Order ID: ${kitchenState.currentOrder.orderId}
- Status: ${kitchenState.currentOrder.status}
- Estimated Time: ${kitchenState.currentOrder.estimatedTime}
- Dishes: ${kitchenState.currentOrder.dishes.map((d: any) => `${d.quantity}x ${d.name}${d.spiceLevel ? ` (${d.spiceLevel})` : ''}`).join(', ')}` : '- No active order'}

=== Order History

${kitchenState?.orderHistory?.length ? kitchenState.orderHistory.map((order: any) => `- ${order.orderId}: ${order.status}, $${order.totalAmount.toFixed(2)}`).join('\n') : '- No previous orders'}`;
  }
);

export { z } from 'genkit';
