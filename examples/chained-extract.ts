/**
 * Several steps on one robot: capture text and a list from the same page,
 * naming each capture.
 */
import 'dotenv/config';
import { Maxun } from 'maxun-sdk';

const maxun = new Maxun();

async function main() {
  const robot = await maxun
    .extract('https://www.bbc.com/sport/football/tables', { name: 'Premier League Table' })
    .captureText({ Title: 'h1' }, 'Heading')
    .captureList({ selector: 'table tbody tr', maxItems: 20 }, 'Standings')
    .build();

  const result = await robot.run();
  console.log(result.textData);
  console.log(JSON.stringify(result.listData.slice(0, 5), null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
