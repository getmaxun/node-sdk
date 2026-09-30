# Maxun Node.js SDK

The official Node.js SDK for [Maxun](https://maxun.dev): turn websites and documents into structured data.

Works with Maxun Cloud and self-hosted Maxun.

```bash
npm install maxun-sdk
```

```ts
import { Maxun } from 'maxun-sdk';

const maxun = new Maxun({ apiKey: 'your-api-key' });

const robot = await maxun.scrape('Example', 'https://example.com');
const result = await robot.run();
console.log(result.markdown);
```

## Contents

- [Setup](#setup)
- [What you can build](#what-you-can-build): [Scrape](#scrape) · [Extract with selectors](#extract-with-selectors) · [Extract with a prompt](#extract-with-a-prompt) · [Crawl](#crawl) · [Search](#search) · [Documents](#documents)
- [Running robots and reading results](#running-robots-and-reading-results)
- [Managing robots](#managing-robots): [Schedules](#schedules) · [Webhooks](#webhooks) · [Change monitoring](#change-monitoring)
- [LLM settings: Cloud vs self-hosted](#llm-settings-cloud-vs-self-hosted)
- [Errors](#errors)
- [Upgrading from 0.0.x](#upgrading-from-00x)

## Setup

Get an API key from your Maxun account, then either pass it in or put it in the environment:

```bash
export MAXUN_API_KEY=your-api-key
export MAXUN_BASE_URL=http://localhost:8080/api/sdk     # the default (self-hosted)
# export MAXUN_BASE_URL=https://app.maxun.dev/api/sdk/  # Maxun Cloud
export MAXUN_TEAM_ID=your-team-uuid                    # optional; Maxun Cloud teams
```

```ts
const maxun = new Maxun();                                                        // everything from the environment
const maxun = new Maxun({ apiKey: '...', baseUrl: 'https://app.maxun.dev/api/sdk/' });   // Maxun Cloud
```

The SDK reads real environment variables. To use a `.env` file, load it first, e.g. with `import 'dotenv/config'`.

Everything hangs off `maxun`:

| Call | Creates | Result is in |
|---|---|---|
| `maxun.scrape(name, url)` | a robot that turns one page into markdown/html/text/links/summary/screenshots | `result.markdown`, `.html`, `.text`, `.links`, `.summary`, `.screenshots` |
| `maxun.extract(name)` or `maxun.extract(name, { prompt })` | a robot that captures specific data, by selectors or from a prompt | `result.textData`, `result.listData` |
| `maxun.crawl(name, url)` | a robot that visits many pages of a site | `result.crawlData` |
| `maxun.search(name, query)` | a robot that searches the web (DuckDuckGo) | `result.searchData` |
| `maxun.documents.extract(file, prompt)` / `.parse(file)` | a robot that reads a PDF, DOCX, XLSX, CSV, JPG or PNG | `result.documentData` / `result.markdown` etc. |
| `maxun.robots` | nothing; lists, finds and deletes robots of any type | |

Each call returns a `Robot`, saved on your account; run it as often as you like. `maxun.scrape.create(...)`, `maxun.crawl.create(...)` etc. still work and do the same thing.

**Reusing a robot name** behaves differently per robot type:

- Scrape, crawl and prompt-extract robots: the same name with the same settings returns the existing robot; different settings throw `ConflictError`.
- Selector-extract robots: the same name and URL returns the existing robot **unchanged, even if your steps differ**. The SDK warns when this happens. Use a new name or delete the old robot to save new steps.
- Document robots: an existing name always throws `ConflictError`.
- Search robots: names are not checked, so every call makes a new robot.

## What you can build

### Scrape

```ts
const robot = await maxun.scrape('Pricing page', 'https://example.com/pricing', {
  formats: ['markdown', 'links', 'screenshot-fullpage'],
});
const result = await robot.run();
result.markdown;     // string
result.links;        // list of URLs
result.screenshots;  // list
```

Formats: `markdown` (default), `html`, `text`, `links`, `summary`, `screenshot-visible`, `screenshot-fullpage`.

**Smart Queries** ask an LLM a question about the page on every run:

```ts
const robot = await maxun.scrape('HN', 'https://news.ycombinator.com', {
  smartQueries: 'Which story has the most points?',
});
const result = await robot.run();
result.smartQueryResult;

// or for a single run
await robot.run({ smartQueries: 'List the three newest stories' });
```

`summary` and Smart Queries use an LLM; see [LLM settings](#llm-settings-cloud-vs-self-hosted).

### Extract with selectors

Chain the steps and finish with `.build()`:

```ts
const robot = await maxun
  .extract('Products')
  .navigate('https://shop.example.com')
  .captureText({ 'Store name': 'h1', Tagline: '.hero p' })
  .captureList({ selector: 'article.product', maxItems: 50 })
  .build();

const result = await robot.run();
result.textData;   // { 'Store name': '...', Tagline: '...' }
result.listData;   // [{...}, {...}]
```

- `captureText({ field: selector })` captures single values. CSS and XPath selectors both work.
- `captureList({ selector })` captures every element matching `selector`; the fields inside each item are detected automatically. `maxItems` defaults to 100.
- Pagination is auto-detected. To set it yourself, add `pagination`:
  - `{ type: 'scrollDown' }` for infinite scroll
  - `{ type: 'clickNext', selector: 'a.next' }` for a Next button
  - `{ type: 'clickLoadMore', selector: 'button.more' }` for a Load more button
  - `{ type: 'none' }` to read only the first page
- Pass a name as the second argument to any `capture*` to label that capture.

Other steps, in the order you want them to happen:

```ts
.navigate(url)                          // go to a page (always first)
.click(selector)
.type(selector, text)                   // stored encrypted; the input type is auto-detected
.waitFor(selector, 30000)               // milliseconds
.wait(1000)                             // milliseconds
.scroll(2)                              // scroll down by screen heights
.captureScreenshot('name', { fullPage: false })
.monitorChanges()                       // see Change monitoring
```

### Extract with a prompt

Describe the data; Maxun builds the robot:

```ts
const robot = await maxun.extract('YC companies', {
  prompt: 'Company names, descriptions and batch for the first 15 companies',
  url: 'https://www.ycombinator.com/companies', // optional: without it Maxun searches for a page
});
const result = await robot.run();
result.listData;
```

### Crawl

```ts
const robot = await maxun.crawl(
  'Docs crawler',
  'https://docs.example.com',
  { mode: 'domain', limit: 100, maxDepth: 3, includePaths: ['/guides/*'] },
  { formats: ['markdown'] }
);
const result = await robot.run();
for (const page of result.crawlData) console.log(page.metadata.url);
```

The crawl config defaults to `mode: 'domain'` (or `'subdomain'`, `'path'`), `limit: 50` pages, `maxDepth: 3`, `useSitemap`, `followLinks` and `respectRobots` all `true`, and no include/exclude patterns. You can leave it out or pass only what you want to change.

### Search

```ts
const robot = await maxun.search('AI news', {
  query: 'AI model releases',
  mode: 'discover',
  timeRange: 'week',
  limit: 10,
});
const result = await robot.run();
result.searchData;
```

- `mode: 'discover'` returns titles, URLs and snippets.
- `mode: 'scrape'` (the default) also opens each result and scrapes it in `formats` (default `['markdown']`).
- `timeRange`: `'day'`, `'week'`, `'month'` or `'year'`. `limit` defaults to 10.
- Shorthand: `await maxun.search('AI news', 'AI model releases')`.

### Documents

PDF, DOCX, XLSX, CSV, JPG and PNG.

```ts
// Pull specific data out of a file
const extractor = await maxun.documents.extract('invoice.pdf', 'Invoice number, date and total');
(await extractor.run()).documentData;

// Convert a file to text formats
const parser = await maxun.documents.parse('report.docx', { formats: ['markdown', 'links'] });
(await parser.run()).markdown;
```

`parse` formats: `markdown`, `html`, `links`, `summary` (default: all four). You can pass a `Buffer` instead of a path; then give `fileName: 'report.docx'` so the type is known.

## Running robots and reading results

```ts
const result = await robot.run();
```

`run()` waits until the run finishes (long crawls can take a while) and returns a `RunResult`. Optional settings:

- `formats: [...]` changes the output formats for this run only.
- `smartQueries: '...'` asks a question for this run only.
- `timeout: 600000` stops waiting after that many milliseconds. The run may still finish on the server; check `await robot.getLatestRun()`.

If the run fails or is aborted, `run()` throws `RunFailedError`.

| Property | Filled by |
|---|---|
| `runId`, `status` | every run |
| `markdown`, `html`, `text`, `summary`, `links` | scrape and document-parse robots, in the formats you chose |
| `smartQueryResult` | scrape robots with Smart Queries |
| `textData` (object) | `captureText` |
| `listData` (array) | `captureList`, prompt extraction |
| `crawlData` (array, one item per page) | crawl robots |
| `searchData` (object) | search robots |
| `documentData` | document-extract robots |
| `screenshots` (array) | screenshot formats and `captureScreenshot` |
| `hasChanges`, `changedFormats` | robots with change monitoring |
| `changedPages` | crawl robots with change monitoring |

The raw fields are still there too, so `result.data.listData` works.

## Managing robots

```ts
await maxun.robots.list();                 // all robots
await maxun.robots.list('crawl');          // one type: extract, scrape, crawl, search, doc-extract, doc-parse
await maxun.scrape.list();                 // only scrape robots (every resource has list/get/delete)
const robot = await maxun.robots.get('robot-id');
const byName = await maxun.robots.find('Pricing page');   // by exact name
await maxun.robots.delete('robot-id');
```

A `Robot` has `id`, `name`, `type`, `url`, `formats` and `isMonitoring`, plus:

```ts
await robot.run();
await robot.getRuns();                 // newest first
await robot.getLatestRun();
await robot.getRun(runId);
await robot.abort(runId);              // a queued or running run

await robot.rename('New name');
await robot.setListLimit(25);          // item limit of the list/crawl/search step
const copy = await robot.duplicate('https://other-site.com/page');   // same robot, different URL
await robot.refresh();                 // reload from the server
await robot.delete();

robot.getData();                       // the raw robot record
```

### Schedules

```ts
await robot.schedule({ runEvery: 6, runEveryUnit: 'HOURS', timezone: 'Asia/Kolkata' });
await robot.schedule({ runEvery: 1, runEveryUnit: 'WEEKS', startFrom: 'MONDAY', atTimeStart: '09:00' });
await robot.schedule({ runEvery: 1, runEveryUnit: 'MONTHS', dayOfMonth: 1, atTimeStart: '06:30' });

robot.getSchedule();      // includes nextRunAt and the generated cronExpression
await robot.unschedule();
```

- `runEveryUnit` is `MINUTES`, `HOURS`, `DAYS`, `WEEKS` or `MONTHS`. `timezone` defaults to `'UTC'`.
- `atTimeStart` (`'HH:MM'`) is the time of day for DAYS/WEEKS/MONTHS. For HOURS, only its minutes are used.
- `startFrom` is the weekday for WEEKS. `dayOfMonth` is for MONTHS.

### Webhooks

```ts
const hook = await robot.addWebhook('https://your-server.com/maxun');   // both events
await robot.addWebhook({ url: 'https://alerts.example.com', events: ['run_failed'], retryAttempts: 5 });

robot.getWebhooks();
await robot.removeWebhook('https://alerts.example.com');   // by URL or id
await robot.removeWebhooks();                              // all
```

- Events are `run_completed` and `run_failed`.
- Maxun sends a POST with `event_type`, `timestamp`, `webhook_id` and `data`.
- Failed deliveries are retried (`retryAttempts`, default 3) with growing delays (`retryDelay` seconds, default 5).
- Adding a URL that is already registered updates it.

### Change monitoring

Scrape, crawl and extract robots can compare every run with the previous successful run. Turn it on with `monitor: true`:

```ts
await maxun.scrape('Prices', 'https://example.com/pricing', { formats: ['text'], monitor: true });
await maxun.crawl('Docs', 'https://docs.example.com', undefined, { monitor: true });
await maxun.extract('Products', { monitor: true }).navigate(url).captureList({ selector: 'li' }).build();
await maxun.extract('Products', { prompt: 'Product names and prices', url, monitor: true });

// or on an existing robot
await robot.setMonitoring(true);       // setMonitoring(false) turns it off
```

The first run is the baseline. After that, every run tells you what changed:

```ts
const result = await robot.run();
if (result.hasChanges) {
  console.log(result.changedFormats);   // e.g. ['markdown'], or ['captured-list'] for extract robots
  const diff = await robot.getRunDiff(result.runId);   // optionally robot.getRunDiff(id, 'markdown')
  for (const d of diff.diffs) {
    for (const change of d.changes) {
      if (change.added || change.removed) console.log(change.added ? '+' : '-', change.value);
    }
  }
}
```

What gets compared:

| Robot | Compared | Values for the `format` argument |
|---|---|---|
| Scrape | the page's `text`, `markdown` and `html` output | `text`, `markdown`, `html` |
| Crawl | every page's `text`, `markdown` and `html`, matched by URL | `text`, `markdown`, `html` |
| Extract | the captured text and lists | `captured-text`, `captured-list` |

For crawl robots, `result.changedPages` and `diff.pages` also list which page URLs were `added`, `removed` or `changed`.

Crawl comparison is done by the SDK, because the Maxun server only compares scrape and extract runs. The result has the same shape either way. For crawl robots:

- `robot.getRunDiff(runId)` works for any run, including scheduled ones.
- `hasChanges` is filled in only for runs started with `robot.run()`.
- Webhook payloads and the Maxun dashboard do not show crawl changes.

## LLM settings: Cloud vs self-hosted

These features use an LLM:
- prompt extraction, `maxun.extract(name, { prompt })`
- `documents.extract`
- the `summary` format
- Smart Queries

**Maxun Cloud** runs the LLM for you. Do not pass any `llm*` option; Cloud rejects them.

**Self-hosted Maxun** has no built-in model, so these features need an LLM configuration:

```ts
const robot = await maxun.extract('Products', {
  prompt: 'Product names and prices',
  url: 'https://shop.example.com',
  llmProvider: 'anthropic',       // 'anthropic', 'openai' or 'ollama'
  llmApiKey: 'sk-ant-...',        // required for anthropic and openai
  llmModel: '...',                // optional; the provider's default otherwise
  llmBaseUrl: '...',              // optional; e.g. your Ollama or OpenAI-compatible server
});
```

The same four options are accepted by:
- `maxun.scrape(...)`, `maxun.crawl(...)` and `maxun.search(...)` (used for `summary` and Smart Queries)
- `documents.extract` and `documents.parse`

## Errors

Every API error is a `MaxunError` with `.statusCode` and `.details`. More specific subclasses:

| Error | When |
|---|---|
| `AuthenticationError` | bad or missing API key (401/403) |
| `NotFoundError` | robot or run doesn't exist (404) |
| `ConflictError` | a robot with that name exists with different settings (409) |
| `ValidationError` | the server rejected the input (400) |
| `RunFailedError` | the run failed or was aborted |

Invalid arguments caught before any request (a bad format name, a missing URL) throw a plain `Error`.

The SDK also emits `MaxunWarning` process warnings when something will not behave as you might expect, for example an ignored option. Listen for them with `process.on('warning', ...)`.

```ts
import { MaxunError, ConflictError } from 'maxun-sdk';

let robot;
try {
  robot = await maxun.scrape('Pricing page', 'https://example.com/pricing');
} catch (error) {
  if (error instanceof ConflictError) robot = await maxun.robots.find('Pricing page');
  else if (error instanceof MaxunError) console.log(error.statusCode, error.message, error.details);
  else throw error;
}
```

## Upgrading from 0.0.x

Existing code keeps working. `new Extract(config)`, `new Scrape(config)`, `new Crawl(config)`, `new Search(config)`, awaiting a builder, and `result.data.*` are all still supported. Behaviour that changed:

- **Webhooks now fire.** The server's event names are `run_completed`/`run_failed`, but 0.0.x saved `run.completed`/`run.failed`, which never matched. Old names are translated with a warning. Webhooks you already saved with dotted names need to be added again.
- **Documents:**
  - DOCX, JPG and PNG files were uploaded as PDFs and failed; they now work.
  - `createDocumentParseRobot` formats are optional (all four by default), and unknown formats throw instead of being sent.
  - Documents are available as `maxun.documents`.
- **`robot.run()`:**
  - Waits for the run to finish instead of giving up after 5 minutes.
  - Accepts `formats` and `smartQueries`.
  - `params`/`webhook` were never used by the server; passing them now warns.
  - Returns a `RunResult` with shortcuts; the old fields are unchanged.
- **`Extract.getRobots()`** returned nothing, because it read a field the server doesn't set. It now works, and every resource has `list()`, `get()` and `delete()`.
- **Builder:**
  - `scroll()` now takes a number of pages; the old `scroll(direction, distance)` did nothing.
  - `setCookies()` and `mode()` were never supported by the server; they now warn and do nothing.
  - Steps added before `navigate()` throw an error.
- **Crawl config:** it now has working defaults. Before, leaving out `limit` or `maxDepth` crawled nothing.
- **Config:** `apiKey`, `baseUrl` and `teamId` fall back to `MAXUN_API_KEY`, `MAXUN_BASE_URL` and `MAXUN_TEAM_ID`.
- **Return values:**
  - `robot.getWebhooks()` returns `[]` instead of `null` when there are none.
  - `robot.schedule()` returns the saved schedule and `robot.addWebhook()` returns the saved webhook; both used to return nothing.
- **Dependencies:** `form-data` is now declared (it was used but not listed), and `diff` is added for crawl monitoring.

## Examples

See [examples/](./examples).

## Development

```bash
npm install
npm test          # runs the test suite against a local fake API
npm run build
```
