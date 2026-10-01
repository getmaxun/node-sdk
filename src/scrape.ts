/**
 * Scrape - turn a single page into Markdown, HTML, text, links, a summary or screenshots.
 */

import { buildLlmPayload } from './client/maxun-client';
import { Format, LlmOptions, RobotType, SCRAPE_FORMATS, WorkflowFile } from './types';
import { Robot } from './robot/robot';
import { Resource } from './resource';
import { autoName, checkUrl, describeUrl } from './naming';

export interface ScrapeOptions extends LlmOptions {
  /**
   * Output formats for scraping
   * - 'markdown': Page content in markdown format
   * - 'html': Page content in HTML format
   * - 'text': Plain text content
   * - 'links': All hyperlinks on the page
   * - 'summary': AI-generated summary of the page content
   * - 'screenshot-visible': Screenshot of visible viewport
   * - 'screenshot-fullpage': Full page screenshot
   *
   * Default: ['markdown']
   */
  formats?: Format[];

  /**
   * Optional Smart Queries prompt. After scraping, the LLM analyzes the page
   * and answers it on every run; read the answer from `result.smartQueryResult`.
   */
  smartQueries?: string;
  /** Compare every run with the previous successful run. */
  monitor?: boolean;
}

/** Options for `maxun.scrape(url, options)`. */
export interface ScrapeCallOptions extends ScrapeOptions {
  /** Robot name. Defaults to one made from the URL and settings, so the same call returns the same robot. */
  name?: string;
}

/** Reject an options argument that is not an object (usually the old name-first argument order). */
export function checkOptions(options: unknown, call: string): void {
  if (options !== undefined && (options === null || typeof options !== 'object' || Array.isArray(options))) {
    throw new TypeError(`${call} takes an options object as its second argument. Pass the robot name as { name }.`);
  }
}

/** Reject options this call does not know about (typos, or settings from the old call shape). */
export function checkKeys(options: object, allowed: string[], call: string): void {
  const unknown = Object.keys(options).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) {
    throw new TypeError(`${call} got unknown option${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')}. Allowed: ${allowed.join(', ')}.`);
  }
}

const LLM_KEYS = ['llmProvider', 'llmModel', 'llmApiKey', 'llmBaseUrl'];
export const SCRAPE_KEYS = ['name', 'formats', 'smartQueries', 'monitor', ...LLM_KEYS];
export const CRAWL_KEYS = [
  'name', 'mode', 'limit', 'maxDepth', 'includePaths', 'excludePaths', 'useSitemap', 'followLinks',
  'respectRobots', 'formats', 'monitor', ...LLM_KEYS,
];
export const SEARCH_KEYS = ['name', 'mode', 'limit', 'timeRange', 'formats', ...LLM_KEYS];
export const PROMPT_KEYS = ['prompt', 'name', 'monitor', ...LLM_KEYS];

export function checkFormats(formats: Format[] | undefined, allowed: string[] = SCRAPE_FORMATS): Format[] | undefined {
  if (!formats) return undefined;
  const list = Array.isArray(formats) ? formats : [formats as unknown as Format];
  const invalid = list.filter((f) => !allowed.includes(f));
  if (invalid.length > 0) {
    throw new Error(`Invalid formats: ${invalid.join(', ')}. Use any of: ${allowed.join(', ')}.`);
  }
  return list;
}

export class Scrape extends Resource {
  protected readonly robotTypes: RobotType[] = ['scrape'];

  /**
   * Create a scrape robot. Run it with `await robot.run()`.
   *
   * @param name - Robot name. Creating again with the same name and settings
   *   returns the existing robot; different settings raise ConflictError.
   * @param url - Page to scrape
   * @param options - formats, smartQueries, monitor and (self-hosted only) llm* settings
   */
  async create(name: string, url: string, options?: ScrapeOptions): Promise<Robot> {
    if (!url) {
      throw new Error('URL is required');
    }

    const smartQueries = options?.smartQueries?.trim();
    const workflowFile: WorkflowFile = {
      meta: {
        name,
        type: 'scrape',
        url,
        formats: checkFormats(options?.formats) || ['markdown'],
        ...(options?.monitor !== undefined ? { monitor: options.monitor } : {}),
        ...(smartQueries ? { promptInstructions: smartQueries } : {}),
        ...buildLlmPayload(options || {}),
      } as any,
      workflow: [],
    };

    const robot = await this.client.createRobot(workflowFile);
    return new Robot(this.client, robot);
  }

  /**
   * Create a scrape robot from a URL. Same as `maxun.scrape(url, options)`:
   *
   *     const robot = await maxun.scrape('https://maxun.dev', { formats: ['markdown', 'html'] });
   */
  async fromUrl(url: string, options: ScrapeCallOptions = {}): Promise<Robot> {
    checkOptions(options, 'maxun.scrape(url, options)');
    checkKeys(options, SCRAPE_KEYS, 'maxun.scrape(url, options)');
    const target = checkUrl(url, 'maxun.scrape(url, options)');
    const { name, ...rest } = options;
    const settings = {
      type: 'scrape',
      url: target,
      formats: checkFormats(rest.formats) || ['markdown'],
      smartQueries: rest.smartQueries?.trim() || undefined,
      monitor: rest.monitor,
      ...buildLlmPayload(rest),
    };
    return await this.createReusing(name, autoName('Scrape', describeUrl(target), settings), (robotName) =>
      this.create(robotName, target, rest)
    );
  }
}
