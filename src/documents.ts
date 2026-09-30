/**
 * Documents - robots that read files instead of web pages:
 * PDF, DOCX, XLSX, CSV, JPG and PNG.
 */

import { DocumentFormat, LlmOptions, RobotType } from './types';
import { Robot } from './robot/robot';
import { Resource } from './resource';

export interface DocumentOptions extends LlmOptions {
  /** Robot name. */
  name?: string;
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
  async extract(file: string | Buffer, prompt: string, options: DocumentOptions = {}): Promise<Robot> {
    const { name, ...rest } = options;
    const { robot } = await this.client.createDocumentExtractRobot(file, prompt, { ...rest, robotName: name });
    return new Robot(this.client, robot);
  }

  /**
   * Create a robot that converts a file to markdown, html, links and/or a summary.
   *
   * `llm*` options: self-hosted Maxun only, needed for `summary`.
   */
  async parse(file: string | Buffer, options: DocumentParseOptions = {}): Promise<Robot> {
    const { name, formats, ...rest } = options;
    const { robot } = await this.client.createDocumentParseRobot(file, formats, { ...rest, robotName: name });
    return new Robot(this.client, robot);
  }
}
