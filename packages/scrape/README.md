# @maxun/scrape

Official Maxun SDK for automatic web scraping.

## Installation

```bash
npm install @maxun/scrape
```

## Quick Start

```typescript
import { MaxunScrape } from '@maxun/scrape';

const scraper = new MaxunScrape({
  apiKey: process.env.MAXUN_API_KEY
});

// Create a scraping robot with auto-detection
const robot = await scraper
  .create('Product Scraper')
  .navigate('https://example.com/products')
  .autoDetect()
  .asMarkdown()
  .build();

// Execute and get results
const result = await robot.run();
console.log(result.data.listData);
```

## Features

- Automatic list detection
- Auto-detect fields within items
- Multiple output formats (Markdown, HTML)
- Scheduling and webhooks
- Full TypeScript support

## Documentation

See the [main README](../../README.md) for complete documentation and examples.

## License

MIT
