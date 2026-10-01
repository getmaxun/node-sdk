/**
 * Search - search the web (DuckDuckGo) and optionally scrape every result.
 */

import { Format, LlmOptions, RobotType, SearchConfig, SearchMode, SearchTimeRange } from './types';
import { Robot } from './robot/robot';
import { Resource } from './resource';
import { checkFormats, checkKeys, checkOptions, SEARCH_KEYS } from './scrape';
import { checkName } from './naming';
import { warn } from './utils';

export interface SearchCreateOptions extends LlmOptions {
  /** What to capture from each result in scrape mode. Defaults to ['markdown']. */
  formats?: Format[];
}

/** Options for `maxun.search(name, query, options)`. */
export interface SearchCallOptions extends SearchCreateOptions {
  /** `'discover'` (default) returns titles, URLs and snippets; `'scrape'` also opens and scrapes every result. */
  mode?: SearchMode;
  /** Number of results (default 10). */
  limit?: number;
  /** Only results from the past day, week, month or year. */
  timeRange?: SearchTimeRange;
}

export class Search extends Resource {
  protected readonly robotTypes: RobotType[] = ['search'];

  /**
   * Create a search robot. Run it with `await robot.run()` and read `result.searchData`.
   *
   * @param searchConfig - A SearchConfig, or just the query string.
   *   `mode: 'discover'` (default) returns titles/URLs/snippets only;
   *   `mode: 'scrape'` also scrapes each result.
   */
  async create(name: string, searchConfig: SearchConfig | string, options?: SearchCreateOptions): Promise<Robot> {
    if (!searchConfig) {
      throw new Error('Search configuration is required');
    }
    const input: SearchConfig = typeof searchConfig === 'string' ? { query: searchConfig } : searchConfig;
    if (!input.query) {
      throw new Error('Search query is required');
    }

    const { timeRange, ...rest } = input;
    const given = Object.fromEntries(Object.entries(rest).filter(([, value]) => value !== undefined));
    const config: SearchConfig = { mode: 'discover', limit: 10, ...given } as SearchConfig;
    if (config.mode !== 'discover' && config.mode !== 'scrape') {
      throw new Error("mode must be 'discover' or 'scrape'");
    }
    if (timeRange) {
      config.filters = { ...(config.filters || {}), timeRange };
    }
    if (options?.formats && config.mode === 'discover') {
      warn("formats only apply in mode 'scrape'; a discover search returns result links only. Pass mode: 'scrape' to scrape each result.");
    }

    const { formats, ...llm } = options || {};
    const robot = await this.client.createSearchRobot({
      name,
      searchConfig: config,
      ...(formats ? { formats: checkFormats(formats) } : {}),
      ...llm,
    });

    return new Robot(this.client, robot);
  }

  /**
   * Create a search robot. Same as `maxun.search(name, query, options)`:
   *
   *     const robot = await maxun.search('AI news', 'AI model releases', { mode: 'discover', timeRange: 'week' });
   */
  async fromQuery(name: string, query: string, options: SearchCallOptions = {}): Promise<Robot> {
    const call = 'maxun.search(name, query, options)';
    const robotName = checkName(name, call);
    if (typeof query !== 'string' || !query.trim()) {
      throw new Error("maxun.search(name, query, options) needs a search query, e.g. maxun.search('AI news', 'AI model releases').");
    }
    checkOptions(options, call);
    checkKeys(options, SEARCH_KEYS, call);
    const { mode = 'discover', limit = 10, timeRange, formats, ...llm } = options;
    const searchConfig: SearchConfig = { query: query.trim(), mode, limit, ...(timeRange ? { timeRange } : {}) };
    return await this.create(robotName, searchConfig, { formats, ...llm });
  }
}
