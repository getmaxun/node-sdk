/**
 * List, find, rename, run, inspect, copy and delete robots.
 */
import 'dotenv/config';
import { Maxun, NotFoundError } from 'maxun-sdk';

const maxun = new Maxun();

async function main() {
  const robot = await maxun.scrape('https://books.toscrape.com', { name: 'Books Scraper' });

  console.log(await maxun.robots.list()); // every robot: { id, name, type }
  console.log(await maxun.scrape.list()); // only scrape robots
  let same = await maxun.robots.find('Books Scraper'); // by name
  same = await maxun.robots.get(robot.id); // by id
  console.log(same, same.url, same.formats);

  await robot.rename('Books Scraper (renamed)');

  const result = await robot.run();
  console.log(await robot.getRuns()); // newest first, summaries only
  const run = await robot.getRun(result.runId);
  console.log(run.status, run.startedAt, run.finishedAt);
  console.log(run.result.listData.length); // the run's output

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
