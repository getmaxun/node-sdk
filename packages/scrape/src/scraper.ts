/**
 * MaxunScrape - Main class for the Scrape SDK
 */

import { MaxunClient, MaxunConfig, Robot, WorkflowFile } from '@maxun/core';
import { ScrapeBuilder } from './scrape-builder';

export class MaxunScrape {
  private client: MaxunClient;

  constructor(config: MaxunConfig) {
    this.client = new MaxunClient(config);
  }

  /**
   * Create a new scraping workflow
   */
  create(name: string): ScrapeBuilder {
    const builder = new ScrapeBuilder(name);
    builder.setScraper(this);
    return builder;
  }

  /**
   * Build and save the robot to Maxun
   */
  async build(builder: ScrapeBuilder): Promise<Robot> {
    const workflow = builder.getWorkflowArray();
    const meta = builder.getMeta();

    // Generate a unique ID for the robot
    const robotId = `robot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    meta.id = robotId;

    const workflowFile: WorkflowFile = {
      meta: meta as any,
      workflow,
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
