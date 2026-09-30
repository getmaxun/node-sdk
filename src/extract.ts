/**
 * Extract - pull structured data out of pages, with selectors or a plain-English prompt.
 */

import { ExtractBuilder } from './builders/extract-builder';
import { Robot } from './robot/robot';
import { Resource } from './resource';
import { LlmOptions, RobotType } from './types';

export interface PromptExtractOptions extends LlmOptions {
  /** What to extract, in plain English. */
  prompt: string;
  /** Page to extract from. If left out, Maxun searches the web for a suitable page. */
  url?: string;
  /** Robot name. */
  name?: string;
  /** Compare every run with the previous successful run. */
  monitor?: boolean;
}

export class Extract extends Resource {
  protected readonly robotTypes: RobotType[] = ['extract'];

  /**
   * Start building a selector-based robot:
   *
   *     const robot = await maxun.extract('Products')
   *       .navigate('https://example.com/shop')
   *       .captureList({ selector: 'article.product' })
   *       .build();
   */
  create(name: string): ExtractBuilder {
    const builder = new ExtractBuilder(name);
    builder.setExtractor(this);
    return builder;
  }

  /**
   * Save a builder as a robot. Same as `await builder.build()`.
   */
  async build(builder: ExtractBuilder): Promise<Robot> {
    if (builder.getWorkflowArray().length === 0) {
      throw new Error('The robot has no steps. Call navigate(url) and a capture method first.');
    }
    const robot = await this.client.createRobot(builder.getWorkflow() as any);
    return new Robot(this.client, robot);
  }

  /**
   * Create an extraction robot from a natural-language prompt.
   *
   * The four `llm*` options are self-hosted only (where they are required).
   * Maxun Cloud manages the model and rejects them, so leave them unset there.
   */
  async fromPrompt(options: PromptExtractOptions): Promise<Robot> {
    const { name, ...rest } = options;
    const result = await this.client.extractWithLLM({ ...rest, robotName: name });
    return new Robot(this.client, await this.client.getRobot(result.robotId));
  }

  /**
   * Older name for `fromPrompt()` (takes `robotName` instead of `name`).
   */
  async extract(options: {
    url?: string;
    prompt: string;
    llmProvider?: 'anthropic' | 'openai' | 'ollama';
    llmModel?: string;
    llmApiKey?: string;
    llmBaseUrl?: string;
    robotName?: string;
    monitor?: boolean;
  }): Promise<Robot> {
    const { robotName, ...rest } = options;
    return await this.fromPrompt({ ...rest, name: robotName });
  }
}
