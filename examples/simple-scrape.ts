/**
 * Simple Scraping Example
 * Demonstrates basic page scraping with format selection
 */

import { MaxunScrape } from '@maxun/scrape';

async function simpleScrape() {
  console.log('=== Simple Scraping Example ===\n');

  const scraper = new MaxunScrape({
    apiKey: process.env.MAXUN_API_KEY!,
    baseUrl: process.env.MAXUN_BASE_URL || 'http://localhost:5001/api/sdk'
  });

  try {
    // Create a simple scraper - just URL and format!
    console.log('Creating scraper...');
    const robot = await scraper
      .create('Wikipedia Scraper Both')
      .url('https://en.wikipedia.org/wiki/Web_scraping')
      .asMarkdown()  // Can also use .asHTML() or both
      .asHTML()
      .build();

    console.log(`✓ Robot created: ${robot.id}\n`);

    // Execute the robot
    console.log('Executing scraper...');
    const result = await robot.run();

    console.log('✓ Scraping completed!\n');
    console.log('Results:');
    console.log(JSON.stringify(result.data, null, 2));

    // Clean up
    // console.log('\nCleaning up...');
    // await robot.delete();
    // console.log('✓ Robot deleted\n');

  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
  }
}

// Run the example
if (!process.env.MAXUN_API_KEY) {
  console.error('Please set MAXUN_API_KEY environment variable');
  process.exit(1);
}

simpleScrape();
