/**
 * Core type definitions for Maxun SDKs
 * These types mirror the backend API structures
 */

export type RobotType = 'extract' | 'scrape';
export type RobotMode = 'normal' | 'bulk';
export type Format = 'markdown' | 'html';
export type RunStatus = 'running' | 'queued' | 'success' | 'failed' | 'aborting' | 'aborted';
export type TimeUnit = 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS';

/**
 * Robot metadata configuration
 */
export interface RobotMeta {
  name: string;
  id: string;
  robotType?: RobotType;
  mode?: RobotMode;
  url?: string;
  formats?: Format[];
  subscriptionLevel?: number;
}

/**
 * Workflow types - mirrors mx-cloud workflow structure
 */
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

/**
 * Robot definition (API response type)
 */
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
  n8n_webhook_url?: string | null;
  schedule?: ScheduleConfig | null;
  webhooks?: WebhookConfig[] | null;
  proxy_url?: string | null;
  proxy_username?: string | null;
  proxy_password?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Run execution result
 */
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

/**
 * Schedule configuration
 */
export interface ScheduleConfig {
  runEvery: number;
  runEveryUnit: TimeUnit;
  timezone: string;
  cronExpression?: string;
}

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  url: string;
  events?: string[];
  headers?: Record<string, string>;
}

/**
 * Integration types
 */
export type IntegrationType = 'googleSheets' | 'airtable' | 'n8n';

export interface GoogleSheetsConfig {
  email: string;
  sheetName: string;
}

export interface AirtableConfig {
  baseId: string;
  tableName: string;
}

export interface N8NConfig {
  webhookUrl: string;
}

export type IntegrationConfig = GoogleSheetsConfig | AirtableConfig | N8NConfig;

/**
 * SDK Configuration
 */
export interface MaxunConfig {
  apiKey: string;
  baseUrl?: string;
}

/**
 * API Response types
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface RunResult {
  data: {
    textData?: Record<string, any>;
    listData?: Record<string, any>[];
  };
  screenshots?: string[];
  status: RunStatus;
  runId: string;
}

/**
 * Execution options
 */
export interface ExecutionOptions {
  params?: Record<string, any>;
  webhook?: WebhookConfig;
  timeout?: number;
  waitForCompletion?: boolean;
}

/**
 * Error types
 */
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
