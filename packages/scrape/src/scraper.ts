/**
 * MaxunScrape - Main class for the Scrape SDK
 */

import { MaxunClient, MaxunConfig, Robot, WorkflowFile, Format } from '@maxun/core';

export interface ScrapeOptions {
  formats?: Format[];
}

export class MaxunScrape {
  private client: MaxunClient;

  constructor(config: MaxunConfig) {
    this.client = new MaxunClient(config);
  }

  /**
   * Create a new scraping robot
   * @param name - Name of the scraping robot
   * @param url - URL to scrape
   * @param options - Optional scraping options (formats)
   * @returns Promise<Robot>
   */
  async create(name: string, url: string, options?: ScrapeOptions): Promise<Robot> {
    if (!url) {
      throw new Error('URL is required');
    }

    const workflowFile: WorkflowFile = {
      meta: {
        name,
        id: `robot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        robotType: 'scrape',
        url,
        formats: options?.formats || ['markdown'],
      } as any,
      workflow: [],
    };

    const robot = await this.client.createRobot(workflowFile);
    return new Robot(this.client, robot);
  }
}
