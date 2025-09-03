# Genkit Agent Test Harness

This directory contains a comprehensive test harness for testing Genkit agents using Jest and CSV-driven test cases.

## Features

- **CSV-driven testing**: Store test cases in CSV files for easy maintenance
- **Multi-turn conversations**: Support for conversational flows with state preservation
- **Single-turn interactions**: Simple request-response testing
- **Flexible assertions**: Case-insensitive keyword matching in responses
- **Comprehensive reporting**: Detailed console output for debugging

## Directory Structure

```
tests/
├── data/           # CSV test data files
│   ├── orderAgent.csv
│   └── menuAgent.csv
├── utils/          # Test utilities
│   ├── loadCsv.ts      # CSV parsing and grouping
│   └── runConversation.ts  # Conversation execution
├── setup.ts        # Jest environment setup
├── *.test.ts       # Test files
└── README.md       # This file
```

## CSV Format

Test cases are stored in CSV files with the following columns:

```csv
test_id,turn,input,expected
order1,1,I want Butter Chicken,ask_quantity
order1,2,2,Butter Chicken x2
order2,1,I want Aloo Paratha,Aloo Paratha
```

- `test_id`: Groups related conversation turns
- `turn`: Turn number (1, 2, 3, etc.)
- `input`: User input for this turn
- `expected`: Keyword expected in the agent's response (case-insensitive)

## Usage

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test orderManagerAgent.test.ts

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Creating New Test Cases

1. **Add CSV data**: Create or update CSV files in `tests/data/`
2. **Create test file**: Use the provided utilities in your test file

```typescript
import { describe, it, expect } from '@jest/globals';
import { yourAgent } from '../src/agents/yourAgent';
import { loadCsv } from './utils/loadCsv';
import { runConversation } from './utils/runConversation';

describe('yourAgent tests', () => {
  const cases = loadCsv('yourAgent');

  cases.forEach(conv => {
    it(`should handle conversation ${conv.id}`, async () => {
      const result = await runConversation(yourAgent, conv);
      result.forEach((res, i) => {
        expect(res.text.toLowerCase()).toContain(conv.steps[i].expected.toLowerCase());
      });
    });
  });
});
```

### Single-turn Tests

For simple single-turn interactions:

```typescript
import { runSingleTurn } from './utils/runConversation';

it('should handle simple request', async () => {
  const result = await runSingleTurn(
    yourAgent,
    'input message',
    'expected_keyword'
  );

  expect(result.success).toBe(true);
});
```

## Utilities

### `loadCsv(csvFileName: string): ConversationTest[]`

Loads and parses a CSV file, grouping rows by `test_id`.

### `runConversation(agent, conversation, userId?): Promise<ConversationResult[]>`

Executes a multi-turn conversation against an agent, maintaining state across turns.

### `runSingleTurn(agent, input, expected, userId?): Promise<ConversationResult>`

Executes a single-turn interaction for simple request-response testing.

## Environment Setup

Make sure you have the required environment variables:

```bash
# Copy and configure environment file
cp env.example .env
# Add your GOOGLE_GENAI_API_KEY to .env
```

## Best Practices

1. **Descriptive test IDs**: Use meaningful names like `order1`, `menu_veg`, etc.
2. **Specific expectations**: Use specific keywords that uniquely identify successful responses
3. **Reasonable timeouts**: AI calls may take time; use 30-60 second timeouts
4. **Comprehensive coverage**: Test both success and edge cases
5. **Regular updates**: Keep CSV files updated as agent behavior changes

## Troubleshooting

- **API Key Issues**: Ensure `GOOGLE_GENAI_API_KEY` is set in your `.env` file
- **Timeout Errors**: Increase Jest timeout for slow AI responses
- **CSV Parsing Issues**: Check CSV format and ensure proper quoting for special characters
- **Import Errors**: Verify TypeScript paths and agent exports

## Example Output

```
✓ should handle conversation order1 (4500ms)
  Turn 1: Input: "I want Butter Chicken" | Expected: "ask_quantity" | Response: "How many portions of Butter Chicken would you like?" | Success: true
  Turn 2: Input: "2" | Expected: "Butter Chicken x2" | Response: "Great! I've placed your order for 2 portions of Butter Chicken." | Success: true
```
