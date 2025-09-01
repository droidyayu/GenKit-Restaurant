import "dotenv/config";
import {createInterface} from "node:readline";
import {ai} from "./genkit";
import {kitchenOrchestratorFlow} from "./flows/kitchenOrchestratorFlow";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ANSI color codes for terminal output
const COLORS = {
  CHEF: "\x1b[32m",
  PROMPT: "\x1b[36m",
  RESET: "\x1b[0m",
  AGENT: "\x1b[33m",
};

// Helper to print colored text
function printColored(prefix: string, text: string, color: string) {
  console.log(`${color}${prefix}>${COLORS.RESET}`, text);
}

// Get initial greeting from AI
async function getGreeting() {
  const {text} = await ai.generate({
    prompt: "Come up with a short friendly greeting for yourself talking to a customer " +
      "as the Kitchen Orchestrator at Indian Grill. " +
      "Mention that you coordinate specialized agents for menu, orders, cooking, and delivery.",
  });
  return text;
}

function printResponse(result: any) {
  console.log();
  process.stdout.write(`${COLORS.CHEF}chef>${COLORS.RESET} `);

  if (!result) {
    console.log("Sorry, I had trouble responding. Please try again.");
    return;
  }

  if (result.message) console.log(result.message);

  if (result.menuDisplay) {
    console.log(result.menuDisplay);
  } else if (result.menu) {
    console.log("\nAvailable Dishes:");
    for (const dish of result.menu) {
      console.log(` - ${dish.name} (${dish.category})${dish.price ? ` - $${dish.price}` : ""}`);
    }
  }

  if (result.status && result.status !== "no_orders") {
    console.log(`\nStatus: ${result.status}`);
    if (result.estimatedTime) console.log(`ETA: ${result.estimatedTime}`);
    if (typeof result.progress === "number") console.log(`Progress: ${result.progress}%`);
  }

  if (Array.isArray(result.suggestions) && result.suggestions.length > 0) {
    console.log("\nSuggestions:");
    for (const s of result.suggestions) {
      console.log(` - ${s}`);
    }
  }
}

// Main loop calling orchestrator flow directly
async function main() {
  const userId = "cli-user";

  const greeting = await getGreeting();
  console.log();
  printColored("chef", greeting, COLORS.CHEF);
  console.log(`\n${COLORS.AGENT}🎭 Kitchen Multi-Agent System Active:${COLORS.RESET}`);
  console.log("   • Kitchen Orchestrator - Central router and coordinator");
  console.log("   • Menu & Recipe Agent - Dynamic menu generation");
  console.log("   • Order Manager Agent - Order lifecycle management");
  console.log("   • Chef Agent - Cooking execution and timing");
  console.log("   • Waiter Agent - Customer communication and delivery");

  // eslint-disable-next-line no-constant-condition
  while (true) {
    await new Promise<void>((resolve) => {
      rl.question(`\n${COLORS.PROMPT}prompt>${COLORS.RESET} `, async (input) => {
        try {
          if (!input || input.trim().toLowerCase() === "exit") {
            rl.close();
            process.exit(0);
          }
          const result = await kitchenOrchestratorFlow.run({userId, message: input});
          printResponse(result);
          resolve();
        } catch (e) {
          console.log("Error:", e);
          resolve();
        }
      });
    });
  }
}

main().catch(console.error);
