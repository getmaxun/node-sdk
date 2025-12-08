# Maxun SDK

[![npm version](https://img.shields.io/npm/v/maxun-sdk.svg)](https://www.npmjs.com/package/maxun-sdk)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

The official Node.js SDK for [Maxun](https://maxun.dev) - turn any website into an API with just a few lines of code.

**Works with both Maxun Cloud and Maxun Open Source** - automatically handles the differences for you.

## What can you do with Maxun SDK?

- 🎯 **Extract structured data** from any website using CSS selectors
- 📝 **Scrape entire pages** as Markdown or HTML
- 🤖 **Use AI to extract data** with natural language prompts
- 📸 **Capture screenshots** (visible area or full page)
- 🔄 **Automate workflows** with clicks, form fills, and navigation
- ⏰ **Schedule recurring jobs** to keep your data fresh
- 🔔 **Get webhooks** when extractions complete
- 📊 **Handle pagination** automatically (scroll, click, load more)

## Installation

```bash
npm install maxun-sdk
```

## Quick Start

### Get Your API Key

**For Maxun Cloud:**
1. Sign up at [maxun.dev](https://maxun.dev)
2. Click on API Key → Generate API Key

**For Maxun Open Source:**
1. Run Maxun locally following the [setup guide](https://github.com/getmaxun/maxun)
2. Click on API Key → Generate API Key

### Your First Extraction

```typescript
import { MaxunExtract } from 'maxun-sdk';

const extractor = new MaxunExtract({
  apiKey: process.env.MAXUN_API_KEY,
  baseUrl: 'https://app.maxun.dev/api/sdk' // or your self-hosted URL
});

// Extract data from a product page
const robot = await extractor
  .create('Product Scraper')
  .navigate('https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html')
  .captureText({
    title: 'h1',
    price: '.price_color',
    availability: '.availability'
  });

const result = await robot.run();
console.log(result.data.textData);
```

### Your First Page Scrape

```typescript
import { MaxunScrape } from 'maxun-sdk';

const scraper = new MaxunScrape({
  apiKey: process.env.MAXUN_API_KEY,
  baseUrl: 'https://app.maxun.dev/api/sdk' // or your self-hosted URL
});

// Scrape a Wikipedia article as Markdown
const robot = await scraper.create(
  'Wikipedia Scraper',
  'https://en.wikipedia.org/wiki/Web_scraping',
  { formats: ['markdown'] }
);

const result = await robot.run();
console.log(result.data.markdown);
```

## Two Simple APIs for Different Use Cases

### MaxunExtract - When You Need Specific Data

Use this when you want to extract **specific fields** from websites, interact with forms, or build multi-step workflows.

```typescript
import { MaxunExtract } from 'maxun-sdk';

const extractor = new MaxunExtract({
  apiKey: process.env.MAXUN_API_KEY,
  baseUrl: 'https://app.maxun.dev/api/sdk' // or your self-hosted URL
});
```

**Perfect for:**
- Extracting specific fields (prices, titles, descriptions)
- Scraping lists with pagination
- Filling forms and clicking buttons
- Multi-step workflows (login → navigate → extract)
- Taking screenshots at specific points

### MaxunScrape - When You Want Everything

Use this when you want to **capture entire pages** as Markdown, HTML, or screenshots. No CSS selectors needed!

```typescript
import { MaxunScrape } from 'maxun-sdk';

const scraper = new MaxunScrape({
  apiKey: process.env.MAXUN_API_KEY,
  baseUrl: 'https://app.maxun.dev/api/sdk' // or your self-hosted URL
});
```

**Perfect for:**
- Converting web pages to Markdown
- Archiving pages as HTML
- Taking page screenshots
- Simple one-step scraping

## Common Use Cases

### Extract Specific Fields

```typescript
const robot = await extractor
  .create('GitHub Repo Stats')
  .navigate('https://github.com/microsoft/typescript')
  .captureText({
    stars: 'span#repo-stars-counter-star',
    forks: 'span#repo-network-counter',
    description: 'p.f4'
  });

const result = await robot.run();
```

### Scrape a List with Pagination

```typescript
const robot = await extractor
  .create('Product List')
  .navigate('https://books.toscrape.com/')
  .captureList({
    selector: 'article.product_pod',
    maxItems: 20,
    pagination: {
      type: 'clickNext',
      selector: 'li.next a'
    }
  });

const result = await robot.run();
console.log(result.data.listData); // Array of products
```

### Fill Forms and Click Buttons

```typescript
const robot = await extractor
  .create('Search and Extract')
  .navigate('https://example.com/search')
  .type('#search-input', 'web scraping')
  .click('button[type="submit"]')
  .waitFor('.results', 5000)
  .captureText({
    title: 'h1.result-title',
    description: 'p.result-desc'
  });
```

### Convert Page to Markdown

```typescript
const robot = await scraper.create(
  'Article Scraper',
  'https://news.ycombinator.com',
  { formats: ['markdown'] }
);

const result = await robot.run();
console.log(result.data.markdown);
```

### Capture Screenshots

```typescript
// Visible viewport only
const robot = await scraper.create(
  'Screenshot',
  'https://example.com',
  { formats: ['screenshot-visible'] }
);

// Full page screenshot
const robot = await scraper.create(
  'Full Page Screenshot',
  'https://example.com',
  { formats: ['screenshot-fullpage'] }
);
```

### Use AI to Extract Data

No CSS selectors needed - just describe what you want in plain English!

```typescript
const robot = await extractor.extract(
  'https://news.ycombinator.com',
  {
    prompt: 'Extract the top 5 story titles and their scores',
    llmProvider: 'anthropic', // or 'openai', 'ollama'
    llmApiKey: process.env.ANTHROPIC_API_KEY,
    llmModel: 'claude-3-5-sonnet-20241022'
  }
);

const result = await robot.run();
```

## Scheduling & Automation

### Schedule Recurring Runs

```typescript
// Run every hour
await robot.schedule({
  runEvery: 1,
  runEveryUnit: 'HOURS',
  timezone: 'America/New_York'
});

// Run every Monday at 9 AM
await robot.schedule({
  runEvery: 1,
  runEveryUnit: 'WEEKS',
  timezone: 'America/New_York',
  startFrom: 'MONDAY',
  atTimeStart: '09:00'
});

// Check when it runs next
const schedule = robot.getSchedule();
console.log(schedule?.nextRunAt);

// Stop the schedule
await robot.unschedule();
```

### Get Webhooks When Jobs Complete

```typescript
await robot.addWebhook({
  url: 'https://your-app.com/webhook',
  events: ['run.completed', 'run.failed'],
  headers: {
    'Authorization': 'Bearer your-secret-token'
  }
});
```

## Working with Robots

### List All Your Robots

```typescript
const robots = await extractor.getRobots();
robots.forEach(robot => {
  console.log(robot.id, robot.recording_meta.name);
});
```

### Get a Specific Robot

```typescript
const robot = await extractor.getRobot('robot_123');
console.log(robot.recording_meta.name);
```

### View Run History

```typescript
// Get all runs
const runs = await robot.getRuns();

// Get the latest run
const latestRun = await robot.getLatestRun();
console.log(latestRun.status, latestRun.data);

// Get a specific run
const run = await robot.getRun('run_123');
```

### Delete a Robot

```typescript
await extractor.deleteRobot('robot_123');
// or
await robot.delete();
```

## Advanced Features

### Pagination Strategies

```typescript
// Click "Next" button
captureList({
  selector: '.item',
  pagination: { type: 'clickNext', selector: '.next-btn' }
})

// Infinite scroll
captureList({
  selector: '.item',
  pagination: { type: 'scrollDown' }
})

// Click "Load More" button
captureList({
  selector: '.item',
  pagination: { type: 'clickLoadMore', selector: '.load-more' }
})
```

### Select Specific Fields from Lists

By default, all fields are extracted. You can select only the ones you need:

```typescript
const robot = await extractor
  .create('Product List')
  .navigate('https://example.com/products')
  .captureList({
    selector: '.product',
    fields: {
      1: 'productName',  // First field → productName
      2: 'price',        // Second field → price
      4: 'rating'        // Fourth field → rating
    },
    maxItems: 50
  });
```

### Take Screenshots During Workflows

```typescript
const robot = await extractor
  .create('Screenshot Workflow')
  .navigate('https://example.com')
  .captureScreenshot('homepage', { fullPage: true })
  .click('.menu-item')
  .captureScreenshot('menu-opened', { fullPage: false });

const result = await robot.run();
console.log(result.screenshots); // Array of screenshot URLs
```

### Custom Execution Options

```typescript
const result = await robot.run({
  timeout: 120000,           // 2 minutes
  params: { customField: 'value' },
  webhook: {                 // One-time webhook for this run
    url: 'https://example.com/webhook'
  }
});
```

## Error Handling

```typescript
import { MaxunError } from 'maxun-sdk';

try {
  const result = await robot.run();
  console.log(result.data);
} catch (error) {
  if (error instanceof MaxunError) {
    console.error('Maxun Error:', error.message);
    console.error('Status Code:', error.statusCode);
    console.error('Details:', error.details);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## TypeScript Support

The SDK is written in TypeScript and includes complete type definitions:

```typescript
import {
  MaxunExtract,
  MaxunScrape,
  Robot,
  RunResult,
  MaxunError,
  ScheduleConfig,
  WebhookConfig
} from 'maxun-sdk';
```

## API Reference

### MaxunExtract Methods

| Method | Description |
|--------|-------------|
| `create(name)` | Start building a new extraction robot |
| `navigate(url)` | Navigate to a URL |
| `captureText(fields)` | Extract specific text fields using CSS selectors |
| `captureList(config)` | Extract lists with optional pagination |
| `click(selector)` | Click an element |
| `type(selector, text)` | Type into an input field (auto-detects input type) |
| `waitFor(selector, timeout?)` | Wait for element to appear |
| `wait(milliseconds)` | Wait for a specific duration |
| `captureScreenshot(name?, options?)` | Take a screenshot |
| `extract(url, options)` | AI-powered extraction using natural language |
| `getRobots()` | List all robots |
| `getRobot(id)` | Get a specific robot |
| `deleteRobot(id)` | Delete a robot |

### MaxunScrape Methods

| Method | Description |
|--------|-------------|
| `create(name, url, options?)` | Create a scraping robot |

### Robot Methods

| Method | Description |
|--------|-------------|
| `run(options?)` | Execute the robot and get results |
| `schedule(config)` | Schedule periodic execution |
| `unschedule()` | Remove schedule |
| `getSchedule()` | Get current schedule info |
| `addWebhook(config)` | Add a webhook |
| `getRuns()` | Get all runs |
| `getLatestRun()` | Get the most recent run |
| `getRun(runId)` | Get a specific run |
| `abort(runId)` | Stop a running execution |
| `delete()` | Delete this robot |
| `refresh()` | Reload robot data from server |

### Configuration Types

```typescript
interface MaxunConfig {
  apiKey: string;
  baseUrl: string; // Required - e.g., 'https://app.maxun.dev/api/sdk' or 'http://localhost:8080/api/sdk'
}

interface ScheduleConfig {
  runEvery: number;
  runEveryUnit: 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS';
  timezone: string; // e.g., 'America/New_York'
  startFrom?: 'MONDAY' | 'TUESDAY' | ... | 'SUNDAY';
  dayOfMonth?: number; // 1-31
  atTimeStart?: string; // HH:MM format
  atTimeEnd?: string;   // HH:MM format
}

interface WebhookConfig {
  url: string;
  events?: string[]; // Default: ['run.completed', 'run.failed']
  headers?: Record<string, string>;
}

interface RunResult {
  data: {
    textData?: Record<string, any>;
    listData?: Array<Record<string, any>>;
    markdown?: string;
    html?: string;
  };
  screenshots?: string[];
  status: 'success' | 'failed' | 'running' | 'queued';
  runId: string;
}
```

## Examples

Check out the [examples](./examples) directory for complete working examples:

| Example | What it does |
|---------|-------------|
| [basic-extraction.ts](./examples/basic-extraction.ts) | Extract fields from a single page |
| [list-pagination.ts](./examples/list-pagination.ts) | Scrape lists with different pagination strategies |
| [form-fill-screenshot.ts](./examples/form-fill-screenshot.ts) | Fill forms and capture screenshots |
| [chained-extract.ts](./examples/chained-extract.ts) | Execute multiple capture actions with one robot |
| [simple-scrape.ts](./examples/simple-scrape.ts) | Convert pages to Markdown/HTML/Screenshots |
| [llm-extraction.ts](./examples/llm-extraction.ts) | AI-powered extraction with natural language |
| [scheduling.ts](./examples/scheduling.ts) | Set up robot schedules to execute runs |
| [webhooks.ts](./examples/webhooks.ts) | Configure webhook notifications |
| [robot-management.ts](./examples/robot-management.ts) | CRUD operations for robots |
| [complete-workflow.ts](./examples/complete-workflow.ts) | Create a robot combining multiple features |

## Troubleshooting

### "Invalid API key" or "API key is missing"

Make sure your API key is set:
```bash
export MAXUN_API_KEY="your-api-key-here"
```

Or use a `.env` file:
```
MAXUN_API_KEY=your-api-key-here
MAXUN_BASE_URL=https://app.maxun.dev/api/sdk
```

### "Connection refused" or network errors

- For **Maxun Cloud**: Set `baseUrl: 'https://app.maxun.dev/api/sdk'`
- For **Maxun Open Source**: Make sure your server is running and set `baseUrl: 'http://localhost:8080/api/sdk'` (or your custom port)

### Robot execution fails

- **Check the URL** - Make sure it's accessible
- **Verify selectors** - Use browser DevTools to test your CSS selectors
- **Check the logs** - Look at backend logs for detailed error messages
- **Try waitFor()** - Some elements need time to load

### TypeScript errors

```bash
# Rebuild the SDK if you installed from source
npm run build

# Make sure types are installed
npm install --save-dev @types/node
```

### Need more help?

- 📖 **Documentation**: [docs.maxun.dev](https://docs.maxun.dev)
- 💬 **Discord Community**: [Join our Discord](https://discord.gg/maxun)
- 🐛 **GitHub Issues**: [Report a bug](https://github.com/getmaxun/node-sdk/issues)
- 📧 **Email**: support@maxun.dev

## Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (when available)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is licensed under [AGPLv3](./LICENSE).

## Support Us

Star the repository, contribute if you love what we're building, or [sponsor us](https://github.com/sponsors/amhsirak).

## Contributors

Thank you to the combined efforts of everyone who contributes!

<a href="https://github.com/getmaxun/maxun-sdks/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=getmaxun/maxun-sdks" />
</a>

---

**Built with ❤️ by the Maxun team**
