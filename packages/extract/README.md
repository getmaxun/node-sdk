# @maxun/extract

[![npm version](https://img.shields.io/npm/v/@maxun/extract.svg)](https://www.npmjs.com/package/@maxun/extract)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

Official Maxun SDK for structured data extraction.

## Installation

```bash
npm install @maxun/extract
```

## Quick Start

```typescript
import { MaxunExtract } from '@maxun/extract';

const extractor = new MaxunExtract({
  apiKey: process.env.MAXUN_API_KEY!
});

const robot = await extractor
  .create('Product Extractor')
  .navigate('https://example.com/product')
  .captureText({
    title: '.product-title',
    price: '.price',
    description: '.description'
  });

const result = await robot.run();
console.log(result.data.textData);
```

## Features

- **Precise field extraction** with CSS selectors
- **Form filling** with automatic input type detection (text, number, email, password, date, etc.)
- **Secure value encryption** for sensitive data
- **Automatic stability** with `waitForLoadState` insertion
- **List extraction** with pagination support
- **Bulk extraction** from multiple URLs
- **Screenshots** with customizable options
- **Scheduling** and webhooks
- **Full TypeScript support**

## Examples

### Basic Field Extraction

Extract specific fields from a web page:

```typescript
const robot = await extractor
  .create('Product Details')
  .navigate('https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html')
  .captureText({
    title: 'h1',
    price: '.price_color',
    availability: '.availability'
  });

const result = await robot.run();
```

### List Extraction with Pagination

Extract lists of items across multiple pages:

```typescript
const robot = await extractor
  .create('Product List')
  .navigate('https://books.toscrape.com/')
  .captureList({
    selector: 'article.product_pod',
    pagination: {
      type: 'clickNext',
      selector: '.next a'
    },
    maxItems: 50
  });

const result = await robot.run();
console.log(`Extracted ${result.data.listData?.length} items`);
```

### Form Filling

Fill forms with automatic type detection:

```typescript
const robot = await extractor
  .create('Login Form')
  .navigate('https://example.com/login')
  .type('#email', 'user@example.com')
  .type('#password', 'SecurePassword123')
  .click('button[type="submit"]')
  .waitFor('.dashboard', 5000)
  .captureText({
    userName: '.user-name',
    balance: '.balance'
  });
```

### Screenshots

Capture screenshots at any point in your workflow:

```typescript
const robot = await extractor
  .create('Page Capture')
  .navigate('https://example.com')
  .captureScreenshot('Homepage', { fullPage: true })
  .click('.product')
  .captureScreenshot('Product Page', { fullPage: false });
```

### Chaining Actions

Combine multiple actions in a single workflow:

```typescript
const robot = await extractor
  .create('Multi-Step Workflow')
  .navigate('https://example.com')
  .captureText({ pageTitle: 'h1' }, 'Page Info')
  .click('.category-filter')
  .waitFor('.products-loaded', 3000)
  .captureList({
    selector: '.product',
    maxItems: 20
  }, 'Filtered Products');
```

## Scheduling

Schedule robots to run periodically:

```typescript
await robot.schedule({
  runEvery: 6,
  runEveryUnit: 'HOURS',
  timezone: 'America/New_York'
});
```

## Webhooks

Get notified when robots complete:

```typescript
await robot.addWebhook({
  url: 'https://your-app.com/webhook',
  events: ['run.completed', 'run.failed'],
  headers: {
    'Authorization': 'Bearer your-token'
  }
});
```

## API Reference

See the [main README](../../README.md) for complete API documentation.

## Support

- **Documentation**: [https://docs.maxun.dev](https://docs.maxun.dev)
- **Examples**: [View examples](../../examples)
- **GitHub Issues**: [Report issues](https://github.com/maxun-dev/maxun-sdks/issues)

## License

MIT
