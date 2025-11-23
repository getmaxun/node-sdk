/**
 * Extract Workflow Builder
 * Fluent API for building extraction workflows
 */

import { WorkflowBuilder, Robot } from '@maxun/core';
import { ExtractFields, ExtractListConfig, BulkExtractConfig } from './types';

export class ExtractBuilder extends WorkflowBuilder {
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
   * Build and create the robot
   */
  async build(): Promise<Robot> {
    if (!this.extractor) {
      throw new Error('Builder not properly initialized. Use extractor.create() to create a builder.');
    }
    return await this.extractor.build(this);
  }

  /**
   * Extract specific fields from the page
   */
  extract(fields: ExtractFields, name?: string): this {
    // Pass fields directly as plain selectors
    this.addAction({
      action: 'scrapeSchema',
      args: [fields],
      name: name,
    });

    return this;
  }

  /**
   * Extract a list of items with pagination support
   */
  extractList(config: ExtractListConfig, name?: string): this {
    const { selector, fields, pagination } = config;

    // Build scrapeList configuration with plain field selectors
    const scrapeListConfig: any = {
      itemSelector: selector,
      fields: fields,
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
