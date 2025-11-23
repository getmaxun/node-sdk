# Maxun SDKs

Official SDKs for programmatic web data extraction with Maxun.

## Packages

- **[@maxun/extract](#maxunextract)** - Structured data extraction with precise field selection
- **[@maxun/scrape](#maxunscrape)** - Automatic web scraping with intelligent detection
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
  .extract({
    title: '.product-title',
    price: '.price',
    description: '.description'
  })
  .build();

// Execute and get results
const result = await robot.run();
console.log(result.data.textData);
```

### Scrape SDK

Automatically detect and scrape data:

```typescript
import { MaxunScrape } from '@maxun/scrape';

const scraper = new MaxunScrape({
  apiKey: process.env.MAXUN_API_KEY
});

// Create a scraping robot
const robot = await scraper
  .create('Product List Scraper')
  .navigate('https://example.com/products')
  .autoDetect()
  .asMarkdown()
  .build();

// Execute and get results
const result = await robot.run();
console.log(result.data.listData);
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
  .extract({
    title: 'h1.post-title',
    author: '.author-name',
    publishDate: 'time.publish-date',
    content: '.post-content'
  })
  .build();
```

#### List Extraction with Pagination

```typescript
const robot = await extractor
  .create('Product List Extractor')
  .navigate('https://example.com/products')
  .extractList({
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
  })
  .build();
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
  .extract({
    title: '.title',
    price: '.price'
  })
  .build();
```

#### Advanced Workflow

```typescript
const robot = await extractor
  .create('Advanced Extractor')
  .navigate('https://example.com/login')
  .type('#email', 'user@example.com')
  .type('#password', 'password')
  .click('button[type="submit"]')
  .waitFor('.dashboard', 5000)
  .navigate('https://example.com/data')
  .extract({
    userName: '.user-name',
    balance: '.account-balance'
  })
  .screenshot('dashboard')
  .build();
```

### @maxun/scrape

#### Auto-Detection

```typescript
const robot = await scraper
  .create('Auto Scraper')
  .navigate('https://example.com/products')
  .autoDetect()
  .build();
```

#### Manual List Scraping with Auto-Detect Fields

```typescript
const robot = await scraper
  .create('Product Scraper')
  .navigate('https://example.com/products')
  .scrapeList({
    selector: '.product-card',
    autoDetectFields: true
  })
  .build();
```

#### Manual List Scraping with Defined Fields

```typescript
const robot = await scraper
  .create('Custom Scraper')
  .navigate('https://example.com/items')
  .scrapeList({
    selector: '.item',
    fields: {
      title: '.item-title',
      description: '.item-desc'
    },
    pagination: {
      next: '.next-page',
      maxPages: 3
    }
  })
  .asMarkdown()
  .asHTML()
  .build();
```

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

- [Basic Extraction](./examples/extract-basic.ts)
- [List Extraction](./examples/extract-list.ts)
- [Bulk Extraction](./examples/extract-bulk.ts)
- [Auto Scraping](./examples/scrape-auto.ts)
- [Scheduled Extraction](./examples/scheduled.ts)
- [With Integrations](./examples/integrations.ts)

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
