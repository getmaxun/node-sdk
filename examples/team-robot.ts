/**
 * Team Robot Example
 *
 * This example demonstrates:
 * - Creating a robot scoped to a team (using teamId in Config)
 * - Running the robot in team space
 * - Listing runs scoped to the team
 * - Deleting the robot from the team
 *
 * Prerequisites:
 * - MAXUN_API_KEY: API key of a user who is a member of the team
 * - MAXUN_TEAM_ID: The UUID of the team (visible in team settings)
 * - MAXUN_BASE_URL: Base URL of your Maxun instance
 */

import 'dotenv/config';
import { Extract } from 'maxun-sdk';

async function main() {
  const extractor = new Extract({
    apiKey: process.env.MAXUN_API_KEY!,
    baseUrl: process.env.MAXUN_BASE_URL,
    teamId: process.env.MAXUN_TEAM_ID,
  });

  try {
    console.log(`Creating robot in team: ${process.env.MAXUN_TEAM_ID}`);

    const robot = await extractor
      .create('Team Books Scraper')
      .navigate('https://books.toscrape.com/')
      .captureList({
        selector: 'article.product_pod',
        maxItems: 5,
      });

    console.log(`Robot created: ${robot.id}`);
    console.log(`Robot name:   ${robot.name}`);

    const teamRobots = await extractor.getRobots();
    console.log(`\nTotal robots in team: ${teamRobots.length}`);

    console.log('\nRunning robot...');
    const result = await robot.run();

    console.log('\n=== Run Completed ===');
    console.log('Status:', result.status);
    console.log('Run ID:', result.runId);
    console.log('Items extracted:', result.data.listData?.length ?? 0);

    const runs = await robot.getRuns();
    console.log(`\nTotal runs for this robot in team: ${runs.length}`);

    const specificRun = await robot.getRun(result.runId);
    console.log(`Fetched run status: ${specificRun.status}`);
  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.details) {
      console.error('Details:', JSON.stringify(error.details, null, 2));
    }
    process.exit(1);
  }
}

if (!process.env.MAXUN_API_KEY) {
  console.error('Error: MAXUN_API_KEY environment variable is required');
  process.exit(1);
}

main();
