/**
 * Run - one run of a robot, as returned by `robot.getRuns()`, `getRun()` and `getLatestRun()`.
 */

import { inspect } from 'util';
import { RunData, RunStatus } from '../types';
import { toIso } from '../utils';
import { RunResult } from './run-result';

const firstContent = (value: any): string | undefined =>
  Array.isArray(value) && value[0] && typeof value[0] === 'object' ? value[0].content || undefined : undefined;

/**
 * Build a RunResult from a stored run, the same way the server builds the
 * result of `robot.run()`.
 */
export function resultFromRun(raw: RunData): RunResult {
  const output: Record<string, any> = raw.serializableOutput || {};
  const scrape: Record<string, any> = output.scrape || {};

  let listData: any[] = [];
  const scrapeList: any = output.scrapeList;
  if (scrapeList && Array.isArray(scrapeList.scrapeList)) listData = scrapeList.scrapeList;
  else if (Array.isArray(scrapeList)) listData = scrapeList;
  else if (scrapeList && typeof scrapeList === 'object') {
    const first = Object.values(scrapeList)[0];
    listData = Array.isArray(first) ? first : [];
  }

  let crawlData: any[] = [];
  if (Array.isArray(output.crawl)) crawlData = output.crawl;
  else if (output.crawl && typeof output.crawl === 'object') {
    const first = Object.values(output.crawl)[0];
    crawlData = Array.isArray(first) ? first : [];
  }

  const content = (format: string) => firstContent(output[format]) || firstContent(scrape[format]);
  const links: any[] = output.links || scrape.links || [];

  return new RunResult({
    runId: raw.runId,
    status: raw.status,
    hasChanges: Boolean(raw.hasChanges),
    changedFormats: output._comparison?.changedFormats || [],
    data: {
      textData: output.scrapeSchema || {},
      listData,
      crawlData,
      searchData: output.search || {},
      text: content('text'),
      markdown: content('markdown'),
      html: content('html'),
      summary: content('summary'),
      promptResult: firstContent(output.promptResult) ?? null,
      links: links.map((link) => (link && typeof link === 'object' && 'url' in link ? link.url : link)),
      documentData: output.scrapeDoc?.data,
    },
    screenshots: Object.values(raw.binaryOutput || {}),
  });
}

/** The fields a run shows when printed or serialised. */
export interface RunSummary {
  id: string;
  runId: string;
  robotId: string;
  name: string;
  status: RunStatus;
  startedAt: string | null;
  finishedAt: string | null;
}

/**
 * One run of a robot.
 *
 * Printing it (or `JSON.stringify`) shows only the summary fields. The run's
 * output is in `run.result` (a `RunResult`, like the one `robot.run()`
 * returns), and the raw server record in `run.getData()`.
 */
export class Run implements RunSummary {
  id!: string;
  runId!: string;
  /** The id of the robot this run belongs to (the same as `robot.id`). */
  robotId!: string;
  /** The robot's name. */
  name!: string;
  /** `queued`, `running`, `success`, `failed`, `aborting` or `aborted`. */
  status!: RunStatus;
  /** ISO 8601, UTC. */
  startedAt!: string | null;
  /** ISO 8601, UTC; `null` while the run is still going. */
  finishedAt!: string | null;
  private raw!: RunData;

  constructor(raw: RunData) {
    Object.defineProperty(this, 'raw', { value: raw || ({} as RunData), enumerable: false, writable: true });
    this.id = this.raw.id;
    this.runId = this.raw.runId;
    this.robotId = this.raw.robotMetaId;
    this.name = (this.raw as any).name;
    this.status = this.raw.status;
    this.startedAt = toIso(this.raw.startedAt);
    this.finishedAt = toIso(this.raw.finishedAt);
  }

  /** The run's output, in the same shape `robot.run()` returns. */
  get result(): RunResult {
    return resultFromRun(this.raw);
  }

  get hasChanges(): boolean {
    return Boolean(this.raw.hasChanges);
  }

  /** @deprecated Use `robotId`. */
  get robotMetaId(): string {
    return this.raw.robotMetaId;
  }

  /** @deprecated Use `run.result`, or `run.getData()` for the raw record. */
  get serializableOutput(): RunData['serializableOutput'] {
    return this.raw.serializableOutput;
  }

  /** @deprecated Use `run.result.screenshots`, or `run.getData()` for the raw record. */
  get binaryOutput(): RunData['binaryOutput'] {
    return this.raw.binaryOutput;
  }

  get error(): string | undefined {
    return this.raw.error;
  }

  /** The raw run record returned by the server. */
  getData(): RunData {
    return this.raw;
  }

  toJSON(): RunSummary {
    return {
      id: this.id,
      runId: this.runId,
      robotId: this.robotId,
      name: this.name,
      status: this.status,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt,
    };
  }

  toString(): string {
    return `Run(id=${this.id}, runId=${this.runId}, status=${this.status})`;
  }

  [inspect.custom](_depth: number, options: any, inspectFn: typeof inspect = inspect): string {
    return inspectFn(this.toJSON(), options);
  }
}
