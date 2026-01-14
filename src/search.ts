/**
 * Search - Main class for the Search SDK
 */

import { Client } from './client/maxun-client';
import { Config, SearchConfig } from './types';
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
  async create(name: string, searchConfig: SearchConfig): Promise<Robot> {
    if (!searchConfig) {
      throw new Error('Search configuration is required');
    }

    if (!searchConfig.query) {
      throw new Error('Search query is required');
    }

    const robot = await this.client.createSearchRobot({
      name,
      searchConfig,
    });

    return new Robot(this.client, robot);
  }
}
