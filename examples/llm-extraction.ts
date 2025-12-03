/**
 * Test LLM-based extraction
 *
 * This example demonstrates how to use the LLM extraction feature
 * where you provide just a natural language prompt and the system
 * automatically creates a persistent robot that can be executed.
 */

import 'dotenv/config';
import { MaxunExtract } from '@maxun/extract';

async function main() {
  // Initialize the extractor
  const extractor = new MaxunExtract({
    apiKey: process.env.MAXUN_API_KEY!,
    baseUrl: process.env.MAXUN_BASE_URL || 'http://localhost:5001/api/sdk',
  });

  console.log('Testing LLM-based robot creation...\n');

  try {
    // Create a robot using natural language with Ollama (local model)
    console.log('Creating robot from prompt using Ollama (local vision model)...');
    const robot = await extractor.extract(
      'https://www.ycombinator.com/companies',
      {
        prompt: 'Extract 275 company names and their descriptions please',
        llmProvider: 'ollama',
        llmModel: 'llama3.2-vision',
        llmBaseUrl: 'http://localhost:11434',
        robotName: 'YC Companies'
      }
    );

    console.log(`\n✓ Robot created successfully!`);
    console.log(`  ID: ${robot.id}`);
    console.log(`  Name: ${robot.name}`);

    // Now execute the robot
    console.log('\nExecuting the robot...');
    const result = await robot.run();

    console.log('\n✓ Execution completed!');
    console.log(`  Status: ${result.status}`);
    console.log(`  Run ID: ${result.runId}`);

    if (result.data?.listData && result.data.listData.length > 0) {
      console.log(`  Extracted ${result.data.listData.length} items`);
      console.log('\nFirst 3 items:');
      result.data.listData.slice(0, 3).forEach((item: any, i: number) => {
        console.log(`  ${i + 1}. ${JSON.stringify(item)}`);
      });
    }

    if (result.data?.textData) {
      console.log('\nExtracted text data:');
      console.log(JSON.stringify(result.data.textData, null, 2));
    }

    // The robot is now saved and can be re-executed anytime!
    console.log('\n✓ Robot is saved and can be executed again anytime!');
    console.log('  You can find it in your robots list or execute it again with:');
    console.log(`  await robot.run()`);

  } catch (error: any) {
    console.error('Error during LLM extraction:', error.message);
    if (error.data) {
      console.error('Error details:', error.data);
    }
    process.exit(1);
  }
}

main();
