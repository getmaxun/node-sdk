/**
 * Change monitoring for crawl robots, done in the SDK.
 *
 * The Maxun server compares runs for scrape and extract robots, but not for
 * crawl robots. For those, the SDK compares a run with the previous successful
 * run itself, page by page, and returns the result in the same shape the server
 * uses for the other robot types. If a run already carries the server's own
 * comparison (`_comparison` in its output), the SDK leaves it alone.
 */

import { diffLines } from 'diff';
import { ChangedPages, RunData as Run, RunDiffResult } from '../types';

const COMPARABLE_FORMATS = ['text', 'markdown', 'html'] as const;

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();

/** Pages from a run's `crawl` output (a list, or an object of lists). */
export function crawlPages(crawlOutput: unknown): any[] {
  if (Array.isArray(crawlOutput)) return crawlOutput.filter((p) => p && typeof p === 'object');
  if (crawlOutput && typeof crawlOutput === 'object') {
    return Object.values(crawlOutput as Record<string, unknown>)
      .filter(Array.isArray)
      .flat()
      .filter((p: any) => p && typeof p === 'object');
  }
  return [];
}

const pageUrl = (page: any): string => String(page?.metadata?.url || page?.url || '');

function byUrl(pages: any[]): Map<string, any> {
  const map = new Map<string, any>();
  for (const page of pages) if (!page.error) map.set(pageUrl(page), page);
  return map;
}

function documentFor(pages: Map<string, any>, format: string): string {
  return [...pages.keys()]
    .sort()
    .filter((url) => typeof pages.get(url)[format] === 'string')
    .map((url) => `## ${url}\n${String(pages.get(url)[format]).trimEnd()}\n`)
    .join('\n');
}

function formatsPresent(pages: Map<string, any>): string[] {
  return COMPARABLE_FORMATS.filter((format) => [...pages.values()].some((p) => typeof p[format] === 'string'));
}

/** Which formats changed, and which page URLs were added, removed or changed. */
export function compareCrawl(previous: any[], current: any[]): { changedFormats: string[]; pages: ChangedPages } {
  const prev = byUrl(previous);
  const cur = byUrl(current);
  const formats = formatsPresent(cur);
  const changedFormats = formats.filter(
    (format) => normalize(documentFor(prev, format)) !== normalize(documentFor(cur, format))
  );
  const shared = [...cur.keys()].filter((url) => prev.has(url)).sort();
  return {
    changedFormats,
    pages: {
      added: [...cur.keys()].filter((url) => !prev.has(url)).sort(),
      removed: [...prev.keys()].filter((url) => !cur.has(url)).sort(),
      changed: shared.filter((url) =>
        formats.some(
          (format) => normalize(String(prev.get(url)[format] ?? '')) !== normalize(String(cur.get(url)[format] ?? ''))
        )
      ),
    },
  };
}

/** A diff shaped like the server's `/runs/:id/diff` response, plus `pages`. */
export function crawlDiff(
  runId: string,
  previousRun: Run | null,
  currentOutput: unknown,
  format?: string
): RunDiffResult {
  if (!previousRun) {
    return {
      runId,
      previousRunId: null,
      hasChanges: false,
      changedFormats: [],
      diffs: [],
      pages: { added: [], removed: [], changed: [] },
    };
  }
  const prevPages = crawlPages(previousRun.serializableOutput?.crawl);
  const curPages = crawlPages(currentOutput);
  const { changedFormats, pages } = compareCrawl(prevPages, curPages);
  const prev = byUrl(prevPages);
  const cur = byUrl(curPages);
  return {
    runId,
    previousRunId: previousRun.runId,
    hasChanges: changedFormats.length > 0,
    changedFormats,
    diffs: changedFormats
      .filter((f) => !format || f === format)
      .map((f) => ({
        format: f,
        changes: diffLines(documentFor(prev, f), documentFor(cur, f)).map(({ value, added, removed }) => ({
          value,
          added: Boolean(added),
          removed: Boolean(removed),
        })),
      })),
    pages,
  };
}

/** The successful run before `runId` in a newest-first list. */
export function previousSuccessfulRun(runs: Run[], runId: string): Run | null {
  const index = runs.findIndex((r) => r.runId === runId);
  const older = index === -1 ? runs : runs.slice(index + 1);
  return older.find((r) => r.status === 'success' && r.runId !== runId) || null;
}
