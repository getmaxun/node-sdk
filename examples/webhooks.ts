/**
 * Get notified when a run finishes.
 *
 * Maxun POSTs { event_type: 'run_completed' | 'run_failed', timestamp, webhook_id, data }
 * to your URL. Failed deliveries are retried with exponential backoff.
 */
import 'dotenv/config';
import { Maxun } from 'maxun-sdk';

const maxun = new Maxun();

async function main() {
  const robot = await maxun.scrape('https://example.com', { name: 'Example With Webhook' });

  // Both events by default
  const hook = await robot.addWebhook('https://your-server.example/maxun-hook');
  console.log('Added', hook.id, hook.events);

  // Only failures, with more retries
  await robot.addWebhook({ url: 'https://alerts.example/maxun-failed', events: ['run_failed'], retryAttempts: 5 });

  console.log(robot.getWebhooks().map((w) => w.url));

  await robot.removeWebhook('https://alerts.example/maxun-failed');
  await robot.removeWebhooks(); // remove all
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
