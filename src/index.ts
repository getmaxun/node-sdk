/**
 * Maxun SDK - turn any website (or document) into an API.
 *
 * Start here:
 *
 *     import { Maxun } from 'maxun-sdk';
 *     const maxun = new Maxun();
 *
 * @packageDocumentation
 */

// Main entry point
export { Maxun, Robots } from './maxun';
export type { ScrapeResource, CrawlResource, SearchResource, ExtractResource, ExtractCall } from './maxun';

// Resources (also usable on their own: `new Scrape({ apiKey })`)
export { Extract } from './extract';
export type { PromptExtractOptions, ExtractPromptCallOptions, ExtractBuilderCallOptions } from './extract';
export { Scrape } from './scrape';
export type { ScrapeOptions, ScrapeCallOptions } from './scrape';
export { Crawl } from './crawl';
export type { CrawlCreateOptions, CrawlCallOptions } from './crawl';
export { Search } from './search';
export type { SearchCreateOptions, SearchCallOptions } from './search';
export { Documents } from './documents';
export type { DocumentOptions, DocumentParseOptions } from './documents';

export { Robot } from './robot/robot';
export { RunResult } from './robot/run-result';
export { Run } from './robot/run';
export type { RunSummary } from './robot/run';
export { Client, buildLlmPayload } from './client/maxun-client';
export { ExtractBuilder } from './builders/extract-builder';
export { WorkflowBuilder } from './builders/workflow-builder';

// All types
export * from './types';
