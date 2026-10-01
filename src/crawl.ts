/**
 * Crawl - visit many pages of a site, starting from one URL, and scrape each one.
 */

import { CrawlConfig, DEFAULT_CRAWL_CONFIG, Format, LlmOptions, RobotType } from './types';
import { Robot } from './robot/robot';
import { Resource } from './resource';
import { checkFormats, checkOptions } from './scrape';
import { autoName, checkUrl, describeUrl } from './naming';
import { buildLlmPayload } from './client/maxun-client';

export interface CrawlCreateOptions extends LlmOptions {
  /** What to capture from each page. Defaults to ['markdown']. */
  formats?: Format[];
  /** Compare every run with the previous successful run. */
  monitor?: boolean;
}

/**
 * Options for `maxun.crawl(url, options)`: which pages to visit, what to
 * capture from each, and the robot's name.
 */
export interface CrawlCallOptions extends CrawlConfig, CrawlCreateOptions {
  /** Robot name. Defaults to one made from the URL and settings. */
  name?: string;
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

  /**
   * Create a crawl robot from a URL. Same as `maxun.crawl(url, options)`:
   *
   *     const robot = await maxun.crawl('https://docs.example.com', { limit: 20, formats: ['markdown'] });
   *
   * Defaults: `mode: 'domain'`, `limit: 50`, `maxDepth: 3`, `useSitemap`,
   * `followLinks` and `respectRobots` all true.
   */
  async fromUrl(url: string, options: CrawlCallOptions = {}): Promise<Robot> {
    checkOptions(options, 'maxun.crawl(url, options)');
    const target = checkUrl(url, 'maxun.crawl(url, options)');
    const { name, formats, monitor, llmProvider, llmModel, llmApiKey, llmBaseUrl, ...configInput } = options;
    const llm = { llmProvider, llmModel, llmApiKey, llmBaseUrl };
    const crawlConfig: CrawlConfig = { ...DEFAULT_CRAWL_CONFIG };
    for (const [key, value] of Object.entries(configInput)) {
      if (value !== undefined) (crawlConfig as any)[key] = value;
    }
    const settings = {
      type: 'crawl',
      url: target,
      crawlConfig,
      formats: checkFormats(formats),
      monitor,
      ...buildLlmPayload(llm),
    };
    return await this.create(name || autoName('Crawl', describeUrl(target), settings), target, crawlConfig, {
      formats,
      monitor,
      ...llm,
    });
  }
}
