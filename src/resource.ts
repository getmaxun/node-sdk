/**
 * Shared plumbing for Scrape, Crawl, Search, Extract, Documents and Robots.
 */

import { Client } from './client/maxun-client';
import { Robot, MONITORABLE_TYPES } from './robot/robot';
import { Config, RobotData, RobotType } from './types';

/** Fetch every robot once and keep those whose type is in `types` (all if empty). */
export async function listRobots(client: Client, types?: RobotType[] | null): Promise<Robot[]> {
  const records = await client.getRobots();
  const robots = records.map((record) => new Robot(client, record));
  if (!types || types.length === 0) return robots;
  return robots.filter((robot) => types.includes(robot.type as RobotType));
}

/**
 * Base for every resource. Each can be built on its own (`new Scrape()` reads
 * MAXUN_* environment variables, or `new Scrape({ apiKey })`) or reached
 * through `new Maxun()`, which shares one client between them.
 */
export abstract class Resource {
  readonly client: Client;
  /** Robot types this resource lists. `null` means all robots. */
  protected readonly robotTypes: RobotType[] | null = null;

  constructor(configOrClient?: Config | Client) {
    this.client = configOrClient instanceof Client ? configOrClient : new Client(configOrClient);
  }

  protected async afterCreate(robotData: RobotData, monitor?: boolean): Promise<Robot> {
    const robot = new Robot(this.client, robotData);
    if (monitor !== undefined && Boolean(monitor) !== robot.isMonitoring) {
      if (MONITORABLE_TYPES.includes(robot.type as RobotType)) {
        await robot.setMonitoring(Boolean(monitor));
      }
    }
    return robot;
  }

  /**
   * Robots of this kind on your account. `maxun.scrape.list()` is the same call
   * as `maxun.robots.list('scrape')`.
   */
  async list(type?: RobotType): Promise<Robot[]> {
    if (type && this.robotTypes && !this.robotTypes.includes(type)) {
      throw new Error(`${this.constructor.name} robots are ${this.robotTypes.join(', ')}, not ${type}.`);
    }
    return await listRobots(this.client, type ? [type] : this.robotTypes);
  }

  /** A robot by id. */
  async get(robotId: string): Promise<Robot> {
    return new Robot(this.client, await this.client.getRobot(robotId));
  }

  /** Delete a robot by id. */
  async delete(robotId: string): Promise<void> {
    await this.client.deleteRobot(robotId);
  }

  /** Older name for `list()`. */
  async getRobots(): Promise<Robot[]> {
    return await this.list();
  }

  /** Older name for `get()`. */
  async getRobot(robotId: string): Promise<Robot> {
    return await this.get(robotId);
  }

  /** Older name for `delete()`. */
  async deleteRobot(robotId: string): Promise<void> {
    await this.delete(robotId);
  }
}
