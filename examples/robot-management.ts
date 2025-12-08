/**
 * Robot Management Example
 *
 * This example demonstrates:
 * - Listing all robots
 * - Getting a specific robot by ID
 * - Updating robot metadata
 * - Getting runs and execution history
 * - Deleting robots
 */

import 'dotenv/config';
import { MaxunExtract } from 'maxun-sdk';

async function main() {
  const extractor = new MaxunExtract({
    apiKey: process.env.MAXUN_API_KEY!,
    baseUrl: process.env.MAXUN_BASE_URL
  });

  try {
    const robot = await extractor
      .create('Test Robot')
      .navigate('https://books.toscrape.com/')
      .captureList({
        selector: 'article.product_pod',
        maxItems: 10
      });

    console.log(`Robot created: ${robot.id}`);

    const allRobots = await extractor.getRobots();
    console.log(`\nTotal robots: ${allRobots.length}`);

    const fetchedRobot = await extractor.getRobot(robot.id);
    console.log(`Fetched robot: ${fetchedRobot.name}`);

    await robot.update({
      meta: { name: 'Updated Test Robot' }
    });
    await robot.refresh();
    console.log(`Updated name: ${robot.name}`);

    // Run the robot
    const result = await robot.run();
    console.log(`\nRun completed: ${result.runId}`);
    console.log(`Items extracted: ${result.data.listData?.length || 0}`);

    const runs = await robot.getRuns();
    console.log(`\nTotal runs: ${runs.length}`);

    const latestRun = await robot.getLatestRun();
    console.log(`Latest run: ${latestRun?.runId}`);

    const specificRun = await robot.getRun(result.runId);
    console.log(`Specific run status: ${specificRun.status}`);

    // Delete the robot
    await robot.delete();
    console.log('\nRobot deleted');

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
