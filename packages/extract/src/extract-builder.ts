/**
 * Extract Workflow Builder
 * Fluent API for building extraction workflows
 */

import { WorkflowBuilder, Robot } from '@maxun/core';
import { ExtractFields, ExtractListConfig, BulkExtractConfig } from './types';

export class ExtractBuilder extends WorkflowBuilder implements PromiseLike<Robot> {
  private deepExtractionUrls: string[] = [];
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

    // Add pagination if configured
    if (pagination) {
      scrapeListConfig.pagination = {
        nextButtonSelector: pagination.next,
        maxPages: pagination.maxPages || 10,
        waitAfterClick: pagination.waitAfterClick || 2000,
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
   * Configure bulk extraction from multiple URLs
   */
  bulk(config: BulkExtractConfig): this {
    this.meta.mode = 'bulk';
    this.meta.deepExtraction = true;
    this.deepExtractionUrls = config.urls;

    if (config.extractUrlsFromPreviousRun) {
      this.meta.extractUrlsFromRuns = true;
    }

    return this;
  }

  /**
   * Get deep extraction URLs
   */
  getDeepExtractionUrls(): string[] {
    return this.deepExtractionUrls;
  }
}
