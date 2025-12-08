/**
 * List Pagination Example
 *
 * This example demonstrates:
 * - Extracting lists with captureList
 * - Handling pagination automatically
 * - Different pagination strategies
 * - Setting maxItems limit
 *
 * Site: GitHub Trending Repositories (https://github.com/trending)
 */

import 'dotenv/config';
import { MaxunExtract } from 'maxun-sdk';

async function main() {
  const extractor = new MaxunExtract({
    apiKey: process.env.MAXUN_API_KEY!,
    baseUrl: process.env.MAXUN_BASE_URL!
  });

  try {
    // Extract trending repositories from GitHub
    const robot = await extractor
      .create('GitHub Trending Repos')
      .navigate('https://github.com/trending')
      .captureList({
        selector: 'article.Box-row',
        maxItems: 25
      });

    console.log(`Robot created: ${robot.id}`);

    const result = await robot.run();

    console.log(`\nExtracted ${result.data.listData?.length || 0} trending repositories`);
    console.log('\nFirst 3 repositories:');
    console.log(JSON.stringify(result.data.listData?.slice(0, 3), null, 2));

    // Other pagination examples:
    //
    // Example 1: Infinite scroll (Reddit, Twitter, etc.)
    // .captureList({
    //   selector: '.post',
    //   pagination: { type: 'scrollDown' },
    //   maxItems: 50
    // })
    //
    // Example 2: Click "Next" button (traditional pagination)
    // .captureList({
    //   selector: '.product-item',
    //   pagination: { type: 'clickNext', selector: '.pagination-next' },
    //   maxItems: 100
    // })
    //
    // Example 3: Click "Load More" button
    // .captureList({
    //   selector: '.article',
    //   pagination: { type: 'clickLoadMore', selector: 'button.load-more' },
    //   maxItems: 30
    // })

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
