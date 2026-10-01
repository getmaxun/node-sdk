/**
 * RunResult - what `robot.run()` returns.
 */

import { inspect } from 'util';
import { ChangedPages, RunResultData, RunStatus } from '../types';

type DataKey = keyof RunResultData['data'];

/** [key in the result, key in the server's run data] */
const RESULT_FIELDS: Array<[string, DataKey]> = [
  ['text', 'text'],
  ['markdown', 'markdown'],
  ['html', 'html'],
  ['summary', 'summary'],
  ['links', 'links'],
  ['textData', 'textData'],
  ['listData', 'listData'],
  ['crawlData', 'crawlData'],
  ['searchData', 'searchData'],
  ['smartQueryResult', 'promptResult'],
  ['documentData', 'documentData'],
];

function hasValue(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value as object).length > 0;
  return true;
}

export interface RunResultOptions {
  /**
   * Whether the robot has change monitoring on. When true, `hasChanges` and
   * `changedFormats` are part of the result; when false they are left out.
   * When not given, they are included only if the server reported changes.
   */
  monitored?: boolean;
}

/**
 * The result of `robot.run()`.
 *
 * It holds the run id, the status and only the outputs the run produced:
 *
 *     { runId: '…', status: 'success', markdown: '# Example Domain…', screenshots: [...] }
 *
 * `hasChanges` and `changedFormats` (and `changedPages` for crawls) are
 * included when the robot has change monitoring on. That is what you see when
 * you print it or `JSON.stringify` it.
 *
 * Every output can also be read as a property, and is always safe to read (an
 * output the run didn't produce is `undefined` or empty): `markdown`, `html`,
 * `text`, `summary`, `links`, `textData`, `listData`, `crawlData`,
 * `searchData`, `smartQueryResult`, `documentData`, `screenshots`,
 * `hasChanges`, `changedFormats`, `changedPages`. Code written for 0.0.x, like
 * `result.data.listData`, still works.
 */
export class RunResult {
  runId!: string;
  status!: RunStatus;
  private raw!: RunResultData;

  constructor(raw: RunResultData, options: RunResultOptions = {}) {
    const copy: RunResultData = { ...raw, data: { ...((raw && raw.data) || {}) } };
    Object.defineProperty(this, 'raw', { value: copy, enumerable: false, writable: true });
    this.runId = copy.runId;
    this.status = copy.status;

    const show = (key: string, value: unknown) =>
      Object.defineProperty(this, key, { value, enumerable: true, writable: true, configurable: true });

    for (const [key, source] of RESULT_FIELDS) {
      if (hasValue(copy.data[source])) show(key, copy.data[source]);
    }
    if (hasValue(copy.screenshots)) show('screenshots', copy.screenshots);

    const monitored =
      options.monitored ?? Boolean(copy.hasChanges || (copy.changedFormats && copy.changedFormats.length) || copy.changedPages);
    if (monitored) {
      show('hasChanges', Boolean(copy.hasChanges));
      show('changedFormats', [...(copy.changedFormats || [])]);
      if (copy.changedPages) show('changedPages', copy.changedPages);
    }
  }

  /** The server's raw output, as 0.0.x returned it. */
  get data(): RunResultData['data'] {
    return this.raw.data;
  }

  get markdown(): string | undefined {
    return this.raw.data.markdown;
  }

  get html(): string | undefined {
    return this.raw.data.html;
  }

  get text(): string | undefined {
    return this.raw.data.text;
  }

  get summary(): string | undefined {
    return this.raw.data.summary;
  }

  get links(): string[] {
    return this.raw.data.links || [];
  }

  get textData(): Record<string, any> {
    return this.raw.data.textData || {};
  }

  get listData(): Record<string, any>[] {
    return this.raw.data.listData || [];
  }

  get crawlData(): any[] {
    return this.raw.data.crawlData || [];
  }

  get searchData(): Record<string, any> {
    return this.raw.data.searchData || {};
  }

  get smartQueryResult(): string | null | undefined {
    return this.raw.data.promptResult;
  }

  get documentData(): any {
    return this.raw.data.documentData;
  }

  get screenshots(): Array<string | { data: string; mimeType: string }> {
    return this.raw.screenshots || [];
  }

  get hasChanges(): boolean {
    return Boolean(this.raw.hasChanges);
  }

  get changedFormats(): string[] {
    return this.raw.changedFormats || [];
  }

  get changedPages(): ChangedPages {
    return this.raw.changedPages || { added: [], removed: [], changed: [] };
  }

  /** The fields shown when printed: run id, status and the outputs the run produced. */
  toJSON(): Record<string, any> {
    return Object.fromEntries(Object.keys(this).map((key) => [key, (this as any)[key]]));
  }

  [inspect.custom](_depth: number, options: any, inspectFn: typeof inspect = inspect): string {
    return inspectFn(this.toJSON(), options);
  }
}
