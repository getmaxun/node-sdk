/**
 * Form Filling and Screenshots Example
 *
 * This example demonstrates:
 * - Filling form inputs with type() action
 * - Automatic input type detection
 * - Taking full-page and viewport screenshots
 */

import 'dotenv/config';
import { Extract } from 'maxun-sdk';

async function main() {
  const extractor = new Extract({
    apiKey: process.env.MAXUN_API_KEY!,
    baseUrl: process.env.MAXUN_BASE_URL
  });

  try {
    const robot = await extractor
      .create('Form Fill Demo')
      .navigate('https://practice.expandtesting.com/inputs')
      .type('#input-text', 'John Doe')
      .type('#input-number', '42')
      .type('#input-password', 'SecurePassword123')
      .type('#input-date', '15-08-2024')
      .captureScreenshot('Full Page', { fullPage: true })
      .captureScreenshot('Viewport', { fullPage: false });

    console.log(`Robot created: ${robot.id}`);

    const result = await robot.run();

    console.log('\nForm filling completed');
    console.log('Screenshots captured:', Object.keys(result.data.binaryOutput || {}).length);

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
