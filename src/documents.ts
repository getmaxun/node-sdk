/**
 * Documents - robots that read files instead of web pages:
 * PDF, DOCX, XLSX, CSV, JPG and PNG.
 */

import { DocumentFormat, LlmOptions, RobotType } from './types';
import { Robot } from './robot/robot';
import { Resource } from './resource';
import { checkName } from './naming';

export interface DocumentOptions extends LlmOptions {
  /** File name, needed when `file` is a Buffer so the type can be detected (e.g. "invoice.pdf"). */
  fileName?: string;
}

export interface DocumentParseOptions extends DocumentOptions {
  /** Any of markdown, html, links, summary. Defaults to all four. */
  formats?: DocumentFormat[];
}

export class Documents extends Resource {
  protected readonly robotTypes: RobotType[] = ['doc-extract', 'doc-parse'];

  /**
   * Create a robot that pulls the data described by `prompt` out of a file.
   * Read the result from `result.documentData`.
   *
   * `llm*` options: self-hosted Maxun only (required there). Leave unset on Maxun Cloud.
   */
  async extract(name: string, file: string | Buffer, prompt: string, options: DocumentOptions = {}): Promise<Robot> {
    const robotName = checkName(name, 'maxun.documents.extract(name, file, prompt)');
    if (!prompt || !prompt.trim()) throw new Error('prompt is required');
    const { robot } = await this.client.createDocumentExtractRobot(file, prompt, { ...options, robotName });
    return new Robot(this.client, robot);
  }

  /**
   * Create a robot that converts a file to markdown, html, links and/or a summary.
   *
   * `llm*` options: self-hosted Maxun only, needed for `summary`.
   */
  async parse(name: string, file: string | Buffer, options: DocumentParseOptions = {}): Promise<Robot> {
    const robotName = checkName(name, 'maxun.documents.parse(name, file, options)');
    const { formats, ...rest } = options;
    const { robot } = await this.client.createDocumentParseRobot(file, formats, { ...rest, robotName });
    return new Robot(this.client, robot);
  }
}
