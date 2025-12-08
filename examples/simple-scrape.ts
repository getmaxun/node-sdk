/**
 * Simple Scraping Example
 *
 * This example demonstrates:
 * - Using the Scrape SDK for simple page scraping
 * - Getting page content in markdown and HTML formats
 * - Capturing page screenshots
 * - No workflow needed - just URL and format
 *
 * Site: Wikipedia (https://en.wikipedia.org)
 */

import 'dotenv/config';
import { MaxunScrape } from 'maxun-sdk';

async function main() {
  const scraper = new MaxunScrape({
    apiKey: process.env.MAXUN_API_KEY!,
    baseUrl: process.env.MAXUN_BASE_URL!
  });

  try {
    const robot = await scraper.create(
      'Wikipedia Web Scraping Article',
      'https://en.wikipedia.org/wiki/Web_scraping',
      {
        formats: ['markdown', 'html', 'screenshot-fullpage']
      }
    );

    console.log(`Robot created: ${robot.id}`);

    const result = await robot.run();

    console.log('\n=== Scraping Completed ===');
    console.log('Markdown length:', result.data.markdown?.length || 0, 'characters');
    console.log('HTML length:', result.data.html?.length || 0, 'characters');
    console.log('Screenshots:', result.screenshots?.length || 0);

    if (result.screenshots && result.screenshots.length > 0) {
      console.log('\nScreenshot URLs:');
      result.screenshots.forEach((url, i) => {
        console.log(`  ${i + 1}. ${url}`);
      });
    }

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
