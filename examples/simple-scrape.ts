/**
 * Simple Scraping Example
 *
 * This example demonstrates:
 * - Using the Scrape SDK for simple page scraping
 * - Getting page content in markdown and HTML formats
 * - No workflow needed - just URL and format
 */

import 'dotenv/config';
import { MaxunScrape } from '@maxun/scrape';

async function main() {
  const scraper = new MaxunScrape({
    apiKey: process.env.MAXUN_API_KEY!,
    baseUrl: process.env.MAXUN_BASE_URL || 'http://localhost:5001/api/sdk'
  });

  try {
    const robot = await scraper.create(
      'Wikipedia Scraper',
      'https://en.wikipedia.org/wiki/Web_scraping',
      {
        formats: ['markdown', 'html']
      }
    );

    console.log(`Robot created: ${robot.id}`);

    const result = await robot.run();

    console.log('\nScraping completed');
    console.log('Markdown length:', result.data.markdown?.length || 0, 'characters');
    console.log('HTML length:', result.data.html?.length || 0, 'characters');

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
