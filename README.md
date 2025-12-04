# Maxun SDKs

[![npm version](https://img.shields.io/npm/v/@maxun/extract.svg)](https://www.npmjs.com/package/@maxun/extract)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Official SDKs for programmatic web data extraction with Maxun.

## Packages

- **[@maxun/extract](#maxunextract)** - Structured data extraction with workflows, form filling, and precise field selection
- **[@maxun/scrape](#maxunscrape)** - Simple page scraping - just URL and format (markdown/HTML)
- **[@maxun/core](#maxuncore)** - Core utilities (internal use)

## Installation

```bash
# For structured data extraction
npm install @maxun/extract

# For automatic web scraping
npm install @maxun/scrape

# Or install both
npm install @maxun/extract @maxun/scrape
```

## Quick Start

### When to use which SDK?

- **Use Extract SDK** when you need:
  - Structured data extraction with specific fields
  - Form filling and interactions (clicks, typing, navigation)
  - Multi-step workflows with conditional logic
  - Screenshots at specific points

- **Use Scrape SDK** when you need:
  - Quick, simple page scraping
  - Entire page content in markdown or HTML format
  - No interactions required - just URL and format

### Extract SDK

Extract specific fields from web pages with precision:

```typescript
import { MaxunExtract } from '@maxun/extract';

const extractor = new MaxunExtract({
  apiKey: process.env.MAXUN_API_KEY
});

// Create an extraction robot
const robot = await extractor
  .create('Product Extractor')
  .navigate('https://example.com/product')
  .captureText({
    title: '.product-title',
    price: '.price',
    description: '.description'
  });

// Execute and get results
const result = await robot.run();
console.log(result.data.textData);
```

### Scrape SDK

Automatically scrape entire pages in markdown or HTML format:

```typescript
import { MaxunScrape } from '@maxun/scrape';

const scraper = new MaxunScrape({
  apiKey: process.env.MAXUN_API_KEY
});

// Create a scraping robot - just URL and formats!
const robot = await scraper.create(
  'Wikipedia Scraper',
  'https://en.wikipedia.org/wiki/Web_scraping',
  {
    formats: ['markdown', 'html']
  }
);

// Execute and get results
const result = await robot.run();
console.log(result.data);
```

## Getting Your API Key

1. Log in to your Maxun dashboard
2. Navigate to Settings → API Keys
3. Generate a new API key
4. Store it securely in your environment variables

## Documentation

### @maxun/extract

#### Basic Field Extraction

```typescript
const robot = await extractor
  .create('Blog Post Extractor')
  .navigate('https://blog.example.com/post/123')
  .captureText({
    title: 'h1.post-title',
    author: '.author-name',
    publishDate: 'time.publish-date',
    content: '.post-content'
  });
```

#### List Extraction with Pagination

```typescript
const robot = await extractor
  .create('Product List Extractor')
  .navigate('https://example.com/products')
  .captureList({
    selector: '.product-item',
    pagination: {
      type: 'clickNext',
      selector: '.pagination-next'
    },
    maxItems: 50
  });
```

**Key features:** 
- Fields are automatically detected from the list selector - no need to manually specify field selectors!
- By default, **all fields** are extracted with auto-generated names (Label 1, Label 2, etc.)
- You can select **specific fields by index** using the `fields` parameter

#### Selecting Specific Fields by Index

To extract only certain fields and give them custom names:

```typescript
const robot = await extractor
  .create('Product List Extractor')
  .navigate('https://example.com/products')
  .captureList({
    selector: '.product-item',
    // Extract only fields at positions 1, 2, and 4 with custom names
    fields: {
      1: 'Product Name',
      2: 'Price',
      4: 'Rating'
    },
    maxItems: 50
  });

// Result data will use your custom field names:
// [
//   { productName: 'Product A', price: '$29.99', rating: '4.5' },
//   { productName: 'Product B', price: '$39.99', rating: '4.8' },
//   ...
// ]
```

**Field indexing:**
- Indexes are 1-based (1 = first field, 2 = second field, etc.)
- Only specified fields are extracted
- Each field gets the custom name you assign
- Invalid indexes are skipped with a warning

#### Advanced Workflow with Form Filling

```typescript
const robot = await extractor
  .create('Advanced Extractor')
  .navigate('https://example.com/login')
  // Input types are automatically detected!
  .type('#email', 'user@example.com')
  .type('#password', 'password')
  .click('button[type="submit"]')
  .waitFor('.dashboard', 5000)
  .navigate('https://example.com/data')
  .captureText({
    userName: '.user-name',
    balance: '.account-balance'
  })
  .captureScreenshot('dashboard');
```

**Key features:**
- Input types (text, number, email, password, date, etc.) are automatically detected
- Values are securely encrypted during storage
- `waitForLoadState` is automatically added after type actions for stability

### @maxun/scrape

The Scrape SDK provides the simplest possible API for page scraping - just specify a URL and output format.

#### Basic Page Scraping

```typescript
// Scrape as Markdown (default)
const robot = await scraper.create(
  'Article Scraper',
  'https://example.com/article'
);
// Formats defaults to ['markdown'] if not specified
```

#### Multiple Output Formats

```typescript
// Get both Markdown and HTML
const robot = await scraper.create(
  'Multi-Format Scraper',
  'https://example.com/page',
  {
    formats: ['markdown', 'html']
  }
);
```

#### HTML Only

```typescript
// Scrape as HTML only
const robot = await scraper.create(
  'HTML Scraper',
  'https://example.com/page',
  {
    formats: ['html']
  }
);
```

**Key features:**
- No workflow needed - just URL and format
- Automatically scrapes entire page content
- Supports markdown and HTML output formats
- Can request multiple formats simultaneously

### Common Operations

#### Scheduling

```typescript
// Schedule robot to run every hour
// Simple schedule (with defaults)
await robot.schedule({
  runEvery: 1,
  runEveryUnit: 'HOURS',
  timezone: 'America/New_York'
});

// Detailed schedule (business hours only)
await robot.schedule({
  runEvery: 2,
  runEveryUnit: 'HOURS',
  timezone: 'America/New_York',
  startFrom: 'MONDAY',        // Optional: day of week
  atTimeStart: '09:00',       // Optional: start time (HH:MM)
  atTimeEnd: '17:00'          // Optional: end time (HH:MM)
});

// Weekly schedule
await robot.schedule({
  runEvery: 1,
  runEveryUnit: 'WEEKS',
  timezone: 'America/New_York',
  startFrom: 'FRIDAY',
  atTimeStart: '10:00',
  atTimeEnd: '23:59'
});

// Monthly schedule
await robot.schedule({
  runEvery: 1,
  runEveryUnit: 'MONTHS',
  timezone: 'America/New_York',
  startFrom: 'SUNDAY',
  dayOfMonth: 1,              // Optional: day of month (1-31)
  atTimeStart: '00:00',
  atTimeEnd: '23:59'
});

// Get schedule info
const schedule = robot.getSchedule();
console.log(schedule?.nextRunAt);

// Remove schedule
await robot.unschedule();
```

#### Webhooks

```typescript
// Add webhook for notifications
await robot.addWebhook({
  url: 'https://your-app.com/webhook',
  events: ['run.completed', 'run.failed'],
  headers: {
    'Authorization': 'Bearer your-token'
  }
});
```

#### Managing Runs

```typescript
// Get all runs
const runs = await robot.getRuns();

// Get latest run
const latestRun = await robot.getLatestRun();

// Get specific run
const run = await robot.getRun('run_123');

// Abort a running task
await robot.abort('run_123');
```

#### Managing Robots

```typescript
// List all robots
const robots = await extractor.getRobots();

// Get specific robot
const robot = await extractor.getRobot('robot_123');

// Delete robot
await extractor.deleteRobot('robot_123');
// or
await robot.delete();

// Refresh robot data
await robot.refresh();
```

## Examples

See the [examples](./examples) directory for complete working examples:

- [Basic Extraction](./examples/basic-extraction.ts) - Simple field extraction
- [Form Fill & Screenshot](./examples/form-fill-screenshot.ts) - Form filling with automatic input type detection
- [Chained Extraction](./examples/chained-extract.ts) - Multi-page workflows
- [Simple Scraping](./examples/simple-scrape.ts) - Basic page scraping with format selection

## API Reference

### Configuration

```typescript
interface MaxunConfig {
  apiKey: string;
  baseUrl?: string; // Optional, defaults to production API
}
```

### Execution Options

```typescript
interface ExecutionOptions {
  params?: Record<string, any>;    // Custom parameters
  webhook?: WebhookConfig;         // One-time webhook
  timeout?: number;                // Execution timeout (ms)
  waitForCompletion?: boolean;     // Wait for results (default: true)
}
```

### Results

```typescript
interface RunResult {
  data: {
    textData?: Record<string, any>;      // Extracted fields
    listData?: Record<string, any>[];    // Extracted lists
  };
  screenshots?: string[];                 // Screenshot URLs
  status: RunStatus;
  runId: string;
}
```

## Error Handling

```typescript
import { MaxunError } from '@maxun/extract';

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

Both SDKs are written in TypeScript and provide full type definitions out of the box.

## Troubleshooting

### Common Issues

**"API key is missing" or "Invalid API key"**
- Ensure `MAXUN_API_KEY` environment variable is set
- Verify the API key is correct in your Maxun dashboard

**"Connection refused" or network errors**
- Check that your backend server is running
- Verify the `baseUrl` points to the correct endpoint
- Default: `http://localhost:5001/api/sdk` for local development

**Robot execution fails**
- Verify the target URL is accessible
- Check CSS selectors are valid
- Review backend logs for detailed error messages

**TypeScript import errors**
- Run `npm run build` in the SDK directory
- Ensure packages are properly installed
- Check `tsconfig.json` settings

**Scheduling not working**
- Verify backend pgBoss is configured
- Check timezone is valid (e.g., 'America/New_York')
- Ensure schedule parameters are correct

### Getting Help

If you encounter issues not covered here:

1. Check the [examples](./examples) directory for working code
2. Review error messages and backend logs
3. Search [GitHub Issues](https://github.com/maxun-dev/maxun-sdks/issues)
4. Contact support (details below)

## Support

- **Documentation**: [https://docs.maxun.dev](https://docs.maxun.dev)
- **GitHub Issues**: [https://github.com/maxun-dev/maxun-sdks/issues](https://github.com/maxun-dev/maxun-sdks/issues)
- **Email**: support@maxun.dev
- **Community**: Join our Discord for discussions and help

## Contributing

We welcome contributions! Please see our contributing guidelines and submit pull requests to our GitHub repository.

## License

MIT
