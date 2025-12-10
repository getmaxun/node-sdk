/**
 * MaxunScrape - Main class for the Scrape SDK
 */

import { Client } from './client/maxun-client';
import { MaxunConfig, WorkflowFile, RobotData, Format } from './types';
import { WorkflowBuilder } from './builders/workflow-builder';
import { Robot } from './robot/robot';

export interface ScrapeOptions {
  /**
   * Output formats for scraping
   * - 'markdown': Page content in markdown format
   * - 'html': Page content in HTML format
   * - 'screenshot-visible': Screenshot of visible viewport
   * - 'screenshot-fullpage': Full page screenshot
   *
   * Default: ['markdown']
   */
  formats?: Format[];
}

export class MaxunScrape {
  private client: Client;

  constructor(config: MaxunConfig) {
    this.client = new Client(config);
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
