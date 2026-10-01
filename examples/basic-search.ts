/**
 * Search the web. 'discover' returns links only; 'scrape' also scrapes each result.
 */
import 'dotenv/config';
import { Maxun } from 'maxun-sdk';

const maxun = new Maxun();

async function main() {
  const robot = await maxun.search('AI News This Week', 'AI model releases', { timeRange: 'week', limit: 10 }); // discover is the default
  const result = await robot.run();
  console.log(JSON.stringify(result.searchData, null, 2).slice(0, 2000));

  // Scrape mode: also opens each result and scrapes it as markdown
  await maxun.search('Python Packaging News', 'python packaging news', { mode: 'scrape', limit: 5 });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
