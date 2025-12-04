/**
 * Example: Interactive List Field Preview and Configuration
 *
 * This example demonstrates the new captureList feature that allows users to:
 * 1. Preview extracted fields from a list before saving
 * 2. Select which fields to keep
 * 3. Rename fields with custom names
 *
 * Run: npx tsx examples/list-field-preview.ts
 */

import 'dotenv/config';
import { MaxunExtract } from '@maxun/extract';

async function main() {
  const extractor = new MaxunExtract({
    apiKey: process.env.MAXUN_API_KEY!,
    baseUrl: process.env.MAXUN_BASE_URL || 'http://localhost:5001/api/sdk',
  });

  console.log('Creating extraction robot with interactive field configuration...\n');

  // When captureList is called, it will:
  // 1. Extract sample fields from the page
  // 2. Display them in a table with sample values
  // 3. Prompt you to select which fields to keep
  // 4. Prompt you to rename each selected field
  // 5. Save the configuration to the workflow
  const robot = await extractor
    .create('Github Repositories')
    .navigate('https://github.com/ab?tab=repositories')
    .captureList({
      selector: 'li.col-12.d-flex.flex-justify-between.width-full.py-4.border-bottom.color-border-muted.public',
      maxItems: 50,
    });

  console.log(`\n✅ Robot created: ${robot.id}`);
  console.log(`   Name: ${robot.name}\n`);

  // Execute the robot
  console.log('Executing robot...\n');
  const result = await robot.run();

  console.log('Extraction complete!');
  console.log(`Status: ${result.status}`);

  // Display sample of extracted data with custom field names
  if (result.data.listData) {
    console.log(`Extracted ${result.data.listData.length} items\n`);
    console.log('Sample extracted data:');
    console.log(JSON.stringify(result.data.listData, null, 2));
  } else {
    console.log('No list data extracted\n');
  }
}

main().catch(console.error);
