/**
 * Basic Extraction Example
 *
 * This example demonstrates:
 * - Creating a robot with captureText
 * - Extracting specific fields from a single page
 * - Running the robot and retrieving results
 *
 * Site: Hacker News (https://news.ycombinator.com)
 */

import 'dotenv/config';
import { Extract } from 'maxun-sdk';

async function main() {
  const extractor = new Extract({
    apiKey: process.env.MAXUN_API_KEY!,
    baseUrl: process.env.MAXUN_BASE_URL!
  });

  try {
    // Extract top story from Hacker News
    const robot = await extractor
      .create('Hacker News Top Story')
      .navigate('https://news.ycombinator.com')
      .captureText({
        Title: 'tr.athing:first-child .titleline > a',
        Points: 'tr.athing:first-child + tr .score',
        Author: 'tr.athing:first-child + tr .hnuser',
        Posted: 'tr.athing:first-child + tr a:last-child'
      });

    console.log(`Robot created: ${robot.id}`);

    const result = await robot.run();

    console.log('\nExtracted Hacker News Top Story:');
    console.log(JSON.stringify(result.data.textData, null, 2));

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
