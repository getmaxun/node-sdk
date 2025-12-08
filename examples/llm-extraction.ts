/**
 * LLM-based Extraction Example
 *
 * This example demonstrates:
 * - Using natural language prompts to extract data
 * - LLM automatically generates the extraction workflow
 * - Support for multiple LLM providers (Ollama, Anthropic, OpenAI)
 * - Creates a reusable robot that can be executed anytime
 *
 * Site: Y Combinator Companies (https://www.ycombinator.com/companies)
 */

import 'dotenv/config';
import { MaxunExtract } from 'maxun-sdk';

async function main() {
  const extractor = new MaxunExtract({
    apiKey: process.env.MAXUN_API_KEY!,
    baseUrl: process.env.MAXUN_BASE_URL!
  });

  try {
    console.log('Creating robot using LLM extraction...\n');

    // Use natural language to describe what to extract
    // The LLM will automatically generate the workflow
    const robot = await extractor.extract(
      'https://www.ycombinator.com/companies',
      {
        prompt: 'Extract the first 15 YC company names, their descriptions, and batch information',
        llmProvider: 'ollama', // or 'anthropic', 'openai'
        llmModel: 'llama3.2-vision', // default for ollama
        llmBaseUrl: 'http://localhost:11434', // ollama default
        robotName: 'YC Companies LLM Extractor'
      }
    );

    console.log(`✓ Robot created: ${robot.id}`);

    // Execute the generated robot
    console.log('Executing robot...\n');
    const result = await robot.run();

    console.log(`✓ Extraction completed!`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Companies extracted: ${result.data.listData?.length || 0}\n`);

    console.log('First 3 companies:');
    console.log(JSON.stringify(result.data.listData?.slice(0, 3), null, 2));

    // Note: For Anthropic (recommended for best results):
    // llmProvider: 'anthropic',
    // llmModel: 'claude-3-5-sonnet-20241022',
    // llmApiKey: process.env.ANTHROPIC_API_KEY
    //
    // For OpenAI:
    // llmProvider: 'openai',
    // llmModel: 'gpt-4-vision-preview',
    // llmApiKey: process.env.OPENAI_API_KEY

  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
    process.exit(1);
  }
}

if (!process.env.MAXUN_API_KEY) {
  console.error('Error: MAXUN_API_KEY environment variable is required');
  process.exit(1);
}

main();
