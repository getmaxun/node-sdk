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
      .create('Product Hunt Daily Products')
      .navigate('https://www.producthunt.com')
      .captureText({
        Title: '[data-test="homepage-tagline"]'
      }, 'Top Products')
      .captureList({
        selector: 'section.group.relative.isolate.flex.flex-row.items-start.gap-4.rounded-xl.px-0.py-4.transition-all.duration-300.sm:-mx-4.sm:p-4.has-[[data-target]]:cursor-pointer.has-[[data-target]]:hover:sm:bg-gray-100.has-[[data-target]]:dark:hover:sm:bg-gray-dark-800.relative.isolate',
        maxItems: 10
      }, 'Products');

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
