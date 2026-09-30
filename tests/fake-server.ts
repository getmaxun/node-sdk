/**
 * A tiny HTTP server that stands in for the Maxun SDK API in tests.
 * Tests register handlers per "METHOD path" and read back what was sent.
 */

import http from 'http';
import { AddressInfo } from 'net';

export interface Recorded {
  method: string;
  path: string;
  query: URLSearchParams;
  headers: http.IncomingHttpHeaders;
  raw: Buffer;
  json: any;
}

type Reply = { status?: number; body?: any; text?: string };
type Handler = Reply | ((req: Recorded) => Reply);

export class FakeMaxun {
  private server: http.Server;
  private handlers = new Map<string, Handler>();
  calls: Recorded[] = [];
  baseUrl = '';

  constructor() {
    this.server = http.createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        const url = new URL(req.url || '/', 'http://x');
        const path = url.pathname.replace(/^\/api\/sdk/, '');
        const raw = Buffer.concat(chunks);
        let json: any;
        try {
          json = raw.length && String(req.headers['content-type']).includes('json') ? JSON.parse(raw.toString()) : undefined;
        } catch {
          json = undefined;
        }
        const recorded: Recorded = { method: req.method || 'GET', path, query: url.searchParams, headers: req.headers, raw, json };
        this.calls.push(recorded);
        const handler = this.handlers.get(`${req.method} ${path}`);
        const reply: Reply = !handler
          ? { status: 500, body: { error: `unhandled ${req.method} ${path}` } }
          : typeof handler === 'function'
            ? handler(recorded)
            : handler;
        const status = reply.status ?? 200;
        if (reply.text !== undefined) {
          res.writeHead(status, { 'Content-Type': 'text/html' });
          res.end(reply.text);
        } else {
          res.writeHead(status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(reply.body ?? {}));
        }
      });
    });
  }

  async start(): Promise<void> {
    await new Promise<void>((resolve) => this.server.listen(0, '127.0.0.1', resolve));
    this.baseUrl = `http://127.0.0.1:${(this.server.address() as AddressInfo).port}/api/sdk`;
  }

  async stop(): Promise<void> {
    this.server.closeAllConnections?.();
    await new Promise<void>((resolve) => this.server.close(() => resolve()));
  }

  on(route: string, handler: Handler): this {
    this.handlers.set(route, handler);
    return this;
  }

  reset(): void {
    this.handlers.clear();
    this.calls = [];
  }

  last(route: string): Recorded {
    const [method, path] = route.split(' ');
    const matches = this.calls.filter((c) => c.method === method && c.path === path);
    if (!matches.length) throw new Error(`no call to ${route}`);
    return matches[matches.length - 1];
  }

  called(route: string): boolean {
    const [method, path] = route.split(' ');
    return this.calls.some((c) => c.method === method && c.path === path);
  }
}

export function robotRecord(id = 'r1', type = 'scrape', meta: Record<string, any> = {}, extra: Record<string, any> = {}) {
  const { workflow, ...rest } = meta;
  return {
    id: `db-${id}`,
    recording_meta: { id, name: rest.name ?? 'Robot', type, ...rest },
    recording: { workflow: workflow ?? [] },
    webhooks: null,
    schedule: null,
    ...extra,
  };
}

export const RUN_RESULT = {
  runId: 'run1',
  status: 'success',
  hasChanges: false,
  changedFormats: [],
  data: {
    textData: { Title: 'Hi' },
    listData: [{ a: 1 }],
    crawlData: [],
    searchData: {},
    markdown: '# Hi',
    promptResult: '42',
  },
  screenshots: [],
};

/** Collect process warnings emitted while `fn` runs. */
export async function captureWarnings(fn: () => Promise<unknown> | unknown): Promise<string[]> {
  const warnings: string[] = [];
  const listener = (w: Error) => {
    if (w.name === 'MaxunWarning') warnings.push(w.message);
  };
  process.on('warning', listener);
  try {
    await fn();
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
  } finally {
    process.off('warning', listener);
  }
  return warnings;
}
