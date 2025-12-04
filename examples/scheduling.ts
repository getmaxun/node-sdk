/**
 * Scheduling Example
 *
 * This example demonstrates:
 * - Scheduling robots for periodic execution
 * - Different time intervals (minutes, hours, days, weeks, months)
 * - Setting timezone
 * - Updating and removing schedules
 */

import 'dotenv/config';
import { MaxunExtract } from 'maxun-sdk';

async function main() {
  const extractor = new MaxunExtract({
    apiKey: process.env.MAXUN_API_KEY!,
    baseUrl: process.env.MAXUN_BASE_URL || 'http://localhost:5001/api/sdk'
  });

  try {
    const robot = await extractor
      .create('Scheduled Extractor')
      .navigate('https://books.toscrape.com/')
      .captureList({
        selector: 'article.product_pod',
        maxItems: 10
      });

    console.log(`Robot created: ${robot.id}`);

    await robot.schedule({
      runEvery: 6,
      runEveryUnit: 'HOURS',
      timezone: 'America/New_York'
    });

    let schedule = robot.getSchedule();
    console.log(`\nScheduled: Every ${schedule?.runEvery} ${schedule?.runEveryUnit}`);
    console.log(`Next run: ${schedule?.nextRunAt}`);

    await robot.schedule({
      runEvery: 2,
      runEveryUnit: 'HOURS',
      timezone: 'America/New_York',
      startFrom: 'MONDAY',
      atTimeStart: '09:00',
      atTimeEnd: '17:00'
    });

    schedule = robot.getSchedule();
    console.log(`\nUpdated: Every ${schedule?.runEvery} ${schedule?.runEveryUnit}`);
    console.log(`Between: ${schedule?.atTimeStart} - ${schedule?.atTimeEnd}`);

    // Run manually once
    const result = await robot.run();
    console.log(`\nManual run completed: ${result.data.listData?.length || 0} items`);

    await robot.unschedule();
    console.log('\nSchedule removed');

    // Other scheduling options:
    // Daily: { runEvery: 1, runEveryUnit: 'DAYS', timezone: 'America/New_York' }
    // Weekly: { runEvery: 1, runEveryUnit: 'WEEKS', startFrom: 'FRIDAY', timezone: 'America/New_York' }
    // Monthly: { runEvery: 1, runEveryUnit: 'MONTHS', dayOfMonth: 1, timezone: 'America/New_York' }

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
