import 'dotenv/config';
import type { Message, ToolRequestPart } from 'genkit';
import { createInterface } from 'node:readline';
import { ai } from './genkit.js';
import { chefAgent } from './agents/chefAgent.js';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ANSI color codes for terminal output
const COLORS = {
  CHEF: '\x1b[32m',
  PROMPT: '\x1b[36m',
  RESET: '\x1b[0m',
  AGENT: '\x1b[33m',
};

// Helper to print colored text
function printColored(prefix: string, text: string, color: string) {
  console.log(`${color}${prefix}>${COLORS.RESET}`, text);
}

// Get initial greeting from AI
async function getGreeting() {
  const { text } = await ai.generate(
    'Come up with a short friendly greeting for yourself talking to a customer as Chef Raj, the coordinator of a multi-agent restaurant system at Indian Grill. Mention that you work with specialized agents for different tasks.'
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

  // Extract and display tools used (agents called)
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

  if (toolsUsed.length > 0) {
    console.log(`\n${COLORS.AGENT}🤖 Agents Called:${COLORS.RESET}`, toolsUsed);
  }
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
  const chat = ai.createSession().chat(chefAgent);

  const greeting = await getGreeting();
  console.log();
  printColored('chef', greeting, COLORS.CHEF);
  console.log(`\n${COLORS.AGENT}🎭 Multi-Agent System Active:${COLORS.RESET}`);
  console.log('   • MenuAgent - Menu display and recommendations');
  console.log('   • OrderAgent - Order collection and processing');
  console.log('   • InventoryAgent - Ingredient management');
  console.log('   • KitchenAgent - Cooking process orchestration');
  console.log('   • DeliveryAgent - Order delivery and customer service');

  while (true) {
    await handleUserInput(chat);
  }
}

main().catch(console.error);
