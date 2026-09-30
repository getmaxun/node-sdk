/**
 * Search the web. 'discover' returns links only; 'scrape' also scrapes each result.
 */
import 'dotenv/config';
import { Maxun } from 'maxun-sdk';

const maxun = new Maxun();

async function main() {
  const robot = await maxun.search('AI News This Week', {
    query: 'AI model releases',
    mode: 'discover',
    timeRange: 'week',
    limit: 10,
  });
  const result = await robot.run();
  console.log(JSON.stringify(result.searchData, null, 2).slice(0, 2000));

  // Shorthand: just a query string (scrape mode, markdown of each result)
  await maxun.search('Python packaging news', 'python packaging news');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
