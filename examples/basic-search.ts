/**
 * Search the web. 'discover' returns links only; 'scrape' also scrapes each result.
 */
import 'dotenv/config';
import { Maxun } from 'maxun-sdk';

const maxun = new Maxun();

async function main() {
  const robot = await maxun.search('AI model releases', { mode: 'discover', timeRange: 'week', limit: 10 });
  const result = await robot.run();
  console.log(JSON.stringify(result.searchData, null, 2).slice(0, 2000));

  // Scrape mode (the default): also scrapes each result as markdown
  await maxun.search('python packaging news', { limit: 5 });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
