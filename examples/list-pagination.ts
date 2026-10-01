/**
 * Capture a repeated element as a list, across pages.
 *
 * Fields inside each item are detected automatically. Leave out `pagination`
 * to let Maxun detect it, or set it yourself:
 *   { type: 'scrollDown' }                                  infinite scroll
 *   { type: 'clickNext', selector: 'a.next' }               "Next" button
 *   { type: 'clickLoadMore', selector: 'button.more' }      "Load more" button
 *   { type: 'none' }                                        first page only
 */
import 'dotenv/config';
import { Maxun } from 'maxun-sdk';

const maxun = new Maxun();

async function main() {
  const robot = await maxun
    .extract('https://openlibrary.org/trending/daily', { name: 'Open Library Trending' })
    .captureList({
      selector: 'li.searchResultItem',
      pagination: { type: 'clickNext', selector: 'a[data-ol-link-track="Pager|Next"]' },
      maxItems: 40,
    })
    .build();

  const result = await robot.run();
  console.log(`${result.listData.length} books`);
  console.log(JSON.stringify(result.listData.slice(0, 3), null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
