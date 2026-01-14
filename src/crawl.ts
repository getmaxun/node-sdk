/**
 * Crawl - Main class for the Crawl SDK
 */

import { Client } from './client/maxun-client';
import { Config, CrawlConfig } from './types';
import { Robot } from './robot/robot';

export class Crawl {
  private client: Client;

  constructor(config: Config) {
    this.client = new Client(config);
  }

  /**
   * Create a new crawling robot
   * @param name - Name of the crawling robot
   * @param url - Starting URL to crawl
   * @param crawlConfig - Crawl configuration
   * @returns Promise<Robot>
   */
  async create(name: string, url: string, crawlConfig: CrawlConfig): Promise<Robot> {
    if (!url) {
      throw new Error('URL is required');
    }

    if (!crawlConfig) {
      throw new Error('Crawl configuration is required');
    }

    const robot = await this.client.createCrawlRobot(url, {
      name,
      crawlConfig,
    });

    return new Robot(this.client, robot);
  }
}
