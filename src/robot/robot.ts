/**
 * Robot class - represents a saved workflow that can be executed
 */

import { RunResult, RobotData, ScheduleConfig, WebhookConfig, ExecutionOptions, Run } from '../types';
import { MaxunClient } from '../client/maxun-client';

export class Robot {
  protected client: MaxunClient;
  protected robotData: RobotData;

  constructor(client: MaxunClient, robotData: RobotData) {
    this.client = client;
    this.robotData = robotData;
  }

  /**
   * Get the robot ID
   */
  get id(): string {
    return this.robotData.recording_meta.id;
  }

  /**
   * Get the robot name
   */
  get name(): string {
    return this.robotData.recording_meta.name;
  }

  /**
   * Get the full robot data
   */
  getData(): RobotData {
    return this.robotData;
  }

  /**
   * Execute the robot
   */
  async run(options?: ExecutionOptions): Promise<RunResult> {
    return await this.client.executeRobot(this.id, options);
  }

  /**
   * Get all runs for this robot
   */
  async getRuns(): Promise<Run[]> {
    return await this.client.getRuns(this.id);
  }

  /**
   * Get a specific run
   */
  async getRun(runId: string): Promise<Run> {
    return await this.client.getRun(this.id, runId);
  }

  /**
   * Get the latest run
   */
  async getLatestRun(): Promise<Run | null> {
    const runs = await this.getRuns();
    if (runs.length === 0) return null;

    // Sort by startedAt descending
    runs.sort((a, b) =>
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );

    return runs[0];
  }

  /**
   * Abort a running or queued run
   */
  async abort(runId: string): Promise<void> {
    await this.client.abortRun(this.id, runId);
  }

  /**
   * Schedule the robot for periodic execution
   */
  async schedule(config: ScheduleConfig): Promise<void> {
    const updated = await this.client.scheduleRobot(this.id, config);
    this.robotData = updated;
  }

  /**
   * Remove the schedule
   */
  async unschedule(): Promise<void> {
    const updated = await this.client.unscheduleRobot(this.id);
    this.robotData = updated;
  }

  /**
   * Add a webhook
   */
  async addWebhook(webhook: WebhookConfig): Promise<void> {
    const updated = await this.client.addWebhook(this.id, webhook);
    this.robotData = updated;
  }

  /**
   * Update the robot's workflow or metadata
   */
  async update(updates: { meta?: Partial<RobotData['recording_meta']>; workflow?: any[] }): Promise<void> {
    const updated = await this.client.updateRobot(this.id, updates as any);
    this.robotData = updated;
  }

  /**
   * Get all webhooks for this robot
   */
  getWebhooks(): WebhookConfig[] | null {
    return this.robotData.webhooks || null;
  }

  /**
   * Remove all webhooks
   */
  async removeWebhooks(): Promise<void> {
    const updated = await this.client.updateRobot(this.id, {
      webhooks: null,
    } as any);
    this.robotData = updated;
  }

  /**
   * Get schedule configuration
   */
  getSchedule(): ScheduleConfig | null {
    return this.robotData.schedule || null;
  }

  /**
   * Delete the robot
   */
  async delete(): Promise<void> {
    await this.client.deleteRobot(this.id);
  }

  /**
   * Refresh robot data from server
   */
  async refresh(): Promise<void> {
    this.robotData = await this.client.getRobot(this.id);
  }
}
