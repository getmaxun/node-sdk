/**
 * Create robots in a team workspace (Maxun Cloud).
 * Set MAXUN_TEAM_ID in .env, or pass { teamId } to new Maxun().
 */
import 'dotenv/config';
import { Maxun } from 'maxun-sdk';

const maxun = new Maxun({ teamId: process.env.MAXUN_TEAM_ID });

async function main() {
  const robot = await maxun.scrape('https://example.com', { name: 'Team Scraper' });
  console.log(await maxun.robots.list());
  console.log((await robot.run()).status);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
