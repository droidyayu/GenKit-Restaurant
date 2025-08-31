
import 'dotenv/config';
import type { Message, ToolRequestPart } from 'genkit';
import { createInterface } from 'node:readline';
import { ai } from './genkit.js';
import { chefAgent } from './chefAgent.js';
import type { KitchenState } from './kitchenTypes.js';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const EXAMPLE_KITCHEN_CONTEXT: KitchenState = {
  customerId: 1001,
  customerName: 'Sarah Johnson',
  orderHistory: [],
};

// ANSI color codes for terminal output
const COLORS = {
  CHEF: '\x1b[32m',
  PROMPT: '\x1b[36m',
  RESET: '\x1b[0m',
};

// Helper to print colored text
function printColored(prefix: string, text: string, color: string) {
  console.log(`${color}${prefix}>${COLORS.RESET}`, text);
}

// Get initial greeting from AI
async function getGreeting() {
  const { text } = await ai.generate(
    'Come up with a short friendly greeting for yourself talking to a customer as Chef Raj, the helpful AI chef at Indian Grill restaurant. Feel free to use emoji.'
  );
  return text;
}

// Process and display the chat response stream
async function handleChatResponse(
  stream: AsyncIterable<{ text: string }>,
  response: Promise<any>,
  startMessageCount: number
) {
  console.log();
  process.stdout.write(`${COLORS.CHEF}chef>${COLORS.RESET} `);

  for await (const chunk of stream) {
    process.stdout.write(chunk.text);
  }

  // Extract and display tools used
  const toolsUsed = (await response).messages
    .slice(startMessageCount)
    .filter((m: Message) => m.role === 'model')
    .flatMap((m: Message) =>
      m.content
        .filter((p) => !!p.toolRequest)
        .map(
          (p) =>
            `${p.toolRequest?.name}(${JSON.stringify(p.toolRequest?.input)})`
        )
    )
    .filter((t: ToolRequestPart) => !!t);

  console.log('\nTools Used:', toolsUsed);
}

// Main chat loop
async function handleUserInput(chat: any): Promise<void> {
  return new Promise((resolve) => {
    rl.question(`\n${COLORS.PROMPT}prompt>${COLORS.RESET} `, async (input) => {
      try {
        const startMessageCount = chat.messages.length;
        const { stream, response } = await chat.sendStream(input);
        await handleChatResponse(stream, response, startMessageCount);
        resolve();
      } catch (e) {
        console.log('Error:', e);
        resolve();
      }
    });
  });
}

async function main() {
  const chat = ai
    .createSession({ initialState: EXAMPLE_KITCHEN_CONTEXT })
    .chat(chefAgent);

  const greeting = await getGreeting();
  console.log();
  printColored('chef', greeting, COLORS.CHEF);

  while (true) {
    await handleUserInput(chat);
  }
}

setTimeout(main, 0);
