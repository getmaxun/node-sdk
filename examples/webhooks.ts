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
import { MaxunExtract } from 'maxun-sdk';

async function main() {
  const extractor = new MaxunExtract({
    apiKey: process.env.MAXUN_API_KEY!,
    baseUrl: process.env.MAXUN_BASE_URL!
  });

  try {
    // Create a robot to extract Indie Hackers posts
    const robot = await extractor
      .create('Indie Hackers Posts Monitor')
      .navigate('https://www.indiehackers.com')
      .captureList({
        selector: '.feed-item',
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

    // Note: In production, you would NOT remove webhooks immediately
    // This is just for demonstration purposes
    await robot.removeWebhooks();
    console.log('\n✓ Webhooks removed (for demo purposes)');

    console.log('\n=== Webhook Payload Example ===');
    console.log('{');
    console.log('  "event": "run.completed",');
    console.log('  "robotId": "robot_123",');
    console.log('  "runId": "run_456",');
    console.log('  "status": "success",');
    console.log('  "data": { ... },');
    console.log('  "timestamp": "2024-01-15T10:30:00Z"');
    console.log('}');

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
