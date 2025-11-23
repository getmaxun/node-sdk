/**
 * Scrape Workflow Builder
 * Fluent API for building scraping workflows
 */

import { WorkflowBuilder, Robot } from '@maxun/core';
import { ScrapeListConfig } from './types';

export class ScrapeBuilder extends WorkflowBuilder {
  private scraper: any; // Will be set by MaxunScrape

  constructor(name: string) {
    super(name, 'scrape');
  }

  /**
   * Set the parent scraper (called internally)
   */
  setScraper(scraper: any): this {
    this.scraper = scraper;
    return this;
  }

  /**
   * Build and create the robot
   */
  async build(): Promise<Robot> {
    if (!this.scraper) {
      throw new Error('Builder not properly initialized. Use scraper.create() to create a builder.');
    }
    return await this.scraper.build(this);
  }

  /**
   * Automatically detect and scrape lists on the page
   */
  autoDetect(): this {
    this.addAction({
      action: 'scrapeListAuto',
      args: [],
      name: 'auto_detect_scrape',
    });

    return this;
  }

  /**
   * Scrape a list with optional auto-detection of fields
   */
  scrapeList(config: ScrapeListConfig): this {
    const { selector, autoDetectFields, fields, pagination } = config;

    if (autoDetectFields) {
      // Use scrapeListAuto with a specific container selector
      this.addAction({
        action: 'scrapeListAuto',
        args: [{ containerSelector: selector }],
        name: 'auto_detect_list',
      });
    } else if (fields) {
      // Manual field configuration
      const fieldSelectors: Record<string, any> = {};
      for (const [fieldName, fieldSelector] of Object.entries(fields)) {
        fieldSelectors[fieldName] = {
          _$: fieldSelector,
        };
      }

      const scrapeListConfig: any = {
        listSelector: selector,
        fields: fieldSelectors,
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
        name: 'scrape_list',
      });
    } else {
      throw new Error(
        'Either autoDetectFields must be true or fields must be provided'
      );
    }

    return this;
  }

  /**
   * Scrape content as markdown
   */
  asMarkdown(): this {
    const currentFormats = this.meta.formats || [];
    if (!currentFormats.includes('markdown')) {
      this.meta.formats = [...currentFormats, 'markdown'];
    }
    return this;
  }

  /**
   * Scrape content as HTML
   */
  asHTML(): this {
    const currentFormats = this.meta.formats || [];
    if (!currentFormats.includes('html')) {
      this.meta.formats = [...currentFormats, 'html'];
    }
    return this;
  }
}
