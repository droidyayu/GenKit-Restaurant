import { describe, it, expect } from '@jest/globals';
import { orderManagerAgent } from '../src/agents/orderManagerAgent';
import { loadCsv } from './utils/loadCsv';
import { runConversation, runSingleTurn } from './utils/runConversation';

describe('orderManagerAgent multi-turn conversations', () => {
  const testCases = loadCsv('orderAgent');

  testCases.forEach(conversation => {
    it(`should handle conversation ${conversation.id}`, async () => {
      const results = await runConversation(orderManagerAgent, conversation);

      results.forEach((result, i) => {
        console.log(`Turn ${result.turn}: Input: "${result.input}" | Expected: "${result.expected}" | Response: "${result.response}" | Success: ${result.success}`);
        expect(result.success).toBe(true);
        expect(result.response.toLowerCase()).toContain(result.expected.toLowerCase());
      });
    }, 30000); // 30 second timeout for AI calls
  });
});

describe('orderManagerAgent single-turn interactions', () => {
  it('should handle simple menu requests', async () => {
    const result = await runSingleTurn(
      orderManagerAgent,
      'Show me your menu',
      'menu'
    );

    expect(result.success).toBe(true);
    expect(result.response.toLowerCase()).toContain('menu');
  }, 30000);

  it('should ask for quantity when ordering', async () => {
    const result = await runSingleTurn(
      orderManagerAgent,
      'I want to order Chicken Biryani',
      'quantity'
    );

    expect(result.success).toBe(true);
    expect(result.response.toLowerCase()).toContain('quantity');
  }, 30000);

  it('should handle complete orders with quantity', async () => {
    const result = await runSingleTurn(
      orderManagerAgent,
      'I want 3 portions of Paneer Butter Masala',
      'Paneer Butter Masala'
    );

    expect(result.success).toBe(true);
    expect(result.response.toLowerCase()).toContain('paneer butter masala');
  }, 30000);
});
