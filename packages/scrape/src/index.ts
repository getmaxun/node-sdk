/**
 * @maxun/scrape - Maxun SDK for automatic web scraping
 *
 * @example
 * ```typescript
 * import { MaxunScrape } from '@maxun/scrape';
 *
 * const scraper = new MaxunScrape({ apiKey: 'your-api-key' });
 *
 * const robot = await scraper
 *   .create('Product Scraper')
 *   .navigate('https://example.com/products')
 *   .autoDetect()
 *   .asMarkdown()
 *   .build();
 *
 * const result = await robot.run();
 * console.log(result.data);
 * ```
 */

export { MaxunScrape } from './scraper';
export { ScrapeBuilder } from './scrape-builder';
export * from './types';

// Re-export common types from core
export type {
  MaxunConfig,
  Robot,
  Run,
  RunResult,
  ScheduleConfig,
  WebhookConfig,
  ExecutionOptions,
} from '@maxun/core';
