/**
 * Example showing chained captureText and captureList actions
 * Demonstrates both single field extraction and list extraction with custom names
 */

import { MaxunExtract } from '@maxun/extract';

async function chainedExtractExample() {
  console.log('=== Chained Extract Example ===\n');

  const extractor = new MaxunExtract({
    apiKey: process.env.MAXUN_API_KEY!,
    baseUrl: process.env.MAXUN_BASE_URL || 'http://localhost:5001/api/sdk'
  });

  try {
    // Create a robot that captures page info AND a list of books
    const robot = await extractor
      .create('Books Scraper')
      .navigate('https://books.toscrape.com/')

      // Capture single page-level information
      .captureText({
        siteName: '.col-sm-8 h1',
        totalBooks: '.form-horizontal'
      }, 'Page Information')

      // Capture list of books
      .captureList({
        selector: '.product_pod',
        fields: {
          title: 'h3 a',
          price: '.price_color',
          availability: '.availability',
          rating: '.star-rating',
          imageUrl: '.image_container img'
        },
        maxItems: 20
      }, 'Books List');

    console.log('✓ Robot created:', robot.id);
    console.log('\nRobot has 2 capture actions:');
    console.log('  1. Page Information (scrapeSchema)');
    console.log('  2. Books List (scrapeList)');

    // Execute the robot
    console.log('\nExecuting robot...');
    const result = await robot.run();

    console.log('✓ Execution completed!\n');
    console.log('Page Information:', result.data.textData);
    console.log(`\nBooks Found: ${result.data.listData?.length || 0} items`);

    if (result.data.listData && result.data.listData.length > 0) {
      console.log('\nFirst 3 books:');
      result.data.listData.slice(0, 3).forEach((book: any, i: number) => {
        console.log(`\n${i + 1}. ${book.title}`);
        console.log(`   Price: ${book.price}`);
        console.log(`   Availability: ${book.availability}`);
      });
    }

    // Clean up
    // await robot.delete();
    // console.log('\n✓ Robot deleted');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.details) {
      console.error('Details:', JSON.stringify(error.details, null, 2));
    }
  }
}

if (!process.env.MAXUN_API_KEY) {
  console.error('Please set MAXUN_API_KEY environment variable');
  process.exit(1);
}

chainedExtractExample();
