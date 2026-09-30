/**
 * Crawl - visit many pages of a site, starting from one URL, and scrape each one.
 */

import { CrawlConfig, DEFAULT_CRAWL_CONFIG, Format, LlmOptions, RobotType } from './types';
import { Robot } from './robot/robot';
import { Resource } from './resource';
import { checkFormats } from './scrape';

export interface CrawlCreateOptions extends LlmOptions {
  /** What to capture from each page. Defaults to ['markdown']. */
  formats?: Format[];
  /** Compare every run with the previous successful run. */
  monitor?: boolean;
}

export class Crawl extends Resource {
  protected readonly robotTypes: RobotType[] = ['crawl'];

  /**
   * Create a crawl robot. Run it with `await robot.run()` and read
   * `result.crawlData` (one entry per page).
   *
   * @param crawlConfig - Defaults to the same domain, up to 50 pages, 3 links
   *   deep, using the sitemap. Anything you pass overrides those defaults.
   */
  async create(name: string, url: string, crawlConfig?: CrawlConfig, options?: CrawlCreateOptions): Promise<Robot> {
    if (!url) {
      throw new Error('URL is required');
    }

    const config: CrawlConfig = { ...DEFAULT_CRAWL_CONFIG };
    for (const [key, value] of Object.entries(crawlConfig || {})) {
      if (value !== undefined) (config as any)[key] = value;
    }

    const { monitor, formats, ...llm } = options || {};
    const robot = await this.client.createCrawlRobot(url, {
      name,
      crawlConfig: config,
      ...(formats ? { formats: checkFormats(formats) } : {}),
      ...llm,
    });

    return await this.afterCreate(robot, monitor);
  }
}
