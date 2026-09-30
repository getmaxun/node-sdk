/**
 * RunResult - what `robot.run()` returns.
 */

import { ChangedPages, RunResultData, RunStatus } from '../types';

/**
 * The result of `robot.run()`.
 *
 * It has the raw fields the server returns (`runId`, `status`, `data`,
 * `screenshots`, `hasChanges`, `changedFormats`), so `result.data.listData`
 * keeps working, plus shortcuts:
 *
 * - `markdown`, `html`, `text`, `summary`, `links` - page content
 * - `textData` - fields captured with `captureText`
 * - `listData` - items captured with `captureList` or prompt extraction
 * - `crawlData` - one entry per crawled page
 * - `searchData` - search results
 * - `smartQueryResult` - the LLM's answer to a Smart Query
 * - `documentData` - data pulled from a file by a document-extract robot
 * - `changedPages` - crawl monitoring: added, removed and changed page URLs
 */
export class RunResult implements RunResultData {
  runId!: string;
  status!: RunStatus;
  data!: RunResultData['data'];
  screenshots?: RunResultData['screenshots'];
  hasChanges?: boolean;
  changedFormats?: string[];
  changedPages?: ChangedPages;
  [key: string]: any;

  constructor(raw: RunResultData) {
    Object.assign(this, raw);
    this.data = { ...(raw.data || {}) };
  }

  get markdown(): string | undefined {
    return this.data.markdown;
  }

  get html(): string | undefined {
    return this.data.html;
  }

  get text(): string | undefined {
    return this.data.text;
  }

  get summary(): string | undefined {
    return this.data.summary;
  }

  get links(): string[] {
    return this.data.links || [];
  }

  get textData(): Record<string, any> {
    return this.data.textData || {};
  }

  get listData(): Record<string, any>[] {
    return this.data.listData || [];
  }

  get crawlData(): any[] {
    return this.data.crawlData || [];
  }

  get searchData(): Record<string, any> {
    return this.data.searchData || {};
  }

  get smartQueryResult(): string | null | undefined {
    return this.data.promptResult;
  }

  get documentData(): any {
    return this.data.documentData;
  }
}
