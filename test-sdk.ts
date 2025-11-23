/**
 * Simple SDK Test Script
 * Tests basic robot creation and execution
 */

import { MaxunExtract } from '@maxun/extract';

async function testSDK() {
  console.log('=== Maxun SDK Test ===\n');

  // Check for API key
  if (!process.env.MAXUN_API_KEY) {
    console.error('❌ MAXUN_API_KEY environment variable not set');
    console.log('   Set it with: export MAXUN_API_KEY=your_api_key');
    process.exit(1);
  }

  try {
    // Initialize extractor
    console.log('1. Initializing MaxunExtract...');
    const extractor = new MaxunExtract({
      apiKey: process.env.MAXUN_API_KEY,
      baseUrl: process.env.MAXUN_BASE_URL || 'http://localhost:8080/api/sdk'
    });
    console.log('   ✓ Extractor initialized\n');

    // Create a simple robot
    console.log('2. Creating extraction robot...');
    const robot = await extractor
      .create('SDK Test Robot')
      .navigate('https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html')
      .extract({
        title: 'h1',
        price: '.price_color',
        availability: '.availability'
      })
      .build();

    console.log(`   ✓ Robot created with ID: ${robot.id}\n`);

    // Execute the robot
    console.log('3. Executing robot...');
    const result = await robot.run();

    console.log('   ✓ Execution completed!\n');

    // Display results
    console.log('4. Results:');
    console.log('   Status:', result.status);
    console.log('   Run ID:', result.runId);
    console.log('\n   Extracted Data:');
    console.log(JSON.stringify(result.data.textData, null, 4));

    if (result.screenshots && result.screenshots.length > 0) {
      console.log('\n   Screenshots:', result.screenshots.length);
    }

    // Get all runs
    console.log('\n5. Fetching run history...');
    const runs = await robot.getRuns();
    console.log(`   ✓ Found ${runs.length} run(s)\n`);

    // Cleanup - delete the test robot
    console.log('6. Cleaning up (deleting test robot)...');
    await robot.delete();
    console.log('   ✓ Robot deleted\n');

    console.log('=== ✅ All Tests Passed! ===\n');

  } catch (error: any) {
    console.error('\n❌ Test Failed:');
    console.error('   Error:', error.message);

    if (error.statusCode) {
      console.error('   Status Code:', error.statusCode);
    }

    if (error.details) {
      console.error('   Details:', JSON.stringify(error.details, null, 2));
    }

    console.error('\n   Stack:', error.stack);
    process.exit(1);
  }
}

testSDK();
