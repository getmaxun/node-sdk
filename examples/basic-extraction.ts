/**
 * Pick specific values off a page with CSS selectors.
 */
import 'dotenv/config';
import { Maxun } from 'maxun-sdk';

const maxun = new Maxun();

async function main() {
  const robot = await maxun
    .extract('https://news.ycombinator.com', { name: 'Hacker News Top Story' })
    .captureText({
      Title: 'tr.athing:first-child .titleline > a',
      Points: 'tr.athing:first-child + tr .score',
      Author: 'tr.athing:first-child + tr .hnuser',
    })
    .build();

  const result = await robot.run();
  console.log(JSON.stringify(result.textData, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
