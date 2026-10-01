/**
 * Type into a form, wait and take screenshots.
 */
import 'dotenv/config';
import { Maxun } from 'maxun-sdk';

const maxun = new Maxun();

async function main() {
  const robot = await maxun
    .extract('https://practice.expandtesting.com/inputs', { name: 'Form Fill Demo' })
    .type('#input-text', 'John Doe')
    .type('#input-number', '42')
    .type('#input-password', 'SecurePassword123', 'password')
    .wait(500)
    .captureScreenshot('Full page')
    .captureScreenshot('Viewport', { fullPage: false })
    .build();

  const result = await robot.run();
  for (const shot of result.screenshots || []) {
    console.log(typeof shot === 'string' ? shot : shot.mimeType);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
