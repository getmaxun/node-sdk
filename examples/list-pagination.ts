/**
 * List Pagination Example
 *
 * This example demonstrates:
 * - Extracting lists with captureList
 * - Auto-detecting pagination (recommended)
 * - Manually specifying pagination types
 * - Setting maxItems limit
 */

import 'dotenv/config';
import { MaxunExtract } from '@maxun/extract';

async function main() {
  const extractor = new MaxunExtract({
    apiKey: process.env.MAXUN_API_KEY!,
    baseUrl: process.env.MAXUN_BASE_URL || 'http://localhost:5001/api/sdk'
  });

  try {
    const robot = await extractor
      .create('Books List Extractor')
      .navigate('https://books.toscrape.com/')
      .captureList({
        selector: 'article.product_pod',
        maxItems: 50
      });

    console.log(`Robot created: ${robot.id}`);

    const result = await robot.run();

    console.log(`\nExtracted ${result.data.listData?.length || 0} items`);
    console.log('\nFirst 3 items:');
    console.log(JSON.stringify(result.data.listData?.slice(0, 3), null, 2));

    // Other pagination options available:
    //
    // Infinite scroll:
    // pagination: { type: 'scrollDown' }
    //
    // Click Next button:
    // pagination: { type: 'clickNext', selector: '.next a' }
    //
    // Click Load More:
    // pagination: { type: 'clickLoadMore', selector: '.load-more' }

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
