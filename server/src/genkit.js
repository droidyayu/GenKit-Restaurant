import { gemini15Pro, googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit/beta';

export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })],
  model: gemini15Pro,
});

export { z } from 'genkit';
