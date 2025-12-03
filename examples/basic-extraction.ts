/**
 * Basic Extraction Example
 *
 * This example demonstrates:
 * - Creating a robot with captureText
 * - Extracting specific fields from a single page
 * - Running the robot and retrieving results
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
      .create('Product Details Extractor')
      .navigate('https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html')
      .captureText({
        title: 'h1',
        price: '.price_color',
        availability: '.availability',
        description: '#product_description + p'
      });

    console.log(`Robot created: ${robot.id}`);

    const result = await robot.run();

    console.log('\nExtracted data:');
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
