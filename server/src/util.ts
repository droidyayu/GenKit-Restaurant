
export const agentDescription = (specialization: string, tools: string[]) => `
Transfer to this agent when the user asks about ${specialization}. 
This agent can perform the following functions: ${tools.map((t) => t).join(', ')}.
Do not mention that you are transferring, just do it.`;
