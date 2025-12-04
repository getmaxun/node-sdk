/**
 * Extract Workflow Builder
 * Fluent API for building extraction workflows
 */

import { WorkflowBuilder, Robot } from '@maxun/core';
import { ExtractFields, ExtractListConfig } from './types';

export class ExtractBuilder extends WorkflowBuilder implements PromiseLike<Robot> {
  private extractor: any; // Will be set by MaxunExtract

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
   * 
   * @param config - List extraction configuration
   * @param config.selector - CSS selector for list items
   * @param config.fields - Optional index-based field mapping (1-based indexes)
   *                        Example: { 1: 'title', 2: 'price', 4: 'rating' }
   *                        If not provided, all fields will be extracted with auto-generated names
   * @param config.pagination - Optional pagination configuration
   * @param config.maxItems - Maximum number of items to extract (default: 100)
   * @param name - Optional action name
   */
  captureList(config: ExtractListConfig, name?: string): this {
    const scrapeListConfig: any = {
      itemSelector: config.selector,
      maxItems: config.maxItems || 100
    };

    if (config.fields && Object.keys(config.fields).length > 0) {
      const indexes = Object.keys(config.fields).map(k => parseInt(k, 10));
      const invalidIndexes = indexes.filter(idx => !Number.isInteger(idx) || idx < 1);
      
      if (invalidIndexes.length > 0) {
        throw new Error(
          `Invalid field indexes: ${invalidIndexes.join(', ')}. ` +
          `Field indexes must be positive integers (1-based).`
        );
      }

      scrapeListConfig.fieldIndexMapping = config.fields;
    }

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

