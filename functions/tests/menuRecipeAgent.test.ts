import { describe, it, expect } from '@jest/globals';
import { menuRecipeAgent } from '../src/agents/menuRecipeAgent';
import { loadCsv } from './utils/loadCsv';
import { runConversation, runSingleTurn } from './utils/runConversation';

describe('menuRecipeAgent single-turn interactions', () => {
  const testCases = loadCsv('menuAgent');

  testCases.forEach(conversation => {
    it(`should handle menu request ${conversation.id}`, async () => {
      const results = await runConversation(menuRecipeAgent, conversation);

      results.forEach((result, i) => {
        console.log(`Request ${conversation.id}: Input: "${result.input}" | Expected: "${result.expected}" | Response: "${result.response}" | Success: ${result.success}`);
        expect(result.success).toBe(true);
        expect(result.response.toLowerCase()).toContain(result.expected.toLowerCase());
      });
    }, 30000); // 30 second timeout for AI calls
  });
});

describe('menuRecipeAgent specific menu requests', () => {
  it('should generate a complete menu', async () => {
    const result = await runSingleTurn(
      menuRecipeAgent,
      'Show me the full menu',
      'butter chicken'
    );

    expect(result.success).toBe(true);
    expect(result.response.length).toBeGreaterThan(100); // Should be a substantial menu response
  }, 30000);

  it('should handle vegetarian requests', async () => {
    const result = await runSingleTurn(
      menuRecipeAgent,
      'I only eat vegetarian food, what do you have?',
      'paneer'
    );

    expect(result.success).toBe(true);
    expect(result.response.toLowerCase()).toContain('vegetarian');
  }, 30000);

  it('should provide cooking times', async () => {
    const result = await runSingleTurn(
      menuRecipeAgent,
      'Show me quick dishes under 20 minutes',
      'min'
    );

    expect(result.success).toBe(true);
    expect(result.response.toLowerCase()).toContain('min');
  }, 30000);
});
