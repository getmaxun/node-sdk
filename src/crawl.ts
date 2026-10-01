/**
 * Crawl - visit many pages of a site, starting from one URL, and scrape each one.
 */

import { CrawlConfig, DEFAULT_CRAWL_CONFIG, Format, LlmOptions, RobotType } from './types';
import { Robot } from './robot/robot';
import { Resource } from './resource';
import { checkFormats, checkKeys, checkOptions, CRAWL_KEYS } from './scrape';
import { checkName, checkUrl } from './naming';

export interface CrawlCreateOptions extends LlmOptions {
  /** What to capture from each page. Defaults to ['markdown']. */
  formats?: Format[];
  /** Compare every run with the previous successful run. */
  monitor?: boolean;
}

/**
 * Options for `maxun.crawl(name, url, options)`: which pages to visit and what
 * to capture from each.
 */
export interface CrawlCallOptions extends CrawlConfig, CrawlCreateOptions {}

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
   * Create a crawl robot. Same as `maxun.crawl(name, url, options)`:
   *
   *     const robot = await maxun.crawl('Docs', 'https://docs.example.com', { limit: 20, formats: ['markdown'] });
   *
   * Defaults: `mode: 'domain'`, `limit: 50`, `maxDepth: 3`, `useSitemap`,
   * `followLinks` and `respectRobots` all true.
   */
  async fromUrl(name: string, url: string, options: CrawlCallOptions = {}): Promise<Robot> {
    const call = 'maxun.crawl(name, url, options)';
    const target = checkUrl(url, call, name);
    const robotName = checkName(name, call);
    checkOptions(options, call);
    checkKeys(options, CRAWL_KEYS, call);
    const { formats, monitor, llmProvider, llmModel, llmApiKey, llmBaseUrl, ...configInput } = options;
    checkFormats(formats);
    const crawlConfig: CrawlConfig = { ...DEFAULT_CRAWL_CONFIG };
    for (const [key, value] of Object.entries(configInput)) {
      if (value !== undefined) (crawlConfig as any)[key] = value;
    }
    return await this.create(robotName, target, crawlConfig, {
      formats,
      monitor,
      llmProvider,
      llmModel,
      llmApiKey,
      llmBaseUrl,
    });
  }
}
