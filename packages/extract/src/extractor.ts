/**
 * MaxunExtract - Main class for the Extract SDK
 */

import { MaxunClient, MaxunConfig, Robot, WorkflowFile } from '@maxun/core';
import { ExtractBuilder } from './extract-builder';

export class MaxunExtract {
  private client: MaxunClient;

  constructor(config: MaxunConfig) {
    this.client = new MaxunClient(config);
  }

  /**
   * Create a new extraction workflow
   */
  create(name: string): ExtractBuilder {
    const builder = new ExtractBuilder(name);
    builder.setExtractor(this);
    return builder;
  }

  /**
   * Build and save the robot to Maxun
   */
  async build(builder: ExtractBuilder): Promise<Robot> {
    const workflow = builder.getWorkflowArray();
    const meta = builder.getMeta();
    const deepExtractionUrls = builder.getDeepExtractionUrls();

    // Generate a unique ID for the robot
    const robotId = `robot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    meta.id = robotId;

    const workflowFile: any = {
      meta: meta as any,
      workflow,
    };

    // Add deep extraction URLs if configured
    if (deepExtractionUrls.length > 0) {
      workflowFile.deepExtractionUrls = deepExtractionUrls;
    }

    // Create the robot
    const robot = await this.client.createRobot(workflowFile);

    return new Robot(this.client, robot);
  }

  /**
   * Get all extract robots
   */
  async getRobots(): Promise<Robot[]> {
    const robots = await this.client.getRobots();
    const extractRobots = robots.filter(
      (r) => r.recording_meta.robotType === 'extract'
    );
    return extractRobots.map((r) => new Robot(this.client, r));
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
