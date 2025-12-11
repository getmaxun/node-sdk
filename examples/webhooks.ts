/**
 * Webhooks Example
 *
 * This example demonstrates:
 * - Adding webhooks for robot events
 * - Configuring webhook events and headers
 * - Getting webhook notifications when runs complete
 *
 * Site: Indie Hackers (https://www.indiehackers.com)
 */

import 'dotenv/config';
import { Extract } from 'maxun-sdk';

async function main() {
  const extractor = new Extract({
    apiKey: process.env.MAXUN_API_KEY!,
    baseUrl: process.env.MAXUN_BASE_URL!
  });

  try {
    // Create a robot to extract Indie Hackers posts
    const robot = await extractor
      .create('Indie Hackers Posts Monitor')
      .navigate('https://www.indiehackers.com/tags/artificial-intelligence')
      .captureList({
        selector: 'a.ember-view.portal-entry',
        maxItems: 10
      });

    console.log(`Robot created: ${robot.id}`);

    // Add webhook for notifications
    await robot.addWebhook({
      url: 'https://your-webhook-url.com/notifications',
      events: ['run.completed', 'run.failed'],
      headers: {
        'Authorization': 'Bearer your-secret-token',
        'X-Custom-Header': 'maxun-webhook'
      }
    });

    console.log('\n✓ Webhook added');
    console.log('  URL: https://your-webhook-url.com/notifications');
    console.log('  Events: run.completed, run.failed');

    const webhooks = robot.getWebhooks();
    console.log(`\n✓ Total webhooks configured: ${webhooks?.length || 0}`);

    // Run the robot - webhook will be triggered on completion
    console.log('\nRunning robot...');
    const result = await robot.run();

    console.log(`\n✓ Run completed: ${result.runId}`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Items extracted: ${result.data.listData?.length || 0}`);
    console.log('\n→ Webhook notification has been sent to your endpoint');

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
