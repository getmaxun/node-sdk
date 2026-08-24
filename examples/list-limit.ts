/**
 * List Limit Example
 *
 * This example demonstrates:
 * - Changing a robot's limit without resending its workflow
 * - Doing so for extract, crawl, and search robots
 * - Targeting a specific list on a robot that has several
 *
 * Only the limit is sent to the backend. Selectors, pagination, crawl depth,
 * search filters, and everything else are left exactly as they were.
 */

import 'dotenv/config';
import { Extract, Crawl, Search, Client, Robot } from 'maxun-sdk';

const config = {
  apiKey: process.env.MAXUN_API_KEY!,
  baseUrl: process.env.MAXUN_BASE_URL,
};

/** The stored config object holding the limit, for a given action. */
function configOf(robot: Robot, action: string) {
  return (robot.getData().recording?.workflow || [])
    .flatMap((pair: any) => pair.what || [])
    .filter((a: any) => a.action === action)
    .flatMap((a: any) => a.args || [])
    .find((arg: any) => arg && typeof arg === 'object' && 'limit' in arg);
}

/** Prints the limit alongside the settings that sit next to it. */
function describe(label: string, robot: Robot, action: string, neighbours: string[]) {
  const cfg = configOf(robot, action) || {};
  const rest = neighbours.map((k) => `${k}=${JSON.stringify(cfg[k])}`).join(', ');
  console.log(`  ${label.padEnd(7)} limit=${String(cfg.limit).padEnd(4)} ${rest}`);
}

async function main() {
  const extractor = new Extract(config);

  try {
    // --- extract robot: how many items the list collects -----------------
    console.log('\nExtract robot (scrapeList)');

    const robot = await extractor
      .create(`Books Scraper ${Date.now()}`)
      .navigate('https://books.toscrape.com/')
      .captureList({ selector: 'article.product_pod', maxItems: 10 });

    describe('before', robot, 'scrapeList', ['listSelector']);
    await robot.setListLimit(25);
    describe('after', robot, 'scrapeList', ['listSelector']);

    // --- crawl robot: how many pages it visits ---------------------------
    console.log('\nCrawl robot (crawl)');

    const crawler = await new Crawl(config).create(
      `Site Crawler ${Date.now()}`,
      'https://books.toscrape.com/',
      { mode: 'domain', limit: 15, maxDepth: 2 }
    );

    describe('before', crawler, 'crawl', ['mode', 'maxDepth']);
    await crawler.setListLimit(50);
    describe('after', crawler, 'crawl', ['mode', 'maxDepth']);

    // --- search robot: how many results it returns -----------------------
    console.log('\nSearch robot (search)');

    const searcher = await new Search(config).create(`Web Search ${Date.now()}`, {
      query: 'web scraping',
      mode: 'discover',
      limit: 8,
    });

    describe('before', searcher, 'search', ['query', 'provider']);
    await searcher.setListLimit(20);
    describe('after', searcher, 'search', ['query', 'provider']);

    /**
     * setListLimit updates the first action it finds that carries a limit.
     * For a robot with more than one list, use the client directly and name
     * the position. Positions are assigned server-side, so read them from the
     * robot rather than assuming them.
     */
    console.log('\nUpdating by explicit position');

    const client = new Client(config);
    const workflow = robot.getData().recording?.workflow || [];

    workflow.forEach((pair: any, pairIndex: number) => {
      (pair.what || []).forEach((action: any, actionIndex: number) => {
        (action.args || []).forEach((arg: any, argIndex: number) => {
          if (arg && typeof arg === 'object' && 'limit' in arg) {
            console.log(
              `  found ${action.action} limit=${arg.limit} at pair ${pairIndex}, action ${actionIndex}, arg ${argIndex}`
            );
          }
        });
      });
    });

    await client.updateListLimits(robot.id, [
      { pairIndex: 0, actionIndex: 0, argIndex: 0, limit: 50 },
    ]);

    const updated = await extractor.getRobot(robot.id);
    describe('after', updated, 'scrapeList', ['listSelector']);
  } catch (error: any) {
    console.error('Failed:', error.message);
  }
}

main();
