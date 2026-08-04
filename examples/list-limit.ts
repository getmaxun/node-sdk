/**
 * List Limit Example
 *
 * This example demonstrates:
 * - Changing how many items a list action collects, without resending the workflow
 * - Updating one list on a robot that has several
 *
 * Only the limit is sent to the backend. Selectors, pagination, and every other
 * part of the robot are left exactly as they were.
 */

import 'dotenv/config';
import { Extract, Client } from 'maxun-sdk';

async function main() {
  const config = {
    apiKey: process.env.MAXUN_API_KEY!,
    baseUrl: process.env.MAXUN_BASE_URL,
  };

  const extractor = new Extract(config);

  try {
    const robot = await extractor
      .create('Books Scraper')
      .navigate('https://books.toscrape.com/')
      .captureList({
        selector: 'article.product_pod',
        maxItems: 10,
      });

    console.log(`Robot created: ${robot.id}`);

    // Collect 25 items instead of 10. The robot is otherwise untouched.
    await robot.setListLimit(25);
    console.log('List limit updated to 25');

    /**
     * For a robot with more than one list, setListLimit targets the first one.
     * Use the client directly to address a specific list by its position in the
     * workflow. Those positions are assigned server-side, so read them from the
     * robot rather than assuming them.
     */
    const client = new Client(config);
    const workflow = robot.getData().recording?.workflow || [];

    workflow.forEach((pair: any, pairIndex: number) => {
      (pair.what || []).forEach((action: any, actionIndex: number) => {
        if (action.action !== 'scrapeList') return;
        (action.args || []).forEach((arg: any, argIndex: number) => {
          if (arg && typeof arg === 'object' && 'limit' in arg) {
            console.log(`  list at pair ${pairIndex}, action ${actionIndex}, arg ${argIndex} (limit ${arg.limit})`);
          }
        });
      });
    });

    // Set several limits in a single request
    await client.updateListLimits(robot.id, [
      { pairIndex: 0, actionIndex: 0, argIndex: 0, limit: 50 },
    ]);
    console.log('List limit updated to 50');
  } catch (error: any) {
    console.error('Failed:', error.message);
  }
}

main();
