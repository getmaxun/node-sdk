/**
 * Basic Extraction Example
 * Extracts structured data from a single page
 */

import { MaxunExtract } from '@maxun/extract';

async function basicExtraction() {
  console.log('=== Basic Extraction Example ===\n');

  // Initialize the SDK
  const extractor = new MaxunExtract({
    apiKey: process.env.MAXUN_API_KEY!,
    baseUrl: process.env.MAXUN_BASE_URL || 'http://localhost:5001/api/sdk'
  });

  try {
    // Create a robot that extracts product details
    console.log('Creating robot...');
    const robot = await extractor
      .create('Product Details Extractor')
      .navigate('https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html')
      .captureText({
        title: 'h1',
        price: '.price_color',
        availability: '.availability',
        description: '#product_description + p'
      });

    console.log(`✓ Robot created: ${robot.id}\n`);

    // Execute the robot
    console.log('Executing robot...');
    const result = await robot.run();

    console.log('✓ Execution completed!\n');
    console.log('Results:');
    console.log(JSON.stringify(result.data.textData, null, 2));

    // Clean up
    console.log('\nCleaning up...');
    await robot.delete();
    console.log('✓ Robot deleted\n');

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

basicExtraction();
