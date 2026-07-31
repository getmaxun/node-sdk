/**
 * Search - Main class for the Search SDK
 */

import { Client } from './client/maxun-client';
import { Config, SearchConfig, SearchOptions } from './types';
import { Robot } from './robot/robot';

export class Search {
  private client: Client;

  constructor(config: Config) {
    this.client = new Client(config);
  }

  /**
   * Create a new search robot
   * @param name - Name of the search robot
   * @param searchConfig - Search configuration
   * @returns Promise<Robot>
   */
  async create(name: string, searchConfig: SearchConfig, options?: Omit<SearchOptions, 'name' | 'searchConfig'>): Promise<Robot> {
    if (!searchConfig) {
      throw new Error('Search configuration is required');
    }

    if (!searchConfig.query) {
      throw new Error('Search query is required');
    }

    const robot = await this.client.createSearchRobot({
      name,
      searchConfig,
      ...options,
    });

    return new Robot(this.client, robot);
  }
}
