/**
 * Example: List Extraction with Index-Based Field Selection
 *
 * This example demonstrates the new captureList feature that allows programmatic field selection:
 * - Specify which fields to extract by index (1-based)
 * - Assign custom names to each selected field
 * - Fully repeatable and automatable (no interactive prompts)
 *
 * Run: npx tsx examples/list-extraction.ts
 */

import 'dotenv/config';
import { MaxunExtract } from 'maxun-sdk';

async function main() {
  const extractor = new MaxunExtract({
    apiKey: process.env.MAXUN_API_KEY!,
    baseUrl: process.env.MAXUN_BASE_URL || 'http://localhost:5001/api/sdk',
  });

  console.log('Creating extraction robot...\n');

  const robot = await extractor
    .create('Github Repositories')
    .navigate('https://github.com/ab?tab=repositories')
    .captureList({
      selector: 'li.col-12.d-flex.flex-justify-between.width-full.py-4.border-bottom.color-border-muted.public',
      maxItems: 50
    });

  console.log(`✅ Robot created: ${robot.id}`);
  console.log(`   Name: ${robot.name}\n`);

  // Execute the robot
  console.log('Executing robot...\n');
  const result = await robot.run();

  console.log('Extraction complete!');
  console.log(`Status: ${result.status}`);

  // Display extracted data with custom field names
  if (result.data.listData) {
    console.log(`Extracted ${result.data.listData.length} items\n`);
    console.log('Sample extracted data:');
    console.log(JSON.stringify(result.data.listData, null, 2));
  } else {
    console.log('No list data extracted\n');
  }
}

main().catch(console.error);

