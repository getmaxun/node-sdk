/**
 * Maxun - the main entry point.
 */

import { Client } from './client/maxun-client';
import { ExtractBuilder } from './builders/extract-builder';
import { Crawl, CrawlCreateOptions } from './crawl';
import { Documents } from './documents';
import { Extract, PromptExtractOptions } from './extract';
import { Resource } from './resource';
import { Robot } from './robot/robot';
import { Scrape, ScrapeOptions } from './scrape';
import { Search, SearchCreateOptions } from './search';
import { Config, CrawlConfig, NotFoundError, RobotType, SearchConfig } from './types';

/** Every robot on your account, whatever its type. */
export class Robots extends Resource {
  /**
   * All robots, or only those of one type (extract, scrape, crawl, search,
   * doc-extract, doc-parse).
   */
  async list(type?: RobotType): Promise<Robot[]> {
    return await super.list(type);
  }

  /** The robot with this exact name. */
  async find(name: string): Promise<Robot> {
    const robot = (await this.list()).find((r) => (r.name || '').trim() === name.trim());
    if (!robot) throw new NotFoundError(`No robot named "${name}"`, 404);
    return robot;
  }
}

/** `maxun.scrape(name, url, options)` creates a scrape robot; `maxun.scrape.list()` etc. also work. */
export type ScrapeResource = Scrape & ((name: string, url: string, options?: ScrapeOptions) => Promise<Robot>);

/** `maxun.crawl(name, url, crawlConfig?, options?)` creates a crawl robot. */
export type CrawlResource = Crawl &
  ((name: string, url: string, crawlConfig?: CrawlConfig, options?: CrawlCreateOptions) => Promise<Robot>);

/** `maxun.search(name, queryOrConfig, options?)` creates a search robot. */
export type SearchResource = Search &
  ((name: string, searchConfig: SearchConfig | string, options?: SearchCreateOptions) => Promise<Robot>);

/**
 * `maxun.extract(name)` returns a builder for a selector robot;
 * `maxun.extract(name, { prompt, url })` builds a robot from plain English.
 */
export interface ExtractCall {
  (name: string, options: Omit<PromptExtractOptions, 'name'>): Promise<Robot>;
  (name: string, options?: { monitor?: boolean }): ExtractBuilder;
}
export type ExtractResource = Extract & ExtractCall;

/** Make `resource` callable: calling it runs `call`, and every property still works. */
function callable<R extends object, F extends (...args: any[]) => any>(resource: R, call: F): R & F {
  const target = (() => undefined) as any;
  return new Proxy(target, {
    apply: (_target, _thisArg, args) => call(...args),
    get: (_target, prop) => {
      const value = (resource as any)[prop];
      return typeof value === 'function' ? value.bind(resource) : value;
    },
    set: (_target, prop, value) => {
      (resource as any)[prop] = value;
      return true;
    },
    has: (_target, prop) => prop in resource,
    getPrototypeOf: () => Object.getPrototypeOf(resource),
  }) as R & F;
}

/**
 * One connection to Maxun with every feature on it:
 *
 *     const maxun = new Maxun();          // reads MAXUN_API_KEY / MAXUN_BASE_URL
 *     const robot = await maxun.scrape('Home page', 'https://example.com');
 *     const result = await robot.run();
 *     console.log(result.markdown);
 *
 * Options left out are read from MAXUN_API_KEY, MAXUN_BASE_URL and MAXUN_TEAM_ID.
 */
export class Maxun {
  readonly client: Client;
  readonly scrape: ScrapeResource;
  readonly crawl: CrawlResource;
  readonly search: SearchResource;
  readonly extract: ExtractResource;
  readonly documents: Documents;
  readonly robots: Robots;

  constructor(config?: Config) {
    this.client = new Client(config);

    const scrape = new Scrape(this.client);
    const crawl = new Crawl(this.client);
    const search = new Search(this.client);
    const extract = new Extract(this.client);

    this.scrape = callable(scrape, (name: string, url: string, options?: ScrapeOptions) =>
      scrape.create(name, url, options)
    );
    this.crawl = callable(crawl, (name: string, url: string, crawlConfig?: CrawlConfig, options?: CrawlCreateOptions) =>
      crawl.create(name, url, crawlConfig, options)
    );
    this.search = callable(search, (name: string, config: SearchConfig | string, options?: SearchCreateOptions) =>
      search.create(name, config, options)
    );
    this.extract = callable(extract, ((name: string, options?: any) => {
      if (options && options.prompt !== undefined) {
        return extract.fromPrompt({ ...options, name });
      }
      const { monitor, ...rest } = options || {};
      if (Object.keys(rest).length > 0) {
        throw new TypeError(
          'url and llm* options go with { prompt }; for a selector robot use .navigate(url) on the builder.'
        );
      }
      const builder = extract.create(name);
      if (monitor !== undefined) builder.monitorChanges(monitor);
      return builder;
    }) as ExtractCall);
    this.documents = new Documents(this.client);
    this.robots = new Robots(this.client);
  }

  /** Account info for this API key. */
  async status(): Promise<Record<string, any>> {
    return await this.client.getStatus();
  }
}
