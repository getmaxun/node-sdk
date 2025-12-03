/**
 * Chained Actions Example
 *
 * This example demonstrates:
 * - Chaining multiple actions in a workflow
 * - Combining captureText and captureList
 * - Extracting both single fields and lists from the same page
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
      .create('Books Page Extractor')
      .navigate('https://books.toscrape.com/')
      .captureText({
        pageTitle: 'h1'
      }, 'Page Info')
      .captureList({
        selector: 'article.product_pod',
        maxItems: 20
      }, 'Books List');

    console.log(`Robot created: ${robot.id}`);

    const result = await robot.run();

    console.log('\nPage Info:');
    console.log(result.data.textData);

    console.log('\nBooks extracted:', result.data.listData?.length || 0);
    console.log('First 3 books:');
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
