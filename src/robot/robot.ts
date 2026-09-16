/**
 * Robot class - represents a saved workflow that can be executed
 */

import { RunResult, RunDiffResult, RobotData, ScheduleConfig, WebhookConfig, ExecutionOptions, Run, MaxunError } from '../types';
import { Client } from '../client/maxun-client';

export class Robot {
  protected client: Client;
  protected robotData: RobotData;

  constructor(client: Client, robotData: RobotData) {
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

  /** Get the detailed monitoring diff for a completed run. */
  async getRunDiff(runId: string, format?: string): Promise<RunDiffResult> {
    return await this.client.getRunDiff(this.id, runId, format);
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
   * Set the maximum number of items this robot collects.
   *
   * Applies to the three actions that carry a limit: `scrapeList` on extract
   * robots, `crawl` on crawl robots, and `search` on search robots. The action
   * is located automatically, so callers do not need to know its position in
   * the workflow. Only the limit is sent; the rest of the workflow is untouched.
   *
   * @throws MaxunError if the robot has no action with a limit.
   */
  async setListLimit(limit: number): Promise<void> {
    const LIMIT_ACTIONS = ['scrapeList', 'crawl', 'search'];
    const workflow = this.robotData.recording?.workflow || [];

    for (let p = 0; p < workflow.length; p++) {
      const what = workflow[p].what || [];
      for (let a = 0; a < what.length; a++) {
        if (!LIMIT_ACTIONS.includes(what[a].action)) continue;
        const args = what[a].args || [];
        for (let g = 0; g < args.length; g++) {
          const arg = args[g];
          if (arg && typeof arg === 'object' && 'limit' in arg) {
            this.robotData = await this.client.updateListLimits(this.id, [
              { pairIndex: p, actionIndex: a, argIndex: g, limit },
            ]);
            return;
          }
        }
      }
    }

    throw new MaxunError('This robot has no scrapeList, crawl, or search action with a limit to update.');
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
   * Duplicate the robot with a new target URL
   */
  async duplicate(targetUrl: string): Promise<Robot> {
    const newRobotData = await this.client.duplicateRobot(this.id, targetUrl);
    return new Robot(this.client, newRobotData);
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
