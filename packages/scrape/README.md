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

// Create a scraping robot - just URL and format!
const robot = await scraper
  .create('Wikipedia Scraper')
  .url('https://en.wikipedia.org/wiki/Web_scraping')
  .asMarkdown()  // Can also use .asHTML() or both
  .build();

// Execute and get results
const result = await robot.run();
console.log(result.data);
```

## Features

- **Simplest possible API** - just URL and format
- No workflow needed - metadata-only robot creation
- Multiple output formats (Markdown, HTML)
- Can request multiple formats simultaneously
- Scheduling and webhooks
- Full TypeScript support

## Documentation

See the [main README](../../README.md) for complete documentation and examples.

## License

MIT
