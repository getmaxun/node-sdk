/**
 * Extract - pull structured data out of pages, with selectors or a plain-English prompt.
 */

import { ExtractBuilder } from './builders/extract-builder';
import { Robot } from './robot/robot';
import { Resource } from './resource';
import { LlmOptions, RobotType } from './types';
import { autoName, checkUrl, describeUrl, shorten } from './naming';
import { buildLlmPayload } from './client/maxun-client';
import { checkKeys, checkOptions, PROMPT_KEYS } from './scrape';

/** Options for `maxun.extract(url, { prompt })`, or `maxun.extract({ prompt, url? })`. */
export interface ExtractPromptCallOptions extends LlmOptions {
  /** What to extract, in plain English. */
  prompt: string;
  /** Robot name. Defaults to one made from the URL (or prompt) and settings. */
  name?: string;
  /** Compare every run with the previous successful run. */
  monitor?: boolean;
}

/** Options for `maxun.extract(url, options)` without a prompt (a selector robot). */
export interface ExtractBuilderCallOptions {
  /** Robot name. Defaults to one made from the URL and the robot's steps. */
  name?: string;
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
      const { name, robotType, ...meta } = builder.getMeta() as any;
      const settings = { meta: { ...meta, type: robotType || meta.type || 'extract' }, workflow: builder.getWorkflowArray() };
      builder.setName(autoName('Extract', describeUrl(builder.startUrl || ''), settings));
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
   * Start a selector robot on `url`. Same as `maxun.extract(url, options)`:
   *
   *     const robot = await maxun.extract('https://example.com').captureText({ Title: 'h1' }).build();
   */
  fromUrl(url: string, options: ExtractBuilderCallOptions = {}): ExtractBuilder {
    checkOptions(options, 'maxun.extract(url, options)');
    const { name, monitor, ...rest } = options as ExtractBuilderCallOptions & Record<string, unknown>;
    if (Object.keys(rest).length > 0) {
      throw new TypeError(
        `maxun.extract(url, options) got ${Object.keys(rest).join(', ')}; llm* settings go with { prompt }, ` +
          'a selector robot does not use an LLM.'
      );
    }
    const builder = new ExtractBuilder(name);
    builder.setExtractor(this);
    builder.navigate(checkUrl(url, 'maxun.extract(url)'));
    if (monitor !== undefined) builder.monitorChanges(monitor);
    return builder;
  }

  /**
   * Create a robot from a prompt, naming it automatically when no name is
   * given. Used by `maxun.extract(url, { prompt })` and `maxun.extract({ prompt })`.
   */
  async fromPromptCall(url: string | undefined, options: ExtractPromptCallOptions): Promise<Robot> {
    checkKeys(options, PROMPT_KEYS, url === undefined ? 'maxun.extract({ prompt })' : 'maxun.extract(url, { prompt })');
    const target = url === undefined ? undefined : checkUrl(url, 'maxun.extract(url, { prompt })');
    if (!options.prompt || !options.prompt.trim()) throw new Error('prompt is required');
    const { name, prompt, monitor, ...llm } = options;
    const settings = { type: 'extract', prompt: prompt.trim(), url: target, monitor, ...buildLlmPayload(llm) };
    const subject = target ? describeUrl(target) : shorten(prompt);
    return await this.createReusing(name, autoName('Extract', subject, settings), (robotName) =>
      this.fromPrompt({ prompt: prompt.trim(), url: target, monitor, ...llm, name: robotName })
    );
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
