// Load environment variables from .env file
import "dotenv/config";

// Import the Genkit core libraries and plugins.
import {genkit, z} from "genkit";
import {gemini20Flash, googleAI} from "@genkit-ai/googleai";
import {initializeApp, getApps} from "firebase-admin/app";

// Initialize Firebase Admin (only if not already initialized)
if (getApps().length === 0) {
  try {
    initializeApp();
    console.log("[GENKIT] Firebase Admin initialized");
  } catch (error) {
    console.warn("[GENKIT] Firebase Admin initialization failed:", error);
  }
}

// The Firebase telemetry plugin exports a combination of metrics, traces, and logs to Google Cloud
// Observability. See https://firebase.google.com/docs/genkit/observability/telemetry-collection.
import {enableFirebaseTelemetry} from "@genkit-ai/firebase";
enableFirebaseTelemetry();

const ai = genkit({
  plugins: [
    // Load the Google AI plugin. You can optionally specify your API key
    // by passing in a config object; if you don't, the Google AI plugin uses
    // the value from the GOOGLE_GENAI_API_KEY environment variable, which is
    // the recommended practice.
    googleAI(),
  ],
  model: gemini20Flash,
});

// Export the ai instance and z for use in other files
export {ai, z};
