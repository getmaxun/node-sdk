/**
 * Scrape one page as Markdown, plain text and a screenshot.
 */
import 'dotenv/config';
import { Maxun } from 'maxun-sdk';

const maxun = new Maxun(); // reads MAXUN_API_KEY / MAXUN_BASE_URL

async function main() {
  const robot = await maxun.scrape('Example Domain Scraper', 'https://example.com', {
    formats: ['markdown', 'text', 'screenshot-visible'],
  });
  const result = await robot.run();

  console.log(result.markdown);
  console.log(`${(result.text || '').length} characters of text, ${result.screenshots?.length ?? 0} screenshot(s)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
