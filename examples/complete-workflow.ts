/**
 * Complete Workflow Example
 * Demonstrates a real-world use case combining multiple features:
 * - Data extraction with pagination
 * - Scheduling
 * - Webhooks
 */

import 'dotenv/config';
import { MaxunExtract } from 'maxun-sdk';

async function completeWorkflowExample() {
  console.log('=== Complete Workflow Example ===\n');

  const extractor = new MaxunExtract({
    apiKey: process.env.MAXUN_API_KEY!,
    baseUrl: process.env.MAXUN_BASE_URL
  });

  try {
    console.log('Creating full extraction robot...');
    const robot = await extractor
      .create('Trending Books Daily')
      .navigate('https://openlibrary.org/trending/daily')
      .captureList({
        selector: 'li.searchResultItem.sri--w-main',
        pagination: {
          type: 'clickNext',
          selector: 'a[data-ol-link-track="Pager|Next"]'
        },
        maxItems: 25
      });

    console.log(`✓ Robot created: ${robot.id}\n`);

    console.log('Setting up webhook for notifications...');
    await robot.addWebhook({
      url: 'https://your-webhook-endpoint.com/notifications',
      events: ['run.completed', 'run.failed']
    });
    console.log('✓ Webhook configured\n');

    console.log('Scheduling robot to run every 10 minutes...');
    await robot.schedule({
      runEvery: 1,
      runEveryUnit: 'DAYS',
      timezone: 'UTC'
    });
    console.log('✓ Robot scheduled\n');

    console.log('Robot Configuration Summary:');
    console.log(`  Name: ${robot.name}`);
    console.log(`  ID: ${robot.id}`);

    const schedule = robot.getSchedule();
    console.log(`  Schedule: Every ${schedule?.runEvery} ${schedule?.runEveryUnit}`);

    const webhooks = robot.getWebhooks();
    console.log(`  Webhooks: ${webhooks?.length || 0} configured`);
    console.log();

    console.log('Fetching execution history...');
    const runs = await robot.getRuns();
    console.log(`✓ Found ${runs.length} runs:`);
    runs.slice(0, 5).forEach((run, i) => {
      console.log(`  ${i + 1}. ${run.runId} - ${run.status} - ${run.startedAt}`);
    });
  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
  }
}

// Run the example
if (!process.env.MAXUN_API_KEY) {
  console.error('Please set MAXUN_API_KEY environment variable');
  process.exit(1);
}

completeWorkflowExample();
