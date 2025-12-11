/**
 * Scheduling Example
 *
 * This example demonstrates:
 * - Scheduling robots for periodic execution
 * - Different time intervals (minutes, hours, days, weeks, months)
 * - Setting timezone and time windows
 * - Updating and removing schedules
 *
 * Site: Dev.to Latest Posts (https://dev.to/latest)
 */

import 'dotenv/config';
import { Extract } from 'maxun-sdk';

async function main() {
  const extractor = new Extract({
    apiKey: process.env.MAXUN_API_KEY!,
    baseUrl: process.env.MAXUN_BASE_URL!
  });

  try {
    // Create a robot to track Dev.to latest posts
    const robot = await extractor
      .create('Google Trends (US)')
      .navigate('https://trends.google.com/trending?geo=US')
      .captureList({
        selector: 'tr.enOdEe-wZVHld-xMbwt.UlR2Yc',
        maxItems: 20
      });

    console.log(`Robot created: ${robot.id}`);

    // Schedule: Run every 6 hours
    await robot.schedule({
      runEvery: 6,
      runEveryUnit: 'HOURS',
      timezone: 'America/New_York'
    });

    let schedule = robot.getSchedule();
    console.log(`\n✓ Scheduled: Every ${schedule?.runEvery} ${schedule?.runEveryUnit}`);
    console.log(`  Timezone: ${schedule?.timezone}`);
    console.log(`  Next run: ${schedule?.nextRunAt}`);

    // Update schedule: Business hours only (Mon-Fri, 9 AM - 5 PM)
    await robot.schedule({
      runEvery: 2,
      runEveryUnit: 'HOURS',
      timezone: 'America/New_York',
      startFrom: 'MONDAY',
      atTimeStart: '09:00',
      atTimeEnd: '17:00'
    });

    schedule = robot.getSchedule();
    console.log(`\n✓ Updated schedule: Every ${schedule?.runEvery} ${schedule?.runEveryUnit}`);
    console.log(`  Time window: ${schedule?.atTimeStart} - ${schedule?.atTimeEnd}`);
    console.log(`  Starting: ${schedule?.startFrom}`);

    // Run manually once to test
    console.log('\nRunning manually...');
    const result = await robot.run();
    console.log(`✓ Manual run completed: ${result.data.listData?.length || 0} posts extracted`);

    // Remove schedule
    await robot.unschedule();
    console.log('\n✓ Schedule removed');

    console.log('\n=== Other Scheduling Examples ===');
    console.log('Daily at midnight:');
    console.log('  { runEvery: 1, runEveryUnit: "DAYS", timezone: "America/New_York", atTimeStart: "00:00" }');
    console.log('\nWeekly on Fridays:');
    console.log('  { runEvery: 1, runEveryUnit: "WEEKS", startFrom: "FRIDAY", timezone: "America/New_York" }');
    console.log('\nMonthly on 1st:');
    console.log('  { runEvery: 1, runEveryUnit: "MONTHS", dayOfMonth: 1, timezone: "America/New_York" }');

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
