/**
 * A realistic setup: a list robot that runs daily, watches for changes and
 * calls a webhook.
 */
import 'dotenv/config';
import { Maxun } from 'maxun-sdk';

const maxun = new Maxun();

async function main() {
  const robot = await maxun
    .extract('Trending Books Daily')
    .navigate('https://openlibrary.org/trending/daily')
    .captureList({ selector: 'li.searchResultItem', maxItems: 25 })
    .monitorChanges()
    .build();

  await robot.addWebhook('https://your-server.example/maxun-hook');
  const schedule = await robot.schedule({ runEvery: 1, runEveryUnit: 'DAYS', timezone: 'UTC', atTimeStart: '08:00' });

  const result = await robot.run(); // one run now, to check it works
  console.log(`${result.listData.length} books; next run ${schedule.nextRunAt}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
