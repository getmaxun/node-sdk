/**
 * Maxun API Client
 * Handles all HTTP communication with the Maxun backend API.
 *
 * Most people should use `new Maxun()` instead of calling this directly. Every
 * method maps to one server endpoint, except the webhook helpers, which read
 * the robot first.
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import http from 'http';
import https from 'https';
import FormData from 'form-data';
import {
  Config,
  RobotData,
  Run,
  ApiResponse,
  RunResultData,
  ScheduleConfig,
  WebhookConfig,
  StoredWebhook,
  MaxunError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RunFailedError,
  WorkflowFile,
  ExecutionOptions,
  RunDiffResult,
  CrawlOptions,
  SearchOptions,
  LlmOptions,
  ListLimitUpdate,
  DocumentFormat,
  DOCUMENT_FORMATS,
  WEBHOOK_EVENTS,
} from '../types';
import { loadDocument, resolveConfig, warn } from '../utils';

/**
 * Serialises LLM options, omitting anything not explicitly set.
 *
 * Self-hosted Maxun requires these whenever a request needs a model; Maxun
 * Cloud manages its own and rejects them, so an unset option must not appear in
 * the payload at all.
 */
export function buildLlmPayload(options: LlmOptions): Record<string, string> {
  const provider = options.llmProvider?.trim();
  const model = options.llmModel?.trim();
  const apiKey = options.llmApiKey?.trim();
  const baseUrl = options.llmBaseUrl?.trim();

  /**
   * All-or-nothing. Omit every option to use the platform's own models (the
   * only thing Maxun Cloud accepts), or supply a complete configuration for a
   * self-hosted instance. A partial configuration is rejected here rather than
   * by the server, so the failure names the missing field immediately.
   *
   * `llmModel` is optional: self-hosted Maxun applies that provider's default
   * when it is omitted, so robots created before model selection existed keep
   * working without a migration.
   */
  if (model && !provider) {
    throw new MaxunError('llmProvider is required when llmModel is set.');
  }
  if (provider && provider !== 'ollama' && !apiKey) {
    throw new MaxunError(`llmApiKey is required for provider "${provider}".`);
  }

  return {
    ...(provider ? { llmProvider: provider } : {}),
    ...(model ? { llmModel: model } : {}),
    ...(apiKey ? { llmApiKey: apiKey } : {}),
    ...(baseUrl ? { llmBaseUrl: baseUrl } : {}),
  };
}

const LEGACY_EVENT_NAMES: Record<string, string> = {
  'run.completed': 'run_completed',
  'run.failed': 'run_failed',
};

function normalizeEvents(events?: string[]): string[] {
  if (!events || events.length === 0) return [...WEBHOOK_EVENTS];
  const normalized: string[] = [];
  for (let event of events) {
    if (LEGACY_EVENT_NAMES[event]) {
      warn(
        `Webhook event "${event}" is spelled "${LEGACY_EVENT_NAMES[event]}" by the server; using that. ` +
          'Webhooks saved with the dotted name never fired.'
      );
      event = LEGACY_EVENT_NAMES[event];
    }
    if (!(WEBHOOK_EVENTS as string[]).includes(event)) {
      throw new Error(`Unknown webhook event "${event}". Use one of: ${WEBHOOK_EVENTS.join(', ')}.`);
    }
    if (!normalized.includes(event)) normalized.push(event);
  }
  return normalized;
}

function webhookEntry(webhook: WebhookConfig, existing?: StoredWebhook): StoredWebhook {
  if (!webhook.url) throw new Error('A webhook needs a url.');
  if (webhook.headers && Object.keys(webhook.headers).length > 0) {
    warn('Maxun does not send custom webhook headers; the headers you passed are ignored.');
  }
  const now = new Date().toISOString();
  return {
    ...(existing || {}),
    id: existing?.id || `webhook_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    url: webhook.url,
    events: normalizeEvents(webhook.events),
    active: true,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    ...(webhook.retryAttempts !== undefined ? { retryAttempts: webhook.retryAttempts } : {}),
    ...(webhook.retryDelay !== undefined ? { retryDelay: webhook.retryDelay } : {}),
    ...(webhook.timeout !== undefined ? { timeout: webhook.timeout } : {}),
  };
}

function schedulePayload(schedule: ScheduleConfig): ScheduleConfig {
  const { cronExpression, lastRunAt, nextRunAt, ...rest } = schedule as any;
  if (!rest.runEvery || !rest.runEveryUnit) {
    throw new Error("A schedule needs runEvery and runEveryUnit, e.g. { runEvery: 6, runEveryUnit: 'HOURS' }.");
  }
  const payload: any = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
  payload.runEveryUnit = String(payload.runEveryUnit).toUpperCase();
  if (payload.startFrom) payload.startFrom = String(payload.startFrom).toUpperCase();
  payload.timezone = payload.timezone || 'UTC';
  return payload;
}

function errorFromResponse(status: number, body: any, url: string): MaxunError {
  let message: string | undefined;
  if (body && typeof body === 'object') {
    const error = body.error;
    const detail = body.message;
    message = error || detail;
    if (error && detail && detail !== error) message = `${error}: ${detail}`;
    if (typeof body.details === 'string') message = message ? `${message} (${body.details})` : body.details;
  } else if (typeof body === 'string' && body.trim()) {
    message = body.trim().slice(0, 500);
  }
  message = message || `HTTP ${status}`;

  if (url.includes('/execute') && status >= 500) return new RunFailedError(message, status, body);
  if (status === 401 || status === 403) return new AuthenticationError(message, status, body);
  if (status === 404) return new NotFoundError(message, status, body);
  if (status === 409) return new ConflictError(message, status, body);
  if (status === 400 || status === 422) return new ValidationError(message, status, body);
  return new MaxunError(message, status, body);
}

export class Client {
  private axios: AxiosInstance;
  private apiKey: string;
  readonly baseUrl: string;

  constructor(config?: Config) {
    const resolved = resolveConfig(config);
    this.apiKey = resolved.apiKey;
    this.baseUrl = resolved.baseUrl;

    this.axios = axios.create({
      baseURL: resolved.baseUrl,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        ...(resolved.teamId ? { 'x-team-id': resolved.teamId } : {}),
      },
      timeout: resolved.timeout,
    });

    this.axios.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        throw this.handleError(error);
      }
    );
  }

  /**
   * Handle API errors and convert to MaxunError
   */
  private handleError(error: AxiosError): MaxunError {
    const url = error.config?.url || '';
    if (error.response) {
      return errorFromResponse(error.response.status, error.response.data, url);
    }
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new MaxunError(`Request to ${url} timed out`, undefined, error.message);
    }
    if (error.request) {
      return new MaxunError(`Could not reach Maxun at ${this.baseUrl}: ${error.message}`, undefined, error.message);
    }
    return new MaxunError(error.message);
  }

  /** Send a request and return the parsed JSON body. */
  private async request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T> & Record<string, any>> {
    const response = await this.axios.request(config);
    const body = response.data;
    if (body === '' || body === undefined || body === null) return {} as any;
    if (typeof body !== 'object') {
      throw new MaxunError(
        `Maxun returned a non-JSON response for ${config.url}. Is baseUrl (${this.baseUrl}) pointing at the SDK API (it should end in /api/sdk)?`,
        response.status,
        String(body).slice(0, 500)
      );
    }
    return body;
  }

  /** Account info for this API key (email, plan, credits). */
  async getStatus(): Promise<Record<string, any>> {
    return await this.request({ method: 'GET', url: '/status' });
  }

  /**
   * Get all robots for the authenticated user
   */
  async getRobots(): Promise<RobotData[]> {
    const body = await this.request<RobotData[]>({ method: 'GET', url: '/robots' });
    return body.data || [];
  }

  /**
   * Get a specific robot by ID
   */
  async getRobot(robotId: string): Promise<RobotData> {
    const body = await this.request<RobotData>({ method: 'GET', url: `/robots/${robotId}` });
    if (!body.data) {
      throw new NotFoundError(`Robot ${robotId} not found`, 404);
    }
    return body.data;
  }

  /**
   * Create a new robot
   */
  async createRobot(workflowFile: WorkflowFile): Promise<RobotData> {
    // Create a fresh HTTP agent for this request to avoid stale connections
    const httpAgent = new http.Agent({ keepAlive: false });
    const httpsAgent = new https.Agent({ keepAlive: false });

    const { monitor, robotType, ...publicMeta } = (workflowFile.meta || {}) as any;
    const type = robotType || publicMeta.type;
    const payload = {
      ...workflowFile,
      meta: {
        ...publicMeta,
        type,
        ...(monitor !== undefined ? { compareRuns: Boolean(monitor) } : {}),
      },
    };

    const body = await this.request<RobotData>({
      method: 'POST',
      url: '/robots',
      data: payload,
      timeout: 120000,
      httpAgent,
      httpsAgent,
    });
    if (!body.data) {
      throw new MaxunError('Failed to create robot');
    }
    if (body.existing && type === 'extract') {
      warn(
        `A robot named "${payload.meta.name}" already exists for this URL, so it was returned unchanged ` +
          'and your new steps were NOT saved. Use a different name, or delete the old robot first.'
      );
    }
    return body.data;
  }

  /**
   * Update an existing robot
   */
  async updateRobot(robotId: string, updates: Partial<WorkflowFile> & Record<string, any>): Promise<RobotData> {
    const { monitor, ...publicMeta } = (updates.meta || {}) as any;
    const payload = updates.meta
      ? {
          ...updates,
          meta: {
            ...publicMeta,
            ...(monitor !== undefined ? { compareRuns: Boolean(monitor) } : {}),
          },
        }
      : updates;
    const body = await this.request<RobotData>({ method: 'PUT', url: `/robots/${robotId}`, data: payload });
    if (!body.data) {
      throw new MaxunError(`Failed to update robot ${robotId}`);
    }
    return body.data;
  }

  /**
   * Update one or more list limits without resending the whole workflow.
   */
  async updateListLimits(robotId: string, limits: ListLimitUpdate[]): Promise<RobotData> {
    return await this.updateRobot(robotId, { limits });
  }

  /**
   * Delete a robot
   */
  async deleteRobot(robotId: string): Promise<void> {
    await this.request({ method: 'DELETE', url: `/robots/${robotId}` });
  }

  /**
   * Duplicate a robot with a new target URL
   */
  async duplicateRobot(robotId: string, targetUrl: string): Promise<RobotData> {
    const body = await this.request<RobotData>({
      method: 'POST',
      url: `/robots/${robotId}/duplicate`,
      data: { targetUrl },
    });
    if (!body.data) {
      throw new MaxunError(`Failed to duplicate robot ${robotId}`);
    }
    return body.data;
  }

  /**
   * Run a robot and wait for it to finish. Returns the raw run result.
   *
   * @throws RunFailedError if the run fails or is aborted.
   */
  async executeRobot(robotId: string, options: ExecutionOptions = {}): Promise<RunResultData> {
    if (options.params !== undefined || options.webhook !== undefined) {
      warn(
        'run({ params, webhook }) was never used by the server and is ignored. ' +
          'Use robot.addWebhook() to get notified about runs.'
      );
    }
    const payload: Record<string, any> = {};
    if (options.formats && options.formats.length > 0) payload.formats = options.formats;
    const prompt = options.smartQueries?.trim();
    if (prompt) payload.promptInstructions = prompt;

    try {
      const body = await this.request<RunResultData>({
        method: 'POST',
        url: `/robots/${robotId}/execute`,
        data: payload,
        // Runs can legitimately take a long time (the server waits up to 3
        // hours), so by default there is no timeout.
        timeout: options.timeout || 0,
      });
      if (!body.data) {
        throw new MaxunError('Failed to execute robot');
      }
      return body.data;
    } catch (error) {
      if (options.timeout && error instanceof MaxunError && /timed out/.test(error.message)) {
        throw new MaxunError(
          `Run did not finish within ${options.timeout}ms. It may still be running on the server; check robot.getLatestRun().`,
          undefined,
          error.details
        );
      }
      throw error;
    }
  }

  /**
   * Get all runs for a robot
   */
  async getRuns(robotId: string): Promise<Run[]> {
    const body = await this.request<Run[]>({ method: 'GET', url: `/robots/${robotId}/runs` });
    return body.data || [];
  }

  /**
   * Get a specific run by ID
   */
  async getRun(robotId: string, runId: string): Promise<Run> {
    const body = await this.request<Run>({ method: 'GET', url: `/robots/${robotId}/runs/${runId}` });
    if (!body.data) {
      throw new NotFoundError(`Run ${runId} not found`, 404);
    }
    return body.data;
  }

  /** Get the monitoring diff between a run and the previous successful run. */
  async getRunDiff(robotId: string, runId: string, format?: string): Promise<RunDiffResult> {
    const body = await this.request<RunDiffResult>({
      method: 'GET',
      url: `/robots/${robotId}/runs/${runId}/diff`,
      params: format ? { format } : undefined,
    });
    if (!body.data) {
      throw new NotFoundError(`Monitoring diff for run ${runId} was not found`, 404);
    }
    return body.data;
  }

  /**
   * Abort a running or queued run
   */
  async abortRun(robotId: string, runId: string): Promise<void> {
    await this.request({ method: 'POST', url: `/robots/${robotId}/runs/${runId}/abort` });
  }

  /**
   * Schedule a robot for periodic execution
   */
  async scheduleRobot(robotId: string, schedule: ScheduleConfig): Promise<RobotData> {
    return await this.updateRobot(robotId, { schedule: schedulePayload(schedule) });
  }

  /**
   * Remove schedule from a robot
   */
  async unscheduleRobot(robotId: string): Promise<RobotData> {
    return await this.updateRobot(robotId, { schedule: null });
  }

  /**
   * Add a webhook to a robot, or update the existing one with the same URL.
   */
  async addWebhook(robotId: string, webhook: WebhookConfig | string): Promise<RobotData> {
    const config: WebhookConfig = typeof webhook === 'string' ? { url: webhook } : webhook;
    const robot = await this.getRobot(robotId);
    const webhooks: StoredWebhook[] = [...(robot.webhooks || [])];
    const index = webhooks.findIndex((w) => w.url === config.url);
    if (index === -1) {
      webhooks.push(webhookEntry(config));
    } else {
      webhooks[index] = webhookEntry(config, webhooks[index]);
    }
    return await this.updateRobot(robotId, { webhooks });
  }

  /** Remove one webhook by its id or URL. */
  async removeWebhook(robotId: string, idOrUrl: string): Promise<RobotData> {
    const robot = await this.getRobot(robotId);
    const webhooks: StoredWebhook[] = [...(robot.webhooks || [])];
    const remaining = webhooks.filter((w) => w.id !== idOrUrl && w.url !== idOrUrl);
    if (remaining.length === webhooks.length) {
      throw new NotFoundError(`No webhook with id or url "${idOrUrl}" on robot ${robotId}`, 404);
    }
    return await this.updateRobot(robotId, { webhooks: remaining.length ? remaining : null });
  }

  /**
   * LLM-based extraction - extract data using natural language prompt
   * URL is optional - if not provided, the server will search for the target website based on the prompt
   */
  async extractWithLLM(options: {
    url?: string;
    prompt: string;
    llmProvider?: 'anthropic' | 'openai' | 'ollama';
    llmModel?: string;
    llmApiKey?: string;
    llmBaseUrl?: string;
    robotName?: string;
    monitor?: boolean;
  }): Promise<any> {
    if (!options.prompt || !options.prompt.trim()) {
      throw new Error('prompt is required');
    }
    const body = await this.request({
      method: 'POST',
      url: '/extract/llm',
      data: {
        prompt: options.prompt.trim(),
        ...(options.url ? { url: options.url } : {}),
        ...(options.robotName ? { robotName: options.robotName } : {}),
        ...buildLlmPayload(options),
        ...(options.monitor !== undefined ? { compareRuns: Boolean(options.monitor) } : {}),
      },
      timeout: 300000,
    });

    if (!body.data) {
      throw new MaxunError('Failed to extract data with LLM');
    }

    return body.data;
  }

  /**
   * Create a document-extraction robot from a file path or Buffer
   * (PDF, DOCX, XLSX, CSV, JPG or PNG).
   */
  async createDocumentExtractRobot(
    file: string | Buffer,
    prompt: string,
    options?: { robotName?: string; fileName?: string } & LlmOptions
  ): Promise<{ robot: RobotData; extractionSchema: Record<string, any> }> {
    if (!prompt || !prompt.trim()) throw new Error('prompt is required');
    const doc = loadDocument(file, options?.fileName);
    const form = new FormData();
    form.append('file', doc.data, { filename: doc.fileName, contentType: doc.contentType });
    form.append('prompt', prompt.trim());
    if (options?.robotName) form.append('robotName', options.robotName);
    /**
     * Self-hosted Maxun requires these; Maxun Cloud manages its own model and
     * rejects them, so only explicitly supplied values are appended.
     */
    Object.entries(buildLlmPayload(options || {})).forEach(([key, value]) => form.append(key, value));

    const body = await this.request({
      method: 'POST',
      url: '/robots/document',
      data: form,
      headers: form.getHeaders(),
      timeout: 300000,
    });

    if (!body.data && !body.robot) {
      throw new MaxunError('Failed to create document robot', undefined, body);
    }

    return {
      robot: body.data || body.robot,
      extractionSchema: body.extractionSchema || {},
    };
  }

  /**
   * Create a document-parse robot from a file path or Buffer.
   * `outputFormats` defaults to all of markdown, html, links and summary.
   */
  async createDocumentParseRobot(
    file: string | Buffer,
    outputFormats?: DocumentFormat[],
    options?: { robotName?: string; fileName?: string } & LlmOptions
  ): Promise<{ robot: RobotData }> {
    const formats = outputFormats || [];
    const invalid = formats.filter((f) => !DOCUMENT_FORMATS.includes(f));
    if (invalid.length > 0) {
      throw new Error(`Invalid document formats: ${invalid.join(', ')}. Use any of: ${DOCUMENT_FORMATS.join(', ')}.`);
    }
    const doc = loadDocument(file, options?.fileName);
    const form = new FormData();
    form.append('file', doc.data, { filename: doc.fileName, contentType: doc.contentType });
    if (options?.robotName) form.append('robotName', options.robotName);
    formats.forEach((f) => form.append('outputFormats[]', f));
    Object.entries(buildLlmPayload(options || {})).forEach(([key, value]) => form.append(key, value));

    const body = await this.request({
      method: 'POST',
      url: '/robots/document-parse',
      data: form,
      headers: form.getHeaders(),
      timeout: 300000,
    });

    if (!body.data && !body.robot) {
      throw new MaxunError('Failed to create document-parse robot', undefined, body);
    }

    return {
      robot: body.data || body.robot,
    };
  }

  /**
   * Create a crawl robot to discover and scrape multiple pages
   */
  async createCrawlRobot(url: string, options: CrawlOptions): Promise<RobotData> {
    const body = await this.request<RobotData>({
      method: 'POST',
      url: '/crawl',
      data: {
        url,
        name: options.name,
        crawlConfig: options.crawlConfig,
        ...(options.formats ? { formats: options.formats } : {}),
        ...buildLlmPayload(options),
      },
      timeout: 120000,
    });

    if (!body.data) {
      throw new MaxunError('Failed to create crawl robot');
    }

    return body.data;
  }

  /**
   * Create a search robot to search and scrape search results
   */
  async createSearchRobot(options: SearchOptions): Promise<RobotData> {
    const body = await this.request<RobotData>({
      method: 'POST',
      url: '/search',
      data: {
        name: options.name,
        searchConfig: options.searchConfig,
        ...(options.formats ? { formats: options.formats } : {}),
        ...buildLlmPayload(options),
      },
      timeout: 120000,
    });

    if (!body.data) {
      throw new MaxunError('Failed to create search robot');
    }

    return body.data;
  }
}
