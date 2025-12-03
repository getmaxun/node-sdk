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
   * Make the builder awaitable - implements PromiseLike<Robot>
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
    return this.extractor.build(this).then(onfulfilled, onrejected);
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
   * Fields are automatically detected from the list selector
   */
  captureList(config: ExtractListConfig, name?: string): this {
    const { selector, pagination } = config;

    const scrapeListConfig: any = {
      itemSelector: selector,
      maxItems: config.maxItems || 100
    };

    if (pagination) {
      scrapeListConfig.pagination = {
        type: pagination.type,
        selector: pagination.selector || null
      };
    }

    this.addAction({
      action: 'scrapeList',
      args: [scrapeListConfig],
      name: name,
    });

    return this;
  }

}
