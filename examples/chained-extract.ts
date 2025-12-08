/**
 * Chained Multi-Page Extraction Example
 *
 * This example demonstrates:
 * - Multi-step navigation workflows
 * - Extracting data from multiple pages
 * - Combining different extraction methods
 * - Building complex scraping pipelines
 *
 * Site: Product Hunt (https://www.producthunt.com)
 */

import 'dotenv/config';
import { MaxunExtract } from 'maxun-sdk';

async function main() {
  const extractor = new MaxunExtract({
    apiKey: process.env.MAXUN_API_KEY!,
    baseUrl: process.env.MAXUN_BASE_URL!
  });

  try {
    // Navigate to Product Hunt and extract today's products
    const robot = await extractor
      .create('Premier League Score Table')
      .navigate('https://www.bbc.com/sport/football/tables')
      .captureText({
        Title: 'a#tab-PremierLeague'
      }, 'Text Data')
      .captureList({
        selector: 'tr.ssrcss-1urqilq-CellsRow.e13j9mpy2',
        maxItems: 10
      }, 'Football Scores');

    console.log(`Robot created: ${robot.id}`);

    const result = await robot.run();

    console.log('\n=== Featured Product ===');
    console.log(result.data.textData);

    console.log(`\n=== Today's Products (${result.data.listData?.length || 0}) ===`);
    console.log('First 3 products:');
    console.log(JSON.stringify(result.data.listData?.slice(0, 3), null, 2));

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
