/**
 * Extract - Main class for the Extract SDK
 */

import { Client } from './client/maxun-client';
import { Config, WorkflowFile, RobotData } from './types';
import { ExtractBuilder } from './builders/extract-builder';
import { Robot } from './robot/robot';

export class Extract {
  public client: Client;

  constructor(config: Config) {
    this.client = new Client(config);
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

    // Generate a unique ID for the robot
    const robotId = `robot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    meta.id = robotId;

    const workflowFile: any = {
      meta: meta as any,
      workflow,
    };

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

  /**
   * LLM-based extraction - create a robot using natural language prompt
   * The robot is saved and can be executed anytime by the user
   *
   * @param url - The URL to extract data from
   * @param options - Extraction options
   * @param options.prompt - Natural language prompt describing what to extract
   * @param options.llmProvider - LLM provider to use: 'anthropic', 'openai', or 'ollama' (default: 'ollama')
   * @param options.llmModel - Model name (default: 'llama3.2-vision' for ollama, 'claude-3-5-sonnet-20241022' for anthropic, 'gpt-4-vision-preview' for openai)
   * @param options.llmApiKey - API key for the LLM provider (not needed for ollama)
   * @param options.llmBaseUrl - Base URL for the LLM provider (default: 'http://localhost:11434' for ollama)
   * @param options.robotName - Optional custom name for the robot
   * @returns Robot instance that can be executed
   */
  async extract(url: string, options: {
    prompt: string;
    llmProvider?: 'anthropic' | 'openai' | 'ollama';
    llmModel?: string;
    llmApiKey?: string;
    llmBaseUrl?: string;
    robotName?: string;
  }): Promise<Robot> {
    const robotData = await this.client.extractWithLLM(url, options);
    const robot = await this.client.getRobot(robotData.robotId);
    return new Robot(this.client, robot);
  }
}
