/**
 * Scrape - turn a single page into Markdown, HTML, text, links, a summary or screenshots.
 */

import { buildLlmPayload } from './client/maxun-client';
import { Format, LlmOptions, RobotType, SCRAPE_FORMATS, WorkflowFile } from './types';
import { Robot } from './robot/robot';
import { Resource } from './resource';

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
}
