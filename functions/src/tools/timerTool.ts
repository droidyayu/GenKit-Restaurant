import {ai, z} from "../genkit";

export const timerTool = ai.defineTool(
  {
    name: "timerTool",
    description: "Simulates time progression for cooking phases",
    inputSchema: z.object({
      phase: z.string().describe(
        "The current cooking phase (e.g., PREP, COOKING, PLATING)"
      ),
      duration: z.number().describe("Duration in minutes"),
      message: z.string().describe("Status message for this phase"),
    }),
  },
  async ({phase, duration, message}) => {
    // Simulate time delay (1 second per minute)
    await new Promise((resolve) => setTimeout(resolve, Math.min(duration * 1000, 5000)));

    console.log(`[KITCHEN TIMER] ${phase}: ${message} (${duration} minutes)`);

    return {
      phase,
      duration,
      message,
      completed: true,
      timestamp: new Date().toISOString(),
    };
  }
);
