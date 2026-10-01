/**
 * Robot class - represents a saved workflow that can be executed
 */

import {
  RunDiffResult,
  RobotData,
  RobotType,
  ScheduleConfig,
  WebhookConfig,
  StoredWebhook,
  ExecutionOptions,
  Format,
  RunData,
  RunResultData,
  MaxunError,
} from '../types';
import { inspect } from 'util';
import { Client } from '../client/maxun-client';
import { parseTime, warn } from '../utils';
import { RunResult } from './run-result';
import { Run } from './run';
import { compareCrawl, crawlDiff, crawlPages, previousSuccessfulRun } from './monitoring';

/** Robot types that support change monitoring. */
export const MONITORABLE_TYPES: RobotType[] = ['scrape', 'crawl', 'extract'];

export class Robot {
  protected client!: Client;
  protected robotData!: RobotData;

  constructor(client: Client, robotData: RobotData) {
    // Not enumerable, so console.log(robot) shows only the summary below and
    // never the client (which holds the API key) or the raw record.
    Object.defineProperty(this, 'client', { value: client, enumerable: false, writable: true });
    Object.defineProperty(this, 'robotData', { value: robotData, enumerable: false, writable: true });
  }

  /** `{ id, name, type }` - what a robot shows when printed or serialised. */
  toJSON(): { id: string; name: string; type: RobotType | undefined } {
    return { id: this.id, name: this.name, type: this.type };
  }

  [inspect.custom](_depth: number, options: any, inspectFn: typeof inspect = inspect): string {
    return inspectFn(this.toJSON(), options);
  }

  // ---------- properties ----------

  /** The robot's id. */
  get id(): string {
    return this.robotData.recording_meta.id;
  }

  /** The robot's name. */
  get name(): string {
    return this.robotData.recording_meta.name;
  }

  /** `extract`, `scrape`, `crawl`, `search`, `doc-extract` or `doc-parse`. */
  get type(): RobotType | undefined {
    const meta = this.robotData.recording_meta || ({} as any);
    return meta.type || meta.robotType;
  }

  get url(): string | undefined {
    return this.robotData.recording_meta?.url;
  }

  /** Output formats (for document-parse robots, the formats set at creation). */
  get formats(): string[] {
    return [...(this.robotData.recording_meta?.formats || this.robotData.recording?.outputFormats || [])];
  }

  /** True if each run is compared with the previous successful run. */
  get isMonitoring(): boolean {
    return Boolean(this.robotData.recording_meta?.compareRuns);
  }

  /** The raw robot record returned by the server. */
  getData(): RobotData {
    return this.robotData;
  }

  // ---------- running ----------

  /**
   * Run the robot and wait for it to finish.
   *
   * @param options.formats Output formats for this run only.
   * @param options.smartQueries A question for the LLM about the page, this run only.
   * @param options.timeout Milliseconds to wait. By default waits until the run finishes.
   * @throws RunFailedError if the run fails or is aborted.
   */
  async run(options?: ExecutionOptions): Promise<RunResult> {
    const raw = await this.client.executeRaw(this.id, options);
    const result: RunResultData = { ...raw, data: { ...(raw.data || {}) } };
    await this.addMissingOutputs(result, (options?.formats as Format[]) || this.formats);
    if (this.type === 'crawl' && this.isMonitoring) {
      await this.compareCrawlRun(result);
    }
    return new RunResult(result, { monitored: this.isMonitoring });
  }

  /** The run endpoint leaves out links and document-extract data, so read them from the stored run. */
  private async addMissingOutputs(result: RunResultData, formats: string[]): Promise<void> {
    const wantsLinks = formats.includes('links');
    const isDocument = this.type === 'doc-extract';
    if (!(wantsLinks || isDocument) || !result.runId) return;
    let run: RunData;
    try {
      run = await this.client.getRun(this.id, result.runId);
    } catch (error) {
      warn(`The run succeeded but its links/document data could not be loaded: ${(error as Error).message}`);
      return;
    }
    const output: Record<string, any> = run.serializableOutput || {};
    if (wantsLinks) {
      const links: any[] = output.links || output.scrape?.links || [];
      result.data.links = links.map((link) => (link && typeof link === 'object' && 'url' in link ? link.url : link));
    }
    if (isDocument) {
      result.data.documentData = output.scrapeDoc?.data;
    }
  }

  /** The server does not compare crawl runs, so the SDK does it. */
  private async compareCrawlRun(result: RunResultData): Promise<void> {
    if (!result.runId) return;
    let runs: RunData[];
    try {
      runs = await this.rawRuns();
    } catch (error) {
      warn(`The run succeeded but could not be compared with the previous run: ${(error as Error).message}`);
      return;
    }
    const current = runs.find((r) => r.runId === result.runId);
    const output: Record<string, any> = current?.serializableOutput || {};
    if ('_comparison' in output) return; // the server compared it
    const previous = previousSuccessfulRun(runs, result.runId);
    if (!previous) {
      result.changedPages = { added: [], removed: [], changed: [] };
      return;
    }
    const currentPages = crawlPages(output.crawl);
    const { changedFormats, pages } = compareCrawl(
      crawlPages(previous.serializableOutput?.crawl),
      currentPages.length ? currentPages : result.data?.crawlData || []
    );
    result.hasChanges = changedFormats.length > 0;
    result.changedFormats = changedFormats;
    result.changedPages = pages;
  }

  /**
   * All runs of this robot, newest first. Each run prints as a short summary;
   * its output is in `run.result`.
   */
  async getRuns(): Promise<Run[]> {
    return (await this.rawRuns()).map((raw) => new Run(raw, this.isMonitoring));
  }

  private async rawRuns(): Promise<RunData[]> {
    const runs = await this.client.getRuns(this.id);
    const times = runs.map((r) => parseTime(r.startedAt));
    if (runs.length && times.every((t) => t !== null)) {
      return runs
        .map((run, i) => ({ run, time: times[i] as number }))
        .sort((a, b) => b.time - a.time)
        .map(({ run }) => run);
    }
    return runs; // the server already returns newest first
  }

  /**
   * Get a specific run
   */
  async getRun(runId: string): Promise<Run> {
    return new Run(await this.client.getRun(this.id, runId), this.isMonitoring);
  }

  /**
   * Get the latest run
   */
  async getLatestRun(): Promise<Run | null> {
    const runs = await this.getRuns();
    return runs[0] || null;
  }

  /**
   * Abort a running or queued run
   */
  async abort(runId: string): Promise<void> {
    await this.client.abortRun(this.id, runId);
  }

  // ---------- monitoring ----------

  /**
   * Turn change monitoring on or off (scrape, crawl and extract robots). When
   * on, every run is compared with the previous successful run; see
   * `result.hasChanges` and `getRunDiff()`.
   */
  async setMonitoring(enabled: boolean = true): Promise<void> {
    if (enabled && !MONITORABLE_TYPES.includes(this.type as RobotType)) {
      throw new Error(`Change monitoring works for scrape, crawl and extract robots, not ${this.type} robots.`);
    }
    await this.update({ meta: { compareRuns: Boolean(enabled) } as any });
  }

  /**
   * What changed between a run and the previous successful run.
   *
   * `format` limits the diff to one output: `markdown`, `text` or `html` for
   * scrape and crawl robots, `captured-text` or `captured-list` for extract
   * robots. Crawl diffs also list the `pages` that were added, removed or changed.
   */
  async getRunDiff(runId: string, format?: string): Promise<RunDiffResult> {
    if (this.type === 'crawl') {
      const runs = await this.rawRuns();
      const current = runs.find((r) => r.runId === runId) || (await this.client.getRun(this.id, runId));
      const output: Record<string, any> = current.serializableOutput || {};
      if (!('_comparison' in output)) {
        return crawlDiff(runId, previousSuccessfulRun(runs, runId), output.crawl, format);
      }
    }
    return await this.client.getRunDiff(this.id, runId, format);
  }

  // ---------- schedule ----------

  /**
   * Run the robot on a schedule. Returns the saved schedule.
   *
   *     await robot.schedule({ runEvery: 6, runEveryUnit: 'HOURS', timezone: 'Asia/Kolkata' });
   */
  async schedule(config: ScheduleConfig): Promise<ScheduleConfig> {
    this.robotData = await this.client.scheduleRobot(this.id, config);
    return this.getSchedule() || ({} as ScheduleConfig);
  }

  /**
   * Remove the schedule
   */
  async unschedule(): Promise<void> {
    this.robotData = await this.client.unscheduleRobot(this.id);
  }

  /**
   * Get schedule configuration
   */
  getSchedule(): ScheduleConfig | null {
    return this.robotData.schedule || null;
  }

  // ---------- webhooks ----------

  /**
   * Get a POST to `url` when a run completes or fails. Returns the saved webhook.
   * Adding a URL that is already registered updates it instead of duplicating it.
   *
   *     await robot.addWebhook('https://example.com/hook');
   *     await robot.addWebhook({ url, events: ['run_failed'], retryAttempts: 5 });
   */
  async addWebhook(webhook: WebhookConfig | string, options?: Omit<WebhookConfig, 'url'>): Promise<StoredWebhook> {
    const config: WebhookConfig = typeof webhook === 'string' ? { url: webhook, ...(options || {}) } : webhook;
    this.robotData = await this.client.addWebhook(this.id, config);
    return this.getWebhooks().find((w) => w.url === config.url) as StoredWebhook;
  }

  /**
   * Get all webhooks for this robot
   */
  getWebhooks(): StoredWebhook[] {
    return [...(this.robotData.webhooks || [])];
  }

  /** Remove one webhook by its id or URL. */
  async removeWebhook(idOrUrl: string): Promise<void> {
    this.robotData = await this.client.removeWebhook(this.id, idOrUrl);
  }

  /**
   * Remove all webhooks
   */
  async removeWebhooks(): Promise<void> {
    this.robotData = await this.client.updateRobot(this.id, { webhooks: null });
  }

  // ---------- editing ----------

  /**
   * Send a raw update (`{ meta: {...} }`, `{ workflow: [...] }`...)
   */
  async update(updates: { meta?: Partial<RobotData['recording_meta']>; workflow?: any[]; [key: string]: any }): Promise<void> {
    this.robotData = await this.client.updateRobot(this.id, updates as any);
  }

  /** Rename the robot. */
  async rename(name: string): Promise<void> {
    await this.update({ meta: { name } });
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

    throw new MaxunError('This robot has no list, crawl, or search step with a limit to update.');
  }

  /**
   * Copy this robot to run against another URL. Returns the new robot.
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
   * Reload this robot from the server
   */
  async refresh(): Promise<void> {
    this.robotData = await this.client.getRobot(this.id);
  }

  toString(): string {
    return `Robot(id=${this.id}, name=${this.name}, type=${this.type})`;
  }
}
