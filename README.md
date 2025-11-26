# Maxun SDKs

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
    fields: {
      name: '.product-name',
      price: '.product-price',
      rating: '.product-rating'
    },
    pagination: {
      next: '.pagination-next',
      maxPages: 5,
      waitAfterClick: 2000
    }
  });
```

#### Bulk Extraction from Multiple URLs

```typescript
const robot = await extractor
  .create('Bulk Product Extractor')
  .mode('bulk')
  .bulk({
    urls: [
      'https://example.com/product/1',
      'https://example.com/product/2',
      'https://example.com/product/3'
    ]
  })
  .navigate('https://example.com/product/1') // First URL
  .captureText({
    title: '.title',
    price: '.price'
  });
```

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
await robot.schedule({
  runEvery: 1,
  runEveryUnit: 'HOURS',
  timezone: 'America/New_York'
});

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

#### Integrations

```typescript
// Google Sheets
await robot.integrate('googleSheets', {
  email: 'sheet@example.com',
  sheetName: 'Extracted Data'
});

// Airtable
await robot.integrate('airtable', {
  baseId: 'appXXXXXXXXXXXXXX',
  tableName: 'Products'
});

// N8N
await robot.integrate('n8n', {
  webhookUrl: 'https://your-n8n.com/webhook/...'
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

## Support

- Documentation: https://docs.maxun.dev
- GitHub Issues: https://github.com/maxun-dev/maxun-sdks/issues
- Email: support@maxun.dev

## License

MIT
