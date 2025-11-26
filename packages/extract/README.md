# @maxun/extract

Official Maxun SDK for structured data extraction.

## Installation

```bash
npm install @maxun/extract
```

## Quick Start

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

## Features

- Precise field extraction with CSS selectors
- Form filling with automatic input type detection (text, number, email, password, date, etc.)
- Secure value encryption for sensitive data
- Automatic `waitForLoadState` insertion for stability
- List extraction with pagination support
- Bulk extraction from multiple URLs
- Screenshots with customizable options
- Scheduling and webhooks
- Integration with Google Sheets, Airtable, N8N
- Full TypeScript support

## Documentation

See the [main README](../../README.md) for complete documentation and examples.

## License

MIT
