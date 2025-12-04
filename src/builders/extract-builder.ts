/**
 * Extract-specific workflow builder
 */

import { WorkflowBuilder } from './workflow-builder';
import { ExtractListConfig, PaginationConfig, ExtractFields } from '../types';
import type { MaxunExtract } from '../extract';
import type { Robot } from '../robot/robot';

export class ExtractBuilder extends WorkflowBuilder implements PromiseLike<Robot> {
  private extractor!: MaxunExtract; // Will be set by MaxunExtract

  constructor(name: string) {
    super(name, 'extract');
  }

  /**
   * Set the parent extractor (called internally)
   */
  setExtractor(extractor: any): this {
    this.extractor = extractor;
    return this;
  }

  /**
   * Capture specific text fields from the page
   */
  captureText(fields: ExtractFields, name?: string): this {
    // Pass fields directly as plain selectors
    this.addAction({
      action: 'scrapeSchema',
      args: [fields],
      name: name,
    });

    return this;
  }

  /**
   * Capture a list of items with pagination support
   * All fields are automatically detected and extracted
   * 
   * @param config - List extraction configuration
   * @param config.selector - CSS selector for list items
   * @param config.pagination - Optional pagination configuration
   * @param config.maxItems - Maximum number of items to extract (default: 100)
   * @param name - Optional action name
   */
  captureList(config: ExtractListConfig, name?: string): this {
    const scrapeListConfig: any = {
      itemSelector: config.selector,
      maxItems: config.maxItems || 100
    };

    if (config.pagination) {
      scrapeListConfig.pagination = {
        type: config.pagination.type,
        selector: config.pagination.selector || null
      };
    }

    this.addAction({
      action: 'scrapeList',
      args: [scrapeListConfig],
      name: name,
    });

    return this;
  }

  /**
   * Make the builder awaitable - converts builder to Robot instance
   */
  then<TResult1 = Robot, TResult2 = never>(
    onfulfilled?: ((value: Robot) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    if (!this.extractor) {
      return Promise.reject(
        new Error('Builder not properly initialized. Use extractor.create() to create a builder.')
      ).then(onfulfilled, onrejected);
    }

    // Build and convert to Robot
    return this.extractor.build(this).then(onfulfilled, onrejected);
  }
}

