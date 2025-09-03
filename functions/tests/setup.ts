import 'dotenv/config';

// Set up test environment
process.env.NODE_ENV = 'test';

// Ensure required environment variables are set for testing
if (!process.env.GOOGLE_GENAI_API_KEY) {
  console.warn('⚠️  GOOGLE_GENAI_API_KEY not found. Tests requiring AI will be skipped.');
}

// Configure Jest timeout for AI calls
jest.setTimeout(60000); // 60 seconds for AI API calls
