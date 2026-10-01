/**
 * Crawl a site and scrape every page found.
 */
import 'dotenv/config';
import { Maxun } from 'maxun-sdk';

const maxun = new Maxun();

async function main() {
  const robot = await maxun.crawl('https://www.ycombinator.com/blog', {
    mode: 'path', // stay under /blog ('domain' | 'subdomain' | 'path')
    limit: 10, // at most 10 pages
    maxDepth: 2,
    excludePaths: ['/tag/*'],
    formats: ['markdown'],
  });

  const result = await robot.run();
  for (const page of result.crawlData) {
    console.log(page.metadata?.url || page.url, '-', page.metadata?.title);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
