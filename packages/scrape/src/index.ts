/**
 * @maxun/scrape - Maxun SDK for automatic web scraping
 *
 * @example
 * ```typescript
 * import { MaxunScrape } from '@maxun/scrape';
 *
 * const scraper = new MaxunScrape({ apiKey: 'your-api-key' });
 *
 * const robot = await scraper.create('Product Scraper', 'https://example.com/products', {
 *   formats: ['markdown', 'html']
 * });
 *
 * const result = await robot.run();
 * console.log(result.data);
 * ```
 */

export { MaxunScrape, ScrapeOptions } from './scraper';

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
