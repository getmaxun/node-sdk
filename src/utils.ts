/**
 * Small internal helpers shared by the SDK modules.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Config, DEFAULT_BASE_URL } from './types';

const DOCUMENT_MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv': 'text/csv',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

/** Warn the caller about something that will not behave as they expect. */
export function warn(message: string): void {
  process.emitWarning(message, { type: 'MaxunWarning' });
}

export interface ResolvedConfig {
  apiKey: string;
  baseUrl: string;
  teamId?: string;
  timeout: number;
}

/** Fill in a Config from MAXUN_* environment variables. */
export function resolveConfig(config: Config = {}): ResolvedConfig {
  const env = typeof process !== 'undefined' ? process.env : ({} as NodeJS.ProcessEnv);
  const apiKey = config.apiKey || env.MAXUN_API_KEY;
  if (!apiKey) {
    throw new Error('No API key. Pass { apiKey } or set the MAXUN_API_KEY environment variable.');
  }
  return {
    apiKey,
    baseUrl: config.baseUrl || env.MAXUN_BASE_URL || DEFAULT_BASE_URL,
    teamId: config.teamId || env.MAXUN_TEAM_ID || undefined,
    timeout: config.timeout ?? 30000,
  };
}

export function documentContentType(fileName?: string): string {
  return DOCUMENT_MIME_TYPES[path.extname(fileName || '').toLowerCase()] || 'application/pdf';
}

export interface LoadedDocument {
  fileName: string;
  data: Buffer;
  contentType: string;
}

/** Read a file path or Buffer and work out its name and content type. */
export function loadDocument(file: string | Buffer | Uint8Array, fileName?: string): LoadedDocument {
  let name: string;
  let data: Buffer;
  if (typeof file === 'string') {
    name = fileName || path.basename(file);
    data = fs.readFileSync(file);
  } else {
    name = fileName || 'document.pdf';
    data = Buffer.isBuffer(file) ? file : Buffer.from(file);
  }
  const ext = path.extname(name).toLowerCase();
  if (ext && !DOCUMENT_MIME_TYPES[ext]) {
    throw new Error(`Unsupported document type "${ext}". Supported: PDF, DOCX, XLSX, CSV, JPG, PNG.`);
  }
  return { fileName: name, data, contentType: documentContentType(name) };
}

/** Parse the run timestamps the server returns (ISO or toLocaleString output). */
export function parseTime(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}
