/**
 * @maxun/extract - Maxun SDK for structured data extraction
 *
 * @example
 * ```typescript
 * import { MaxunExtract } from '@maxun/extract';
 *
 * const extractor = new MaxunExtract({ apiKey: 'your-api-key' });
 *
 * const robot = await extractor
 *   .create('Product Extractor')
 *   .navigate('https://example.com/product')
 *   .extract({
 *     title: '.product-title',
 *     price: '.price',
 *     description: '.description'
 *   })
 *   .build();
 *
 * const result = await robot.run();
 * console.log(result.data);
 * ```
 */

export { MaxunExtract } from './extractor';
export { ExtractBuilder } from './extract-builder';
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
