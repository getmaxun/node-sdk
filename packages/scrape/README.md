# @maxun/scrape

[![npm version](https://img.shields.io/npm/v/@maxun/scrape.svg)](https://www.npmjs.com/package/@maxun/scrape)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

Official Maxun SDK for automatic web scraping.

## Installation

```bash
npm install @maxun/scrape
```

## Quick Start

```typescript
import { MaxunScrape } from '@maxun/scrape';

const scraper = new MaxunScrape({
  apiKey: process.env.MAXUN_API_KEY!
});

const robot = await scraper.create(
  'Wikipedia Scraper',
  'https://en.wikipedia.org/wiki/Web_scraping',
  { formats: ['markdown', 'html'] }
);

const result = await robot.run();
console.log(result.data.markdown);
```

## Features

- **Simplest possible API** - just URL and format
- **No workflow needed** - metadata-only robot creation
- **Multiple output formats** - Markdown and HTML
- **Request multiple formats simultaneously**
- **Scheduling and webhooks**
- **Full TypeScript support**

## Why Use Scrape SDK?

Use the Scrape SDK when you need:
- Quick, simple page scraping
- Entire page content in markdown or HTML format
- No interactions required - just URL and format
- Content for LLM processing or analysis

For structured data extraction with specific fields, use [@maxun/extract](../extract) instead.

## Examples

### Scrape as Markdown (Default)

```typescript
const robot = await scraper.create(
  'Article Scraper',
  'https://example.com/article'
);

const result = await robot.run();
console.log(result.data.markdown);
```

### Scrape as HTML

```typescript
const robot = await scraper.create(
  'HTML Scraper',
  'https://example.com/page',
  { formats: ['html'] }
);

const result = await robot.run();
console.log(result.data.html);
```

### Multiple Formats

Get both Markdown and HTML in a single run:

```typescript
const robot = await scraper.create(
  'Multi-Format Scraper',
  'https://example.com/page',
  { formats: ['markdown', 'html'] }
);

const result = await robot.run();
console.log('Markdown:', result.data.markdown);
console.log('HTML:', result.data.html);
```

### With Scheduling

Schedule regular scraping:

```typescript
const robot = await scraper.create(
  'News Scraper',
  'https://news.example.com',
  { formats: ['markdown'] }
);

await robot.schedule({
  runEvery: 1,
  runEveryUnit: 'HOURS',
  timezone: 'America/New_York'
});
```

### With Webhooks

Get notified when scraping completes:

```typescript
const robot = await scraper.create(
  'Content Monitor',
  'https://example.com/updates',
  { formats: ['markdown'] }
);

await robot.addWebhook({
  url: 'https://your-app.com/webhook',
  events: ['run.completed'],
  headers: {
    'Authorization': 'Bearer your-token'
  }
});
```

## API

### `scraper.create(name, url, options?)`

Creates a new scraping robot.

**Parameters:**
- `name` (string): Name of the robot
- `url` (string): URL to scrape
- `options` (object, optional):
  - `formats` (array): Output formats - `['markdown']`, `['html']`, or `['markdown', 'html']`
  - Default: `['markdown']`

**Returns:** `Promise<Robot>`

## Output Formats

### Markdown
- Clean, readable text format
- Preserves headings, lists, links, and formatting
- Perfect for LLM processing or analysis
- Removes clutter and navigation elements

### HTML
- Complete HTML structure
- Preserves all styling and layout information
- Useful when you need exact page structure
- Can be larger than markdown format

## Comparison with Extract SDK

| Feature | Scrape SDK | Extract SDK |
|---------|------------|-------------|
| **Use Case** | Full page content | Specific fields |
| **Setup Complexity** | Minimal (URL + format) | Requires selectors |
| **Output** | Markdown/HTML | Structured data |
| **Best For** | Content analysis, LLMs | Data extraction, automation |
| **Workflow** | Not needed | Multi-step workflows |
| **Pagination** | Not supported | Supported |

## API Reference

See the [main README](../../README.md) for complete API documentation including:
- Robot management
- Scheduling
- Webhooks
- Error handling

## Support

- **Documentation**: [https://docs.maxun.dev](https://docs.maxun.dev)
- **Examples**: [View examples](../../examples)
- **GitHub Issues**: [Report issues](https://github.com/maxun-dev/maxun-sdks/issues)

## License

MIT
