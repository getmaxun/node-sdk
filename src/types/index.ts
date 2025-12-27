/**
 * Unified type definitions for Maxun SDK
 */

// ======================
// Core Types
// ======================

export type RobotType = 'extract' | 'scrape' | 'crawl' | 'search';
export type RobotMode = 'normal' | 'bulk';
export type Format = 'markdown' | 'html' | 'screenshot-visible' | 'screenshot-fullpage';
export type RunStatus = 'running' | 'queued' | 'success' | 'failed' | 'aborting' | 'aborted';
export type TimeUnit = 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS';
export type CrawlMode = 'domain' | 'subdomain' | 'path';

export interface RobotMeta {
  name: string;
  id: string;
  robotType?: RobotType;
  mode?: RobotMode;
  url?: string;
  formats?: Format[];
  subscriptionLevel?: number;
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
    meta: RobotMeta;
    workflow: Workflow;
  };
  google_sheet_email?: string | null;
  google_sheet_name?: string | null;
  airtable_base_id?: string | null;
  airtable_table_name?: string | null;
  schedule?: ScheduleConfig | null;
  webhooks?: WebhookConfig[] | null;
  proxy_url?: string | null;
  proxy_username?: string | null;
  proxy_password?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Run {
  id: string;
  status: RunStatus;
  robotMetaId: string;
  runId: string;
  startedAt: string;
  finishedAt: string | null;
  serializableOutput?: {
    scrapeSchema?: Record<string, any>;
    scrapeList?: Record<string, any>[];
  };
  binaryOutput?: Record<string, string>;
  error?: string;
}

export interface ScheduleConfig {
  runEvery: number;
  runEveryUnit: TimeUnit;
  timezone: string;
  startFrom?: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  dayOfMonth?: number;
  atTimeStart?: string;
  atTimeEnd?: string;
  cronExpression?: string;
  lastRunAt?: string;
  nextRunAt?: string;
}

export interface WebhookConfig {
  url: string;
  events?: string[];
  headers?: Record<string, string>;
}

export interface Config {
  apiKey: string;
  baseUrl?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface RunResult {
  data: {
    textData?: Record<string, any>;
    listData?: Record<string, any>[];
    crawlData?: any[];
    markdown?: string;
    html?: string;
    binaryOutput?: Record<string, string>;
  };
  screenshots?: string[];
  status: RunStatus;
  runId: string;
}

export interface ExecutionOptions {
  params?: Record<string, any>;
  webhook?: WebhookConfig;
  timeout?: number;
  waitForCompletion?: boolean;
}

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

// ======================
// Extract-specific Types  
// ======================

export interface ExtractFields {
  [fieldName: string]: string;
}

export interface ExtractListConfig {
  selector: string;
  pagination?: PaginationConfig;
  maxItems?: number;
}

export interface PaginationConfig {
  type: 'scrollDown' | 'clickNext' | 'clickLoadMore' | 'scrollUp';
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

export interface CrawlConfig {
  mode: CrawlMode;
  includePaths?: string[];
  excludePaths?: string[];
  limit?: number;
  maxDepth?: number;
  respectRobots?: boolean;
  useSitemap?: boolean;
  followLinks?: boolean;
}

export interface CrawlOptions {
  name?: string;
  crawlConfig: CrawlConfig;
}
