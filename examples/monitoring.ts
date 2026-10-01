/**
 * Detect changes between runs. Works for scrape, crawl and extract robots.
 */
import 'dotenv/config';
import { Maxun } from 'maxun-sdk';

const maxun = new Maxun();

async function main() {
  // A single page
  const page = await maxun.scrape('https://www.worldometers.info/world-population/', {
    formats: ['text'],
    monitor: true, // or later: await page.setMonitoring(true)
  });
  await page.run(); // the first run is the baseline
  let result = await page.run();
  console.log('Page changed:', result.hasChanges, result.changedFormats);

  const diff = await page.getRunDiff(result.runId);
  for (const formatDiff of diff.diffs) {
    console.log(`--- ${formatDiff.format}`);
    for (const change of formatDiff.changes.slice(0, 20)) {
      if (change.added || change.removed) console.log(change.added ? '+' : '-', change.value.slice(0, 200));
    }
  }

  // A whole section of a site: also reports which pages appeared, vanished or changed
  const site = await maxun.crawl('https://www.ycombinator.com/blog', { mode: 'path', limit: 10, monitor: true });
  await site.run();
  result = await site.run();
  console.log('Pages:', result.changedPages);

  // Captured data from selectors
  const listing = await maxun
    .extract('https://news.ycombinator.com', { monitor: true })
    .captureList({ selector: 'tr.athing', maxItems: 30 })
    .build();
  await listing.run();
  result = await listing.run();
  console.log('List changed:', result.hasChanges, result.changedFormats);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
