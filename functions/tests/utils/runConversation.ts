import { ai } from '../../src/genkit';
import { ConversationTest, TestStep } from './loadCsv';

export interface ConversationResult {
  turn: number;
  input: string;
  expected: string;
  response: string;
  success: boolean;
}

/**
 * Executes a multi-turn conversation against an agent
 * @param agent - The Genkit agent to test
 * @param conversation - The conversation test case to run
 * @param userId - Optional user ID for context (defaults to 'test-user')
 * @returns Array of conversation results for each turn
 */
export async function runConversation(
  agent: any,
  conversation: ConversationTest,
  userId: string = 'test-user'
): Promise<ConversationResult[]> {
  const results: ConversationResult[] = [];
  const chat = ai.chat(agent);

  // Add user context to the first message
  let contextPrefix = `User ID: ${userId}\n\n`;

  for (const step of conversation.steps) {
    try {
      // For the first turn, include context; for subsequent turns, continue the conversation
      const message = step.turn === 1
        ? `${contextPrefix}${step.input}`
        : step.input;

      console.log(`[TEST] Turn ${step.turn}: Sending "${message}"`);

      const response = await chat.send(message);
      const responseText = response.text || '';

      console.log(`[TEST] Turn ${step.turn}: Received "${responseText}"`);

      // Check if the response contains the expected keyword (case-insensitive)
      const success = responseText.toLowerCase().includes(step.expected.toLowerCase());

      results.push({
        turn: step.turn,
        input: step.input,
        expected: step.expected,
        response: responseText,
        success,
      });

      // Clear context prefix after first turn
      contextPrefix = '';

    } catch (error) {
      console.error(`[TEST] Error in turn ${step.turn}:`, error);

      results.push({
        turn: step.turn,
        input: step.input,
        expected: step.expected,
        response: `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false,
      });
    }
  }

  return results;
}

/**
 * Executes a single-turn conversation against an agent
 * @param agent - The Genkit agent to test
 * @param input - The input message to send
 * @param expected - The expected keyword in the response
 * @param userId - Optional user ID for context (defaults to 'test-user')
 * @returns Single conversation result
 */
export async function runSingleTurn(
  agent: any,
  input: string,
  expected: string,
  userId: string = 'test-user'
): Promise<ConversationResult> {
  const conversation: ConversationTest = {
    id: 'single-turn',
    steps: [{
      test_id: 'single-turn',
      turn: 1,
      input,
      expected,
    }],
  };

  const results = await runConversation(agent, conversation, userId);
  return results[0];
}
