/**
 * Extract - pull structured data out of pages, with selectors or a plain-English prompt.
 */

import { ExtractBuilder } from './builders/extract-builder';
import { Robot } from './robot/robot';
import { Resource } from './resource';
import { LlmOptions, RobotType } from './types';
import { checkName, checkUrl, looksLikeUrl } from './naming';
import { checkKeys, checkOptions, PROMPT_KEYS } from './scrape';

/** Options for `maxun.extract(name, url, { prompt })` or `maxun.extract(name, { prompt })`. */
export interface ExtractPromptCallOptions extends LlmOptions {
  /** What to extract, in plain English. */
  prompt: string;
  /** Compare every run with the previous successful run. */
  monitor?: boolean;
}

/** Options for `maxun.extract(name, url, options)` without a prompt (a selector robot). */
export interface ExtractBuilderCallOptions {
  /** Compare every run with the previous successful run. */
  monitor?: boolean;
}

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
    if (!builder.getMeta().name) {
      throw new Error('The robot needs a name: maxun.extract(name, url) or extract.create(name).');
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
   * Start a selector robot on `url`. Same as `maxun.extract(name, url, options)`:
   *
   *     const robot = await maxun.extract('Titles', 'https://example.com').captureText({ Title: 'h1' }).build();
   */
  fromUrl(name: string, url: string, options: ExtractBuilderCallOptions = {}): ExtractBuilder {
    const call = 'maxun.extract(name, url, options)';
    const target = checkUrl(url, call, name);
    const robotName = checkName(name, call);
    checkOptions(options, call);
    const { monitor, ...rest } = options as ExtractBuilderCallOptions & Record<string, unknown>;
    if (Object.keys(rest).length > 0) {
      throw new TypeError(
        `${call} got ${Object.keys(rest).join(', ')}; llm* settings go with { prompt }, a selector robot does not use an LLM.`
      );
    }
    const builder = this.create(robotName);
    builder.navigate(target);
    if (monitor !== undefined) builder.monitorChanges(monitor);
    return builder;
  }

  /**
   * Create a robot from a prompt. Used by `maxun.extract(name, url, { prompt })`
   * and `maxun.extract(name, { prompt })`.
   */
  async fromPromptCall(name: string, url: string | undefined, options: ExtractPromptCallOptions): Promise<Robot> {
    const call = url === undefined ? 'maxun.extract(name, { prompt })' : 'maxun.extract(name, url, { prompt })';
    if (url === undefined && looksLikeUrl(name)) {
      throw new TypeError(`maxun.extract(name, url, { prompt }) takes the robot name first, e.g. maxun.extract('My robot', '${name}', { prompt }).`);
    }
    const robotName = checkName(name, call);
    const target = url === undefined ? undefined : checkUrl(url, call);
    checkKeys(options, PROMPT_KEYS, call);
    if (!options.prompt || !options.prompt.trim()) throw new Error('prompt is required');
    const { prompt, monitor, ...llm } = options;
    return await this.fromPrompt({ prompt: prompt.trim(), url: target, monitor, ...llm, name: robotName });
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
