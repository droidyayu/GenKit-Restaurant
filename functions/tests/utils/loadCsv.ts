import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface TestStep {
  test_id: string;
  turn: number;
  input: string;
  expected: string;
}

export interface ConversationTest {
  id: string;
  steps: TestStep[];
}

/**
 * Loads and parses a CSV file containing test cases for agent conversations
 * @param csvFileName - Name of the CSV file (without .csv extension) in tests/data/
 * @returns Array of conversation test cases grouped by test_id
 */
export function loadCsv(csvFileName: string): ConversationTest[] {
  const csvPath = join(__dirname, '..', 'data', `${csvFileName}.csv`);
  const csvContent = readFileSync(csvPath, 'utf-8');

  const records: TestStep[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  // Group records by test_id
  const conversations = new Map<string, TestStep[]>();

  for (const record of records) {
    const testStep: TestStep = {
      test_id: record.test_id,
      turn: Number(record.turn),
      input: record.input,
      expected: record.expected,
    };

    if (!conversations.has(testStep.test_id)) {
      conversations.set(testStep.test_id, []);
    }

    conversations.get(testStep.test_id)!.push(testStep);
  }

  // Convert to ConversationTest array and sort steps by turn
  const result: ConversationTest[] = [];
  for (const [id, steps] of conversations) {
    result.push({
      id,
      steps: steps.sort((a, b) => a.turn - b.turn),
    });
  }

  return result;
}
