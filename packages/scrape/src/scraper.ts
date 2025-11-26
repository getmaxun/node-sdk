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

    // Generate a unique ID for the robot
    const robotId = `robot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const workflowFile: WorkflowFile = {
      meta: {
        name,
        id: robotId,
        robotType: 'scrape',
        url,
        formats: options?.formats || ['markdown'],
      } as any,
      workflow: [],
    };

    // Create the robot
    const robot = await this.client.createRobot(workflowFile);

    return new Robot(this.client, robot);
  }

  /**
   * Get all scrape robots
   */
  async getRobots(): Promise<Robot[]> {
    const robots = await this.client.getRobots();
    const scrapeRobots = robots.filter(
      (r) => r.recording_meta.robotType === 'scrape'
    );
    return scrapeRobots.map((r) => new Robot(this.client, r));
  }

  /**
   * Get a specific robot by ID
   */
  async getRobot(robotId: string): Promise<Robot> {
    const robot = await this.client.getRobot(robotId);
    return new Robot(this.client, robot);
  }

  /**
   * Delete a robot
   */
  async deleteRobot(robotId: string): Promise<void> {
    await this.client.deleteRobot(robotId);
  }
}
