/**
 * Run a robot automatically on a schedule.
 *
 * runEveryUnit is MINUTES, HOURS, DAYS, WEEKS or MONTHS. atTimeStart ("HH:MM")
 * sets the time of day for DAYS/WEEKS/MONTHS; startFrom sets the weekday for
 * WEEKS; dayOfMonth sets the day for MONTHS. timezone defaults to UTC.
 */
import 'dotenv/config';
import { Maxun } from 'maxun-sdk';

const maxun = new Maxun();

async function main() {
  const robot = await maxun.scrape('Example Daily', 'https://example.com');

  // Every 6 hours
  const schedule = await robot.schedule({ runEvery: 6, runEveryUnit: 'HOURS', timezone: 'Asia/Kolkata' });
  console.log('Next run:', schedule.nextRunAt);

  // Every Monday at 09:00
  await robot.schedule({ runEvery: 1, runEveryUnit: 'WEEKS', timezone: 'Asia/Kolkata', startFrom: 'MONDAY', atTimeStart: '09:00' });
  console.log(robot.getSchedule());

  // On the 1st of every month at 06:30
  await robot.schedule({ runEvery: 1, runEveryUnit: 'MONTHS', dayOfMonth: 1, atTimeStart: '06:30' });

  await robot.unschedule();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
