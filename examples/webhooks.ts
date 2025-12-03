/**
 * Webhooks Example
 *
 * This example demonstrates:
 * - Adding webhooks for robot events
 * - Configuring webhook events and headers
 * - Listing and removing webhooks
 */

import 'dotenv/config';
import { MaxunExtract } from '@maxun/extract';

async function main() {
  const extractor = new MaxunExtract({
    apiKey: process.env.MAXUN_API_KEY!,
    baseUrl: process.env.MAXUN_BASE_URL || 'http://localhost:5001/api/sdk'
  });

  try {
    const robot = await extractor
      .create('Webhook Demo')
      .navigate('https://books.toscrape.com/')
      .captureList({
        selector: 'article.product_pod',
        maxItems: 10
      });

    console.log(`Robot created: ${robot.id}`);

    await robot.addWebhook({
      url: 'https://your-webhook-url.com/notifications',
      events: ['run.completed', 'run.failed'],
      headers: {
        'Authorization': 'Bearer your-token',
        'X-Custom-Header': 'value'
      }
    });

    console.log('\nWebhook added');

    const webhooks = robot.getWebhooks();
    console.log(`Total webhooks: ${webhooks?.length || 0}`);

    // Run the robot - webhook will be triggered
    const result = await robot.run();
    console.log(`\nRun completed: ${result.runId}`);
    console.log('Webhook notification sent');

    await robot.removeWebhooks();
    console.log('\nWebhooks removed');

  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (!process.env.MAXUN_API_KEY) {
  console.error('Error: MAXUN_API_KEY environment variable is required');
  process.exit(1);
}

main();
