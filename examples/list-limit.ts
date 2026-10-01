/**
 * Change how many items a robot collects without rebuilding it.
 * Works for list (extract), crawl and search robots; only the limit is sent.
 */
import 'dotenv/config';
import { Maxun } from 'maxun-sdk';

const maxun = new Maxun();

async function main() {
  const books = await maxun
    .extract('Books List Limit Demo', 'https://books.toscrape.com/')
    .captureList({ selector: 'article.product_pod', maxItems: 10 })
    .build();
  await books.setListLimit(25);

  const crawler = await maxun.crawl('Books Crawl Limit Demo', 'https://books.toscrape.com/', { limit: 5 });
  await crawler.setListLimit(20);

  const search = await maxun.search('Search Limit Demo', 'web scraping', { mode: 'discover' });
  await search.setListLimit(30);

  console.log('Limits updated for', [books.name, crawler.name, search.name].join(', '));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
