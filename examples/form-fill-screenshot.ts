/**
 * Example demonstrating form filling and screenshots
 * Shows how to navigate, type into fields, and capture screenshots
 */

import { MaxunExtract } from '@maxun/extract';

async function formFillAndScreenshot() {
  console.log('=== Form Fill and Screenshot Example ===\n');

  const extractor = new MaxunExtract({
    apiKey: process.env.MAXUN_API_KEY!,
    baseUrl: process.env.MAXUN_BASE_URL || 'http://localhost:5001/api/sdk'
  });

  try {
    const robot = await extractor
      .create('Input Testing')

      // Navigate to a form page
      .navigate('https://practice.expandtesting.com/inputs')

      // Fill in different input field types
      // Input types are automatically detected!
      .type('#input-text', 'Some Name')
      .type('#input-number', '1456')
      .type('#input-password', 'This is a password')
      .type('#input-date', '20-05-1990')

      .screenshot('Full Page Screenshot', {
        fullPage: true,
        type: 'png',
        caret: 'hide',
        scale: 'device',
        timeout: 30000,
        animations: 'allow'
      })

      // Scroll to see more content (if needed)
      .scroll('down', 500)

      // Take a visible viewport screenshot
      .screenshot('Viewport Screenshot', {
        fullPage: false,
        type: 'png',
        caret: 'hide',
        scale: 'device'
      })

      .build();

    console.log('✓ Robot created:', robot.id);
    console.log('\nRobot workflow:');
    console.log('  1. Navigate to contact form');
    console.log('  2-7. Type into various input fields (types auto-detected)');
    console.log('  8. Take full-page screenshot');
    console.log('  9. Scroll down');
    console.log('  10. Take viewport screenshot');
    console.log('  11. Extract form values');

    console.log('\n✓ Robot created successfully');
    console.log('\nNote: Input types (text, number, date, etc.) are automatically');
    console.log('detected during robot creation - no need to specify them!');

    // Execute the robot to verify inputs are filled
    console.log('\n\nExecuting robot to verify inputs...');
    const result = await robot.run();
    console.log('✓ Robot execution completed!');
    console.log('\nResults:');
    console.log(JSON.stringify(result.data, null, 2));

    // Clean up
    // await robot.delete();
    // console.log('✓ Robot deleted');

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

formFillAndScreenshot();
