/**
 * Scrape Builder
 * Simple fluent API for building scraping robots (no workflow needed)
 */

import { Robot, Format, RobotMeta } from '@maxun/core';

export class ScrapeBuilder {
  private scraper: any; // Will be set by MaxunScrape
  private name: string;
  private targetUrl?: string;
  private formats: Format[] = [];

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Set the parent scraper (called internally)
   */
  setScraper(scraper: any): this {
    this.scraper = scraper;
    return this;
  }

  /**
   * Set the URL to scrape
   */
  url(url: string): this {
    this.targetUrl = url;
    return this;
  }

  /**
   * Scrape content as markdown
   */
  asMarkdown(): this {
    if (!this.formats.includes('markdown')) {
      this.formats.push('markdown');
    }
    return this;
  }

  /**
   * Scrape content as HTML
   */
  asHTML(): this {
    if (!this.formats.includes('html')) {
      this.formats.push('html');
    }
    return this;
  }

  /**
   * Get metadata for the scrape robot
   */
  getMeta(): Partial<RobotMeta> {
    return {
      name: this.name,
      robotType: 'scrape',
      url: this.targetUrl,
      formats: this.formats.length > 0 ? this.formats : ['markdown'],
    };
  }

  /**
   * Build and create the robot
   */
  async build(): Promise<Robot> {
    if (!this.scraper) {
      throw new Error('Builder not properly initialized. Use scraper.create() to create a builder.');
    }

    if (!this.targetUrl) {
      throw new Error('URL is required. Call .url() before building.');
    }

    return await this.scraper.build(this);
  }
}
