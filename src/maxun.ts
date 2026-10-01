/**
 * Maxun - the main entry point.
 */

import { inspect } from 'util';
import { Client } from './client/maxun-client';
import { ExtractBuilder } from './builders/extract-builder';
import { Crawl, CrawlCallOptions } from './crawl';
import { Documents } from './documents';
import { Extract, ExtractBuilderCallOptions, ExtractPromptCallOptions } from './extract';
import { Resource } from './resource';
import { Robot } from './robot/robot';
import { Scrape, ScrapeCallOptions } from './scrape';
import { Search, SearchCallOptions } from './search';
import { Config, NotFoundError, RobotType } from './types';

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
export type ScrapeResource = Scrape & ((name: string, url: string, options?: ScrapeCallOptions) => Promise<Robot>);

/** `maxun.crawl(name, url, options)` creates a crawl robot. */
export type CrawlResource = Crawl & ((name: string, url: string, options?: CrawlCallOptions) => Promise<Robot>);

/** `maxun.search(name, query, options)` creates a search robot. */
export type SearchResource = Search & ((name: string, query: string, options?: SearchCallOptions) => Promise<Robot>);

/**
 * `maxun.extract(name, url, { prompt })` or `maxun.extract(name, { prompt })`
 * builds a robot from plain English; `maxun.extract(name, url)` returns a
 * builder for a selector robot that starts on `url`.
 */
export interface ExtractCall {
  (name: string, url: string, options: ExtractPromptCallOptions): Promise<Robot>;
  (name: string, options: ExtractPromptCallOptions): Promise<Robot>;
  (name: string, url: string, options?: ExtractBuilderCallOptions): ExtractBuilder;
}
export type ExtractResource = Extract & ExtractCall;

/** Make `resource` callable: calling it runs `call`, and every property still works. */
function callable<R extends object, F extends (...args: any[]) => any>(resource: R, call: F): R & F {
  const target = (() => undefined) as any;
  return new Proxy(target, {
    apply: (_target, _thisArg, args) => call(...args),
    get: (target, prop) => {
      if (prop === inspect.custom) return () => resource;
      if (prop === 'constructor') return (resource as any).constructor;
      if (!(prop in resource) && prop in Function.prototype) return Reflect.get(target, prop);
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
 *     const robot = await maxun.scrape('Maxun home', 'https://maxun.dev', { formats: ['markdown', 'html'] });
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

    const rejectExtra = (call: string, extra: unknown[]) => {
      if (extra.length > 0) throw new TypeError(`${call} takes at most three arguments: the name, the target and an options object.`);
    };
    this.scrape = callable(scrape, async (name: string, url: string, options?: ScrapeCallOptions, ...extra: unknown[]) => {
      rejectExtra('maxun.scrape(name, url, options)', extra);
      return scrape.fromUrl(name, url, options);
    });
    this.crawl = callable(crawl, async (name: string, url: string, options?: CrawlCallOptions, ...extra: unknown[]) => {
      rejectExtra('maxun.crawl(name, url, options)', extra);
      return crawl.fromUrl(name, url, options);
    });
    this.search = callable(search, async (name: string, query: string, options?: SearchCallOptions, ...extra: unknown[]) => {
      rejectExtra('maxun.search(name, query, options)', extra);
      return search.fromQuery(name, query, options);
    });
    this.extract = callable(extract, ((name: string, urlOrOptions?: any, options?: any, ...extra: unknown[]): any => {
      rejectExtra('maxun.extract(name, url, options)', extra);
      if (urlOrOptions && typeof urlOrOptions === 'object') {
        if (urlOrOptions.prompt === undefined) {
          throw new TypeError('maxun.extract(name, options) needs { prompt }; for a selector robot pass the URL: maxun.extract(name, url).');
        }
        return extract.fromPromptCall(name, undefined, urlOrOptions);
      }
      if (options && typeof options === 'object' && options.prompt !== undefined) {
        return extract.fromPromptCall(name, urlOrOptions, options);
      }
      return extract.fromUrl(name, urlOrOptions, options);
    }) as ExtractCall);
    this.documents = new Documents(this.client);
    this.robots = new Robots(this.client);
  }

  /** Account info for this API key. */
  async status(): Promise<Record<string, any>> {
    return await this.client.getStatus();
  }
}
