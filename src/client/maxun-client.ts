/**
 * Maxun API Client
 * Handles all HTTP communication with the Maxun backend API
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import http from 'http';
import https from 'https';
import {
  Config,
  RobotData,
  Run,
  ApiResponse,
  RunResult,
  ScheduleConfig,
  WebhookConfig,
  MaxunError,
  WorkflowFile,
  ExecutionOptions,
  CrawlOptions,
  SearchOptions,
} from '../types';

export class Client {
  private axios: AxiosInstance;
  private apiKey: string;

  constructor(config: Config) {
    this.apiKey = config.apiKey;

    this.axios = axios.create({
      baseURL: config.baseUrl || 'http://localhost:8080/api/sdk',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Add response interceptor for error handling
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
    if (error.response) {
      const data = error.response.data as any;
      return new MaxunError(
        data?.error || data?.message || 'API request failed',
        error.response.status,
        data
      );
    } else if (error.request) {
      return new MaxunError('No response from server', undefined, error.message);
    } else {
      return new MaxunError(error.message);
    }
  }

  /**
   * Get all robots for the authenticated user
   */
  async getRobots(): Promise<RobotData[]> {
    const response = await this.axios.get<ApiResponse<RobotData[]>>('/robots');
    return response.data.data || [];
  }

  /**
   * Get a specific robot by ID
   */
  async getRobot(robotId: string): Promise<RobotData> {
    const response = await this.axios.get<ApiResponse<RobotData>>(`/robots/${robotId}`);
    if (!response.data.data) {
      throw new MaxunError(`Robot ${robotId} not found`, 404);
    }
    return response.data.data;
  }

  /**
   * Create a new robot
   */
  async createRobot(workflowFile: WorkflowFile): Promise<RobotData> {
    // Create a fresh HTTP agent for this request to avoid stale connections
    const httpAgent = new http.Agent({ keepAlive: false });
    const httpsAgent = new https.Agent({ keepAlive: false });

    const robotTypeValue = (workflowFile.meta as any)?.robotType || (workflowFile.meta as any)?.type;
    const payload = {
      ...workflowFile,
      meta: {
        ...workflowFile.meta,
        type: robotTypeValue, 
        robotType: robotTypeValue,
      }
    };

    const response = await this.axios.post<ApiResponse<RobotData>>('/robots', payload, {
      timeout: 120000,
      httpAgent,
      httpsAgent,
    });
    if (!response.data.data) {
      throw new MaxunError('Failed to create robot');
    }
    return response.data.data;
  }

  /**
   * Update an existing robot
   */
  async updateRobot(robotId: string, updates: Partial<WorkflowFile>): Promise<RobotData> {
    const response = await this.axios.put<ApiResponse<RobotData>>(`/robots/${robotId}`, updates);
    if (!response.data.data) {
      throw new MaxunError(`Failed to update robot ${robotId}`);
    }
    return response.data.data;
  }

  /**
   * Delete a robot
   */
  async deleteRobot(robotId: string): Promise<void> {
    await this.axios.delete(`/robots/${robotId}`);
  }

  /**
   * Execute a robot and get results
   */
  async executeRobot(robotId: string, options?: ExecutionOptions): Promise<RunResult> {
    // Execute and wait for completion (endpoint handles waiting)
    const response = await this.axios.post<ApiResponse<RunResult>>(
      `/robots/${robotId}/execute`,
      {
        params: options?.params,
        webhook: options?.webhook,
      },
      {
        timeout: options?.timeout || 300000, // 5 minutes default
      }
    );

    if (!response.data.data) {
      throw new MaxunError('Failed to execute robot');
    }

    return response.data.data;
  }

  /**
   * Get all runs for a robot
   */
  async getRuns(robotId: string): Promise<Run[]> {
    const response = await this.axios.get<ApiResponse<Run[]>>(`/robots/${robotId}/runs`);
    return response.data.data || [];
  }

  /**
   * Get a specific run by ID
   */
  async getRun(robotId: string, runId: string): Promise<Run> {
    const response = await this.axios.get<ApiResponse<Run>>(`/robots/${robotId}/runs/${runId}`);
    if (!response.data.data) {
      throw new MaxunError(`Run ${runId} not found`, 404);
    }
    return response.data.data;
  }

  /**
   * Abort a running or queued run
   */
  async abortRun(robotId: string, runId: string): Promise<void> {
    await this.axios.post(`/robots/${robotId}/runs/${runId}/abort`);
  }

  /**
   * Schedule a robot for periodic execution
   */
  async scheduleRobot(robotId: string, schedule: ScheduleConfig): Promise<RobotData> {
    const response = await this.axios.put<ApiResponse<RobotData>>(
      `/robots/${robotId}`,
      { schedule }
    );
    if (!response.data.data) {
      throw new MaxunError(`Failed to schedule robot ${robotId}`);
    }
    return response.data.data;
  }

  /**
   * Remove schedule from a robot
   */
  async unscheduleRobot(robotId: string): Promise<RobotData> {
    const response = await this.axios.put<ApiResponse<RobotData>>(
      `/robots/${robotId}`,
      { schedule: null }
    );
    if (!response.data.data) {
      throw new MaxunError(`Failed to unschedule robot ${robotId}`);
    }
    return response.data.data;
  }

  /**
   * Add a webhook to a robot
   */
  async addWebhook(robotId: string, webhook: WebhookConfig): Promise<RobotData> {
    const robot = await this.getRobot(robotId);
    const webhooks = robot.webhooks || [];

    // Add webhook with proper structure
    const newWebhook = {
      id: `webhook_${Date.now()}`,
      url: webhook.url,
      events: webhook.events || ['run.completed', 'run.failed'],
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    webhooks.push(newWebhook);

    const response = await this.axios.put<ApiResponse<RobotData>>(`/robots/${robotId}`, {
      webhooks,
    });

    if (!response.data.data) {
      throw new MaxunError(`Failed to add webhook to robot ${robotId}`);
    }
    return response.data.data;
  }

  /**
   * LLM-based extraction - extract data using natural language prompt
   */
  async extractWithLLM(url: string, options: {
    prompt: string;
    llmProvider?: 'anthropic' | 'openai' | 'ollama';
    llmModel?: string;
    llmApiKey?: string;
    llmBaseUrl?: string;
    robotName?: string;
  }): Promise<any> {
    const response = await this.axios.post<ApiResponse<any>>(
      '/extract/llm',
      {
        url,
        prompt: options.prompt,
        llmProvider: options.llmProvider,
        llmModel: options.llmModel,
        llmApiKey: options.llmApiKey,
        llmBaseUrl: options.llmBaseUrl,
        robotName: options.robotName,
      },
      {
        timeout: 300000,
      }
    );

    if (!response.data.data) {
      throw new MaxunError('Failed to extract data with LLM');
    }

    return response.data.data;
  }

  /**
   * Create a crawl robot to discover and scrape multiple pages
   */
  async createCrawlRobot(url: string, options: CrawlOptions): Promise<RobotData> {
    const response = await this.axios.post<ApiResponse<RobotData>>(
      '/crawl',
      {
        url,
        name: options.name,
        crawlConfig: options.crawlConfig,
      }
    );

    if (!response.data.data) {
      throw new MaxunError('Failed to create crawl robot');
    }

    return response.data.data;
  }

  /**
   * Create a search robot to search and scrape search results
   */
  async createSearchRobot(options: SearchOptions): Promise<RobotData> {
    const response = await this.axios.post<ApiResponse<RobotData>>(
      '/search',
      {
        name: options.name,
        searchConfig: options.searchConfig,
      }
    );

    if (!response.data.data) {
      throw new MaxunError('Failed to create search robot');
    }

    return response.data.data;
  }
}
