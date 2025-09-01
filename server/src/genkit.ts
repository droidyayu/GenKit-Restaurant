import { gemini20Flash, googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit/beta';
import { enableFirebaseTelemetry } from '@genkit-ai/firebase';

enableFirebaseTelemetry();

export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })],
  model: gemini20Flash,
});

export { z } from 'genkit';
