import "dotenv/config";
import {createInterface} from "node:readline";
import {kitchenOrchestratorFlow} from "./flows/kitchenOrchestratorFlow";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const COLORS = {
  RESET: "\x1b[0m",
  PROMPT: "\x1b[36m",
  CHEF: "\x1b[33m",
  AGENT: "\x1b[35m",
  USER: "\x1b[32m",
  ASSISTANT: "\x1b[34m",
};

function printColored(role: string, message: string, color: string) {
  const roleLabel = role === "chef" ? "chef>" : role === "user" ? "user>" : "assistant>";
  console.log(`${color}${roleLabel}${COLORS.RESET} ${message}`);
}

function printResponse(response: {message: string}) {
  printColored("assistant", response.message, COLORS.ASSISTANT);
}

async function getGreeting(): Promise<string> {
  return `Hi there! Welcome to Bollywood Grill! I'm your Kitchen Agent, and it's great to have you. 
  Need help with our delicious menu, placing an order, checking on your cooking, or even delivery? 
  I coordinate our specialized agents for all of those areas, so let me know what you need!`;
}

// Main loop calling kitchen orchestrator flow directly
async function main() {
  const greeting = await getGreeting();
  console.log();
  console.log(`\n${COLORS.AGENT}🎭 Kitchen Multi-Agent System Active:${COLORS.RESET}`);

  printColored("chef", greeting, COLORS.CHEF);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    await new Promise<void>((resolve) => {
      rl.question(`\n${COLORS.PROMPT}prompt>${COLORS.RESET} `, async (input) => {
        try {
          if (!input || input.trim().toLowerCase() === "exit") {
            rl.close();
            process.exit(0);
          }

          // Use the kitchenOrchestratorFlow with proper Genkit API
          const result = await kitchenOrchestratorFlow.run({
            userId: "cli-user",
            message: input,
          });

          printResponse({message: result.result.message});
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
