/**
 * Documents - robots that read files instead of web pages:
 * PDF, DOCX, XLSX, CSV, JPG and PNG.
 */

import { createHash } from 'crypto';
import { DOCUMENT_FORMATS, DocumentFormat, LlmOptions, RobotType } from './types';
import { Robot } from './robot/robot';
import { Resource } from './resource';
import { autoName } from './naming';
import { buildLlmPayload } from './client/maxun-client';
import { loadDocument } from './utils';

export interface DocumentOptions extends LlmOptions {
  /** Robot name. Defaults to one made from the file and settings, so sending the same file again returns the same robot. */
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
    if (!prompt || !prompt.trim()) throw new Error('prompt is required');
    const { name, fileName, ...llm } = options;
    const doc = loadDocument(file, fileName);
    const settings = {
      type: 'doc-extract',
      file: createHash('sha1').update(doc.data).digest('hex'),
      prompt: prompt.trim(),
      ...buildLlmPayload(llm),
    };
    return await this.createReusing(name, autoName('Document', doc.fileName, settings), async (robotName) => {
      const { robot } = await this.client.createDocumentExtractRobot(doc.data, prompt, {
        ...llm,
        fileName: doc.fileName,
        robotName,
      });
      return new Robot(this.client, robot);
    });
  }

  /**
   * Create a robot that converts a file to markdown, html, links and/or a summary.
   *
   * `llm*` options: self-hosted Maxun only, needed for `summary`.
   */
  async parse(file: string | Buffer, options: DocumentParseOptions = {}): Promise<Robot> {
    const { name, formats, fileName, ...llm } = options;
    const doc = loadDocument(file, fileName);
    const settings = {
      type: 'doc-parse',
      file: createHash('sha1').update(doc.data).digest('hex'),
      formats: [...(formats && formats.length ? formats : DOCUMENT_FORMATS)].sort(),
      ...buildLlmPayload(llm),
    };
    return await this.createReusing(name, autoName('Parse', doc.fileName, settings), async (robotName) => {
      const { robot } = await this.client.createDocumentParseRobot(doc.data, formats, {
        ...llm,
        fileName: doc.fileName,
        robotName,
      });
      return new Robot(this.client, robot);
    });
  }
}
