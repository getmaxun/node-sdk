/**
 * List, find, rename, run, inspect, copy and delete robots.
 */
import 'dotenv/config';
import { Maxun, NotFoundError } from 'maxun-sdk';

const maxun = new Maxun();

async function main() {
  const robot = await maxun.scrape('Books Scraper', 'https://books.toscrape.com');

  console.log((await maxun.robots.list()).map((r) => r.name)); // every robot
  console.log((await maxun.scrape.list()).map((r) => r.name)); // only scrape robots
  let same = await maxun.robots.find('Books Scraper'); // by name
  same = await maxun.robots.get(robot.id); // by id
  console.log(String(same), same.url, same.formats);

  await robot.rename('Books Scraper (renamed)');

  const result = await robot.run();
  const runs = await robot.getRuns(); // newest first
  const latest = await robot.getLatestRun();
  const run = await robot.getRun(result.runId);
  console.log(runs.length, latest?.runId, run.status);

  const copy = await robot.duplicate('https://books.toscrape.com/catalogue/page-2.html');
  await copy.delete();
  await robot.delete();

  try {
    await maxun.robots.get(robot.id);
  } catch (error) {
    if (error instanceof NotFoundError) console.log('Deleted');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
