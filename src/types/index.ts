/**
 * Unified type definitions for Maxun SDK
 */

// ======================
// Core Types
// ======================

export type RobotType = 'extract' | 'scrape' | 'crawl' | 'search' | 'doc-extract' | 'doc-parse';
export type RobotMode = 'normal' | 'bulk';
export type Format = 'markdown' | 'html' | 'text' | 'links' | 'summary' | 'screenshot-visible' | 'screenshot-fullpage';
export type DocumentFormat = 'markdown' | 'html' | 'links' | 'summary';
export type RunStatus = 'running' | 'queued' | 'success' | 'failed' | 'aborting' | 'aborted';
export type TimeUnit = 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS';
export type Weekday = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
export type CrawlMode = 'domain' | 'subdomain' | 'path';
export type WebhookEvent = 'run_completed' | 'run_failed';
export type PaginationType = 'scrollDown' | 'scrollUp' | 'clickNext' | 'clickLoadMore' | 'none';

export const SCRAPE_FORMATS: Format[] = [
  'markdown', 'html', 'text', 'links', 'summary', 'screenshot-visible', 'screenshot-fullpage',
];
export const DOCUMENT_FORMATS: DocumentFormat[] = ['markdown', 'html', 'links', 'summary'];
export const WEBHOOK_EVENTS: WebhookEvent[] = ['run_completed', 'run_failed'];
/** Maxun Cloud. Self-hosted users set `baseUrl` or MAXUN_BASE_URL. */
export const DEFAULT_BASE_URL = 'https://app.maxun.dev/api/sdk/';

/**
 * LLM settings. Self-hosted Maxun only: Maxun Cloud manages its own model and
 * rejects requests that set any of these.
 */
export interface LlmOptions {
  llmProvider?: LLMProvider;
  llmModel?: string;
  llmApiKey?: string;
  llmBaseUrl?: string;
}

export interface RobotMeta extends LlmOptions {
  name: string;
  id: string;
  type?: RobotType;
  robotType?: RobotType;
  mode?: RobotMode;
  url?: string;
  formats?: Format[];
  subscriptionLevel?: number;
  smartQueries?: string;
  promptInstructions?: string;
  monitor?: boolean;
  compareRuns?: boolean;
  [key: string]: any;
}

export interface Where {
  url?: string;
  cookies?: Array<{ name: string; value: string; domain?: string }>;
  [key: string]: any;
}

export interface What {
  action: string;
  args?: any[];
  name?: string;
  actionId?: string;
}

export interface WhereWhatPair {
  id?: string;
  where: Where;
  what: What[];
}

export type Workflow = WhereWhatPair[];

export interface WorkflowFile {
  meta?: RobotMeta;
  workflow: Workflow;
}

export interface RobotData {
  id: string;
  userId?: number;
  recording_meta: RobotMeta;
  recording: {
    meta?: RobotMeta;
    workflow: Workflow;
    outputFormats?: DocumentFormat[];
    [key: string]: any;
  };
  google_sheet_email?: string | null;
  google_sheet_name?: string | null;
  airtable_base_id?: string | null;
  airtable_table_name?: string | null;
  schedule?: ScheduleConfig | null;
  webhooks?: StoredWebhook[] | null;
  proxy_url?: string | null;
  proxy_username?: string | null;
  proxy_password?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Coordinates of a single list limit within a robot's workflow,
 * plus the new value to set.
 */
export interface ListLimitUpdate {
  pairIndex: number;
  actionIndex: number;
  argIndex: number;
  limit: number;
}

/** A run record as the server stores it. `robot.getRuns()` returns `Run` objects built from these. */
export interface RunData {
  id: string;
  status: RunStatus;
  robotMetaId: string;
  robotId?: string;
  name?: string;
  runId: string;
  startedAt: string;
  finishedAt: string | null;
  hasChanges?: boolean;
  serializableOutput?: {
    scrapeSchema?: Record<string, any>;
    scrapeList?: Record<string, any>[];
    [key: string]: any;
  };
  binaryOutput?: Record<string, string>;
  error?: string;
}

/**
 * When a robot runs on its own.
 *
 * `atTimeStart` ("HH:MM") is the time of day for DAYS/WEEKS/MONTHS schedules
 * (for HOURS only its minutes are used), `startFrom` the weekday for WEEKS and
 * `dayOfMonth` the day for MONTHS. `timezone` defaults to "UTC".
 * `cronExpression`, `lastRunAt` and `nextRunAt` are set by the server.
 */
export interface ScheduleConfig {
  runEvery: number;
  runEveryUnit: TimeUnit;
  timezone?: string;
  startFrom?: Weekday;
  dayOfMonth?: number;
  atTimeStart?: string;
  atTimeEnd?: string;
  cronExpression?: string;
  lastRunAt?: string;
  nextRunAt?: string;
}

/**
 * A URL Maxun POSTs to when a run finishes.
 *
 * `events` defaults to both `run_completed` and `run_failed`. `retryAttempts`
 * (default 3), `retryDelay` (seconds, default 5, doubled per retry) and
 * `timeout` (seconds, default 30) control delivery.
 */
export interface WebhookConfig {
  url: string;
  events?: Array<WebhookEvent | string>;
  /** Not supported by the server; ignored with a warning. */
  headers?: Record<string, string>;
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
}

/** A webhook as stored on the robot. */
export interface StoredWebhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastCalledAt?: string | null;
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
}

/**
 * Connection settings. Anything left out is read from the environment:
 * `MAXUN_API_KEY`, `MAXUN_BASE_URL` and `MAXUN_TEAM_ID`.
 */
export interface Config {
  apiKey?: string;
  /** Defaults to Maxun Cloud (`https://app.maxun.dev/api/sdk/`). Set it for self-hosted Maxun. */
  baseUrl?: string;
  teamId?: string;
  /** Milliseconds for ordinary API calls (default 30000). Runs have no timeout unless you pass one to `run()`. */
  timeout?: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  existing?: boolean;
}

/** The raw shape of a run result. `robot.run()` returns a `RunResult`, which has these fields plus shortcuts. */
export interface RunResultData {
  data: {
    textData?: Record<string, any>;
    listData?: Record<string, any>[];
    crawlData?: any[];
    searchData?: Record<string, any>;
    text?: string;
    markdown?: string;
    html?: string;
    links?: string[];
    summary?: string;
    promptResult?: string | null;
    documentData?: any;
    binaryOutput?: Record<string, string>;
  };
  screenshots?: Array<string | { data: string; mimeType: string }>;
  status: RunStatus;
  runId: string;
  hasChanges?: boolean;
  changedFormats?: string[];
  changedPages?: ChangedPages;
}

export interface ChangedPages {
  added: string[];
  removed: string[];
  changed: string[];
}

export interface RunDiffChange {
  value: string;
  added: boolean;
  removed: boolean;
}

export interface RunFormatDiff {
  format: string;
  changes: RunDiffChange[];
}

export interface RunDiffResult {
  runId: string;
  previousRunId: string | null;
  hasChanges: boolean;
  changedFormats: string[];
  diffs: RunFormatDiff[];
  /** Crawl robots only: page URLs that were added, removed or changed. */
  pages?: ChangedPages;
}

/**
 * Options for one `robot.run()`.
 */
export interface ExecutionOptions {
  /** Output formats for this run only (defaults to the robot's). */
  formats?: Format[];
  /** A question for the LLM about the page, this run only (scrape robots). */
  smartQueries?: string;
  /** Milliseconds to wait. By default waits until the run finishes. */
  timeout?: number;
  /** @deprecated Never used by the server; ignored with a warning. */
  params?: Record<string, any>;
  /** @deprecated Never used by the server; use `robot.addWebhook()`. */
  webhook?: WebhookConfig;
  /** @deprecated `run()` always waits for completion. */
  waitForCompletion?: boolean;
}

// ======================
// Errors
// ======================

/** Base class for every error the SDK raises about an API call. */
export class MaxunError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'MaxunError';
  }
}

/** The API key is missing, invalid or not allowed to do this (401/403). */
export class AuthenticationError extends MaxunError {
  constructor(message: string, statusCode?: number, details?: any) {
    super(message, statusCode, details);
    this.name = 'AuthenticationError';
  }
}

/** The robot or run does not exist (404). */
export class NotFoundError extends MaxunError {
  constructor(message: string, statusCode?: number, details?: any) {
    super(message, statusCode, details);
    this.name = 'NotFoundError';
  }
}

/** A robot with this name already exists with a different configuration (409). */
export class ConflictError extends MaxunError {
  constructor(message: string, statusCode?: number, details?: any) {
    super(message, statusCode, details);
    this.name = 'ConflictError';
  }
}

/** The server rejected the request's input (400). */
export class ValidationError extends MaxunError {
  constructor(message: string, statusCode?: number, details?: any) {
    super(message, statusCode, details);
    this.name = 'ValidationError';
  }
}

/** The robot ran but the run failed or was aborted. */
export class RunFailedError extends MaxunError {
  constructor(message: string, statusCode?: number, details?: any) {
    super(message, statusCode, details);
    this.name = 'RunFailedError';
  }
}

// ======================
// Extract-specific Types
// ======================

export interface ExtractFields {
  [fieldName: string]: string;
}

/**
 * A repeated element to capture as a list. Fields inside each item are detected
 * automatically. `maxItems` defaults to 100. Leave `pagination` out to let
 * Maxun detect it, or use `{ type: 'none' }` to read only the first page.
 */
export interface ExtractListConfig {
  selector: string;
  pagination?: PaginationConfig;
  maxItems?: number;
}

export interface PaginationConfig {
  type: PaginationType;
  selector?: string | null;
}

/**
 * LLM Provider Configuration
 */

export type LLMProvider = 'anthropic' | 'openai' | 'ollama';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string;        // For cloud providers (Anthropic, OpenAI)
  baseUrl?: string;       // For custom endpoints (Ollama, custom OpenAI)
  model?: string;         // Model name
  temperature?: number;   // 0-1, creativity level
  maxTokens?: number;     // Max response tokens
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ======================
// Crawl-specific Types
// ======================

/**
 * Which pages a crawl visits. Defaults: `mode: 'domain'`, `limit: 50` pages,
 * `maxDepth: 3`, `useSitemap`, `followLinks` and `respectRobots` all true.
 */
export interface CrawlConfig {
  mode?: CrawlMode;
  includePaths?: string[];
  excludePaths?: string[];
  limit?: number;
  maxDepth?: number;
  respectRobots?: boolean;
  useSitemap?: boolean;
  followLinks?: boolean;
}

export const DEFAULT_CRAWL_CONFIG: Required<Omit<CrawlConfig, 'includePaths' | 'excludePaths'>> = {
  mode: 'domain',
  limit: 50,
  maxDepth: 3,
  respectRobots: true,
  useSitemap: true,
  followLinks: true,
};

export interface CrawlOptions extends LlmOptions {
  name?: string;
  crawlConfig: CrawlConfig;
  formats?: Format[];
}

export type SearchMode = 'discover' | 'scrape';
export type SearchProvider = 'duckduckgo';
export type SearchTimeRange = 'day' | 'week' | 'month' | 'year';

/**
 * A web search (DuckDuckGo). `mode: 'discover'` (default) returns titles, URLs
 * and snippets; `mode: 'scrape'` also scrapes every result. `limit`
 * defaults to 10. `timeRange` is a shortcut for `filters.timeRange`.
 */
export interface SearchConfig {
  query: string;
  mode?: SearchMode;
  provider?: SearchProvider;
  filters?: {
    timeRange?: SearchTimeRange;
    region?: string;
  };
  limit?: number;
  timeRange?: SearchTimeRange;
}

export interface SearchOptions extends LlmOptions {
  name?: string;
  searchConfig: SearchConfig;
  formats?: Format[];
}
