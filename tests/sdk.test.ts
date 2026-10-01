/**
 * Checks every public method sends the right request to the Maxun SDK API,
 * over a real HTTP connection. Expected endpoints, bodies and response shapes
 * come from the server's routes (server/src/api/sdk.ts in getmaxun/maxun).
 */

import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { FakeMaxun, robotRecord, RUN_RESULT, captureWarnings } from './fake-server';
import {
  Maxun,
  Scrape,
  Crawl,
  Search,
  Extract,
  Robot,
  RunResult,
  MaxunError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RunFailedError,
} from '../src';

const server = new FakeMaxun();
let maxun: Maxun;

before(async () => {
  await server.start();
});
after(async () => {
  await server.stop();
});
beforeEach(() => {
  server.reset();
  maxun = new Maxun({ apiKey: 'k', baseUrl: server.baseUrl });
});

// ---------- configuration ----------

describe('configuration', () => {
  test('reads MAXUN_* environment variables', async () => {
    const saved = { ...process.env };
    process.env.MAXUN_API_KEY = 'env-key';
    process.env.MAXUN_BASE_URL = server.baseUrl;
    process.env.MAXUN_TEAM_ID = 'team';
    try {
      server.on('GET /status', { body: { email: 'a@b.c' } });
      const status = await new Maxun().status();
      assert.equal(status.email, 'a@b.c');
      assert.equal(server.last('GET /status').headers['x-api-key'], 'env-key');
      assert.equal(server.last('GET /status').headers['x-team-id'], 'team');
    } finally {
      process.env = saved;
    }
  });

  test('requires an API key', () => {
    const saved = process.env.MAXUN_API_KEY;
    delete process.env.MAXUN_API_KEY;
    try {
      assert.throws(() => new Maxun({ baseUrl: server.baseUrl }), /MAXUN_API_KEY/);
    } finally {
      if (saved !== undefined) process.env.MAXUN_API_KEY = saved;
    }
  });
});

// ---------- creating robots ----------

describe('creating robots', () => {
  test('scrape takes the name, the URL and options', async () => {
    server.on('POST /robots', { status: 201, body: { data: robotRecord() } });
    const robot = await maxun.scrape('Maxun home', 'https://maxun.dev', { formats: ['markdown', 'html'], monitor: true });
    assert.deepEqual(server.last('POST /robots').json.meta, {
      name: 'Maxun home', type: 'scrape', url: 'https://maxun.dev', formats: ['markdown', 'html'], compareRuns: true,
    });
    assert.equal(robot.id, 'r1');
    assert.ok(maxun.scrape instanceof Scrape);
    await maxun.scrape('Q&A', 'https://maxun.dev', { smartQueries: ' Price? ' });
    assert.equal(server.last('POST /robots').json.meta.promptInstructions, 'Price?');
    await maxun.scrape.create('S2', 'https://e.com');
    assert.equal(server.last('POST /robots').json.meta.name, 'S2');
  });

  test('names are required and the argument order is checked', async () => {
    await assert.rejects((maxun.scrape as any)('https://maxun.dev'), /robot name first/);
    await assert.rejects((maxun.scrape as any)('https://maxun.dev', { formats: ['markdown'] }), /robot name first/);
    await assert.rejects(maxun.scrape('', 'https://maxun.dev'), /needs a robot name/);
    await assert.rejects(maxun.scrape('Home', 'My robot'), /second argument/);
    await assert.rejects((maxun.scrape as any)('Home', 'https://e.com', {}, {}), /at most three/);
    await assert.rejects(maxun.scrape('Home', 'https://e.com', { formats: ['pdf' as any] }), /Invalid formats/);
    await assert.rejects(maxun.scrape('Home', 'https://e.com', { name: 'x' } as any), /unknown option: name/);
    await assert.rejects((maxun.extract as any)('https://e.com', { prompt: 'x' }), /robot name first/);
    assert.throws(() => (maxun.extract as any)('https://e.com'), /robot name first/);
    await assert.rejects((maxun.search as any)('AI news'), /needs a search query/);
    await assert.rejects(maxun.documents.extract('', Buffer.from('x'), 'totals', { fileName: 'a.pdf' }), /needs a robot name/);
    assert.equal(server.calls.length, 0);
  });

  test('crawl takes the name, the URL and flat options', async () => {
    server.on('POST /crawl', { status: 201, body: { data: robotRecord('r1', 'crawl') } });
    await maxun.crawl('Docs', 'https://docs.e.com', { limit: 5, maxDepth: 2, includePaths: ['/blog/*'], formats: ['text'] });
    const sent = server.last('POST /crawl').json;
    assert.equal(sent.name, 'Docs');
    assert.equal(sent.url, 'https://docs.e.com');
    assert.deepEqual(sent.formats, ['text']);
    assert.deepEqual(sent.crawlConfig, {
      mode: 'domain', limit: 5, maxDepth: 2, includePaths: ['/blog/*'],
      respectRobots: true, useSitemap: true, followLinks: true,
    });
    await maxun.crawl('Docs 2', 'https://e.com');
    assert.deepEqual(server.last('POST /crawl').json.crawlConfig, {
      mode: 'domain', limit: 50, maxDepth: 3, respectRobots: true, useSitemap: true, followLinks: true,
    });
    await assert.rejects(maxun.crawl('Docs', 'https://e.com', { max_depth: 1 } as any), /unknown option: max_depth/);
  });

  test('crawl monitoring', async () => {
    server.on('POST /crawl', { status: 201, body: { data: robotRecord('r1', 'crawl') } });
    server.on('PUT /robots/r1', { body: { data: robotRecord('r1', 'crawl', { compareRuns: true }) } });
    const robot = await maxun.crawl('Docs', 'https://e.com', { monitor: true });
    assert.deepEqual(server.last('PUT /robots/r1').json, { meta: { compareRuns: true } });
    assert.equal(robot.isMonitoring, true);
  });

  test('search takes the name, the query and flat options', async () => {
    server.on('POST /search', { status: 201, body: { data: robotRecord('r1', 'search') } });
    await maxun.search('AI news', 'AI model releases', { mode: 'discover', timeRange: 'week', limit: 5 });
    const sent = server.last('POST /search').json;
    assert.equal(sent.name, 'AI news');
    assert.deepEqual(sent.searchConfig, { query: 'AI model releases', mode: 'discover', limit: 5, filters: { timeRange: 'week' } });
    await maxun.search('Plain', 'just a query', { mode: undefined, limit: undefined });
    assert.deepEqual(server.last('POST /search').json.searchConfig, { query: 'just a query', mode: 'scrape', limit: 10 });
    await assert.rejects(maxun.search('AI', 'q', { query: 'AI' } as any), /unknown option: query/);
  });

  test('extract(name, url) starts a selector robot on that page', async () => {
    server.on('POST /robots', { status: 201, body: { data: robotRecord('r1', 'extract') } });
    const robot = await maxun
      .extract('Titles', 'https://e.com', { monitor: true })
      .captureText({ Title: 'h1' })
      .captureList({ selector: 'li', maxItems: 5, pagination: { type: 'none' } })
      .scroll(2)
      .build();
    const sent = server.last('POST /robots').json;
    assert.deepEqual(sent.meta, { name: 'Titles', type: 'extract', compareRuns: true });
    const [main, blank] = sent.workflow;
    assert.equal(blank.where.url, 'about:blank');
    assert.deepEqual(blank.what[0], { action: 'goto', args: ['https://e.com'] });
    assert.deepEqual(main.what.map((a: any) => a.action), ['scrapeSchema', 'scrapeList', 'scroll']);
    assert.deepEqual(main.what[1].args[0], { itemSelector: 'li', maxItems: 5, pagination: { type: 'none', selector: null } });
    assert.deepEqual(main.what[2].args, [2]);
    assert.equal(robot.type, 'extract');
    assert.equal((await maxun.extract('Awaited', 'https://e.com').captureText({ T: 'h1' })).id, 'r1');
    assert.throws(() => (maxun.extract as any)('Titles'), /needs a URL/);
    assert.throws(() => (maxun.extract as any)('Titles', 'https://e.com', { llmProvider: 'ollama' }), TypeError);
    assert.throws(() => new Extract({ apiKey: 'k', baseUrl: server.baseUrl }).create('E').captureText({ T: 'h1' }), /navigate/);
  });

  test('extract with a prompt, with or without a URL', async () => {
    server.on('POST /extract/llm', { body: { success: true, data: { robotId: 'r9' } } });
    server.on('GET /robots/r9', { body: { data: robotRecord('r9', 'extract') } });
    const robot = await maxun.extract('Prices', 'https://e.com', { prompt: ' get prices ', llmProvider: 'ollama' });
    assert.deepEqual(server.last('POST /extract/llm').json, {
      prompt: 'get prices', url: 'https://e.com', robotName: 'Prices', llmProvider: 'ollama',
    });
    assert.equal(robot.id, 'r9');
    await maxun.extract('YC', { prompt: 'YC companies and batches' });
    assert.deepEqual(server.last('POST /extract/llm').json, { prompt: 'YC companies and batches', robotName: 'YC' });
    await maxun.extract.extract({ prompt: 'get prices', llmProvider: 'ollama', robotName: 'P' });
    assert.deepEqual(server.last('POST /extract/llm').json, { prompt: 'get prices', robotName: 'P', llmProvider: 'ollama' });
    await assert.rejects(maxun.extract('X', { prompt: 'x', llmProvider: 'openai' }), /llmApiKey/);
    await assert.rejects(maxun.extract('X', 'https://e.com', { prompt: 'x', url: 'y' } as any), /unknown option: url/);
  });
});

// ---------- documents ----------

describe('documents', () => {
  const cases: Array<[string, string]> = [
    ['a.pdf', 'application/pdf'],
    ['a.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ['a.png', 'image/png'],
    ['a.JPG', 'image/jpeg'],
    ['a.csv', 'text/csv'],
  ];
  for (const [name, mime] of cases) {
    test(`uploads ${name} as ${mime}`, async () => {
      server.on('POST /robots/document', { status: 201, body: { success: true, data: robotRecord('d1', 'doc-extract') } });
      const robot = await maxun.documents.extract('D', Buffer.from('bytes'), 'totals', { fileName: name });
      const raw = server.last('POST /robots/document').raw.toString();
      assert.ok(raw.includes(`Content-Type: ${mime}`), raw);
      assert.ok(raw.includes('name="prompt"') && raw.includes('name="robotName"'));
      assert.equal(robot.type, 'doc-extract');
    });
  }

  test('parse: formats, path input and validation', async () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'maxun-')), 'report.xlsx');
    fs.writeFileSync(file, 'x');
    server.on('POST /robots/document-parse', { status: 201, body: { data: robotRecord('p1', 'doc-parse') } });
    await maxun.documents.parse('P', file, { formats: ['markdown', 'links'] });
    assert.equal(server.last('POST /robots/document-parse').raw.toString().split('name="outputFormats[]"').length - 1, 2);
    await maxun.documents.parse('P', file);
    assert.ok(!server.last('POST /robots/document-parse').raw.toString().includes('outputFormats'));
    await assert.rejects(maxun.documents.parse('P', file, { formats: ['text' as any] }), /Invalid document formats/);
    await assert.rejects(maxun.documents.parse('P', Buffer.from('x'), { fileName: 'a.txt' }), /Unsupported document type/);
  });

  test('document errors are MaxunErrors', async () => {
    server.on('POST /robots/document', { status: 409, body: { error: 'A robot named "D" already exists.' } });
    await assert.rejects(maxun.documents.extract('D', Buffer.from('x'), 'p', { fileName: 'a.pdf' }), ConflictError);
  });
});

// ---------- listing ----------

describe('listing robots', () => {
  const all = [
    robotRecord('a', 'scrape'), robotRecord('b', 'extract'), robotRecord('c', 'doc-parse'),
    robotRecord('d', 'crawl'), robotRecord('e', 'search', { robotType: 'search' }),
  ];

  test('each resource lists its own type, the same as robots.list(type)', async () => {
    server.on('GET /robots', { body: { data: all } });
    const ids = async (p: Promise<Robot[]>) => (await p).map((r) => r.id);
    assert.deepEqual(await ids(maxun.scrape.list()), ['a']);
    assert.deepEqual(await ids(maxun.extract.list()), ['b']);
    assert.deepEqual(await ids(maxun.extract.getRobots()), ['b']);
    assert.deepEqual(await ids(maxun.crawl.list()), ['d']);
    assert.deepEqual(await ids(maxun.search.list()), ['e']);
    assert.deepEqual(await ids(maxun.documents.list()), ['c']);
    assert.equal((await maxun.robots.list()).length, 5);
    for (const t of ['scrape', 'extract', 'crawl', 'search', 'doc-parse'] as const) {
      assert.deepEqual(await ids(maxun.robots.list(t)), await ids(maxun[t === 'doc-parse' ? 'documents' : t].list()));
    }
    await assert.rejects(maxun.scrape.list('crawl'), /not crawl/);
  });

  test('find by name', async () => {
    server.on('GET /robots', { body: { data: [robotRecord('a', 'scrape', { name: 'Alpha' })] } });
    assert.equal((await maxun.robots.find('Alpha')).id, 'a');
    await assert.rejects(maxun.robots.find('Beta'), NotFoundError);
  });
});

// ---------- running ----------

describe('running robots', () => {
  test('run sends per-run options and returns a RunResult', async () => {
    server.on('GET /robots/r1', { body: { data: robotRecord() } });
    server.on('POST /robots/r1/execute', { body: { data: RUN_RESULT } });
    const robot = await maxun.robots.get('r1');
    const result = await robot.run({ formats: ['markdown'], smartQueries: 'price?' });
    assert.deepEqual(server.last('POST /robots/r1/execute').json, { formats: ['markdown'], promptInstructions: 'price?' });
    assert.ok(result instanceof RunResult);
    assert.equal(result.markdown, '# Hi');
    assert.deepEqual(result.textData, { Title: 'Hi' });
    assert.deepEqual(result.listData, [{ a: 1 }]);
    assert.equal(result.smartQueryResult, '42');
    assert.deepEqual(result.data.listData, [{ a: 1 }]);
    assert.equal(result.runId, 'run1');
    assert.equal(JSON.parse(JSON.stringify(result)).runId, 'run1');
  });

  test('deprecated run options warn and are not sent', async () => {
    server.on('GET /robots/r1', { body: { data: robotRecord() } });
    server.on('POST /robots/r1/execute', { body: { data: RUN_RESULT } });
    const robot = await maxun.robots.get('r1');
    const warnings = await captureWarnings(() => robot.run({ params: { a: 1 }, timeout: 60000 }));
    assert.ok(warnings.some((w) => /ignored/.test(w)));
    assert.deepEqual(server.last('POST /robots/r1/execute').json, {});
  });

  test('failed runs raise RunFailedError with the server message', async () => {
    server.on('GET /robots/r1', { body: { data: robotRecord() } });
    server.on('POST /robots/r1/execute', { status: 500, body: { error: 'Failed to execute robot', message: 'Run failed' } });
    const robot = await maxun.robots.get('r1');
    await assert.rejects(robot.run(), (e: any) => e instanceof RunFailedError && /Run failed/.test(e.message));
  });

  test('links and document data are read from the stored run', async () => {
    server.on('GET /robots/r1', { body: { data: robotRecord('r1', 'scrape', { formats: ['markdown', 'links'] }) } });
    server.on('POST /robots/r1/execute', { body: { data: RUN_RESULT } });
    server.on('GET /robots/r1/runs/run1', { body: { data: { serializableOutput: { links: [{ url: 'https://a' }, { url: 'https://b' }] } } } });
    assert.deepEqual((await (await maxun.robots.get('r1')).run()).links, ['https://a', 'https://b']);

    const parse = robotRecord('p1', 'doc-parse');
    (parse.recording as any).outputFormats = ['markdown', 'links'];
    server.on('GET /robots/p1', { body: { data: parse } });
    server.on('POST /robots/p1/execute', { body: { data: RUN_RESULT } });
    server.on('GET /robots/p1/runs/run1', { body: { data: { serializableOutput: { links: ['https://x'] } } } });
    const parser = await maxun.robots.get('p1');
    assert.deepEqual(parser.formats, ['markdown', 'links']);
    assert.deepEqual((await parser.run()).links, ['https://x']);

    server.on('GET /robots/d1', { body: { data: robotRecord('d1', 'doc-extract') } });
    server.on('POST /robots/d1/execute', { body: { data: RUN_RESULT } });
    server.on('GET /robots/d1/runs/run1', { body: { data: { serializableOutput: { scrapeDoc: { data: { total: 10 } } } } } });
    assert.deepEqual((await (await maxun.robots.get('d1')).run()).documentData, { total: 10 });
  });

  test('runs are ordered newest first by real time', async () => {
    server.on('GET /robots/r1', { body: { data: robotRecord() } });
    server.on('GET /robots/r1/runs', {
      body: {
        data: [
          { runId: 'a', startedAt: '9/30/2026, 9:00:00 AM' },
          { runId: 'b', startedAt: '10/1/2026, 1:00:00 AM' },
          { runId: 'c', startedAt: '9/30/2026, 11:00:00 PM' },
        ],
      },
    });
    const robot = await maxun.robots.get('r1');
    assert.deepEqual((await robot.getRuns()).map((r) => r.runId), ['b', 'c', 'a']);
    assert.equal((await robot.getLatestRun())?.runId, 'b');
  });

  test('diff, abort, duplicate and delete', async () => {
    server.on('GET /robots/r1', { body: { data: robotRecord() } });
    server.on('GET /robots/r1/runs/new/diff', { body: { data: { runId: 'new', diffs: [] } } });
    server.on('POST /robots/r1/runs/new/abort', { body: { data: {} } });
    server.on('POST /robots/r1/duplicate', { status: 201, body: { data: robotRecord('r2') } });
    server.on('DELETE /robots/r1', { body: { message: 'ok' } });
    const robot = await maxun.robots.get('r1');
    await robot.getRunDiff('new', 'markdown');
    assert.equal(server.last('GET /robots/r1/runs/new/diff').query.get('format'), 'markdown');
    await robot.abort('new');
    assert.ok(server.called('POST /robots/r1/runs/new/abort'));
    const copy = await robot.duplicate('https://other.com');
    assert.deepEqual(server.last('POST /robots/r1/duplicate').json, { targetUrl: 'https://other.com' });
    assert.equal(copy.id, 'r2');
    await robot.delete();
    assert.ok(server.called('DELETE /robots/r1'));
  });
});

// ---------- schedules and webhooks ----------

describe('schedules and webhooks', () => {
  test('schedule payloads', async () => {
    const saved = { runEvery: 6, runEveryUnit: 'HOURS', timezone: 'UTC', cronExpression: '0 */6 * * *' };
    server.on('GET /robots/r1', { body: { data: robotRecord() } });
    server.on('PUT /robots/r1', { body: { data: { ...robotRecord(), schedule: saved } } });
    const robot = await maxun.robots.get('r1');

    const result = await robot.schedule({ runEvery: 6, runEveryUnit: 'HOURS', cronExpression: 'ignored' });
    assert.deepEqual(server.last('PUT /robots/r1').json, { schedule: { runEvery: 6, runEveryUnit: 'HOURS', timezone: 'UTC' } });
    assert.equal(result.cronExpression, '0 */6 * * *');

    await robot.schedule({ runEvery: 1, runEveryUnit: 'weeks' as any, startFrom: 'monday' as any, atTimeStart: '09:00' });
    assert.deepEqual(server.last('PUT /robots/r1').json.schedule, {
      runEvery: 1, runEveryUnit: 'WEEKS', startFrom: 'MONDAY', atTimeStart: '09:00', timezone: 'UTC',
    });
    await robot.unschedule();
    assert.deepEqual(server.last('PUT /robots/r1').json, { schedule: null });
  });

  test('getSchedule reads the robot fresh, with or without a schedule', async () => {
    server.on('GET /robots/r1', { body: { data: robotRecord() } });
    const robot = await maxun.robots.get('r1');
    assert.equal(await robot.getSchedule(), null);
    assert.deepEqual(await robot.getWebhooks(), []);
    const saved = { runEvery: 6, runEveryUnit: 'HOURS', timezone: 'UTC', nextRunAt: '2026-01-01T00:00:00Z' };
    server.on('GET /robots/r1', { body: { data: { ...robotRecord(), schedule: saved } } });
    assert.deepEqual(await robot.getSchedule(), saved);
  });

  test('webhooks use the server event names, update by URL and can be removed', async () => {
    let stored: any = null;
    server.on('GET /robots/r1', () => ({ body: { data: { ...robotRecord(), webhooks: stored } } }));
    server.on('PUT /robots/r1', (req) => {
      stored = req.json.webhooks;
      return { body: { data: { ...robotRecord(), webhooks: stored } } };
    });
    const robot = await maxun.robots.get('r1');

    const hook = await robot.addWebhook('https://hooks.test/a', { retryAttempts: 5 });
    assert.deepEqual(hook.events, ['run_completed', 'run_failed']);
    assert.equal(hook.retryAttempts, 5);
    assert.equal(hook.active, true);

    const warnings = await captureWarnings(() => robot.addWebhook({ url: 'https://hooks.test/b', events: ['run.completed'] }));
    assert.ok(warnings.some((w) => /run_completed/.test(w)));
    assert.deepEqual(stored[1].events, ['run_completed']);

    await robot.addWebhook({ url: 'https://hooks.test/a', events: ['run_failed'] });
    assert.equal(stored.length, 2);
    assert.deepEqual(stored[0].events, ['run_failed']);
    assert.equal(stored[0].id, hook.id);

    await assert.rejects(robot.addWebhook({ url: 'https://hooks.test/c', events: ['done'] }), /Unknown webhook event/);

    await robot.removeWebhook('https://hooks.test/b');
    assert.deepEqual((await robot.getWebhooks()).map((w) => w.url), ['https://hooks.test/a']);
    await robot.removeWebhooks();
    assert.deepEqual(await robot.getWebhooks(), []);
  });

  test('set list limit and rename', async () => {
    const workflow = [{ where: {}, what: [{ action: 'scrapeList', args: [{ limit: 100 }] }] }];
    server.on('GET /robots/r1', { body: { data: robotRecord('r1', 'scrape', { workflow }) } });
    server.on('PUT /robots/r1', { body: { data: robotRecord('r1', 'scrape', { name: 'New' }) } });
    const robot = await maxun.robots.get('r1');
    await robot.setListLimit(25);
    assert.deepEqual(server.last('PUT /robots/r1').json, { limits: [{ pairIndex: 0, actionIndex: 0, argIndex: 0, limit: 25 }] });
    await robot.rename('New');
    assert.deepEqual(server.last('PUT /robots/r1').json, { meta: { name: 'New' } });
    assert.equal(robot.name, 'New');
  });
});

// ---------- monitoring ----------

const crawlRun = (runId: string, startedAt: string, pages: any[], status = 'success', comparison?: any) => ({
  runId, status, startedAt,
  serializableOutput: { crawl: { Crawl: pages }, ...(comparison ? { _comparison: comparison } : {}) },
});
const PAGES_V1 = [
  { metadata: { url: 'https://e.com/a' }, markdown: 'A one' },
  { metadata: { url: 'https://e.com/b' }, markdown: 'B' },
];
const PAGES_V2 = [
  { metadata: { url: 'https://e.com/a' }, markdown: 'A two' },
  { metadata: { url: 'https://e.com/c' }, markdown: 'C' },
];

describe('change monitoring', () => {
  test('crawl runs are compared in the SDK', async () => {
    server.on('GET /robots/c1', { body: { data: robotRecord('c1', 'crawl', { compareRuns: true }) } });
    server.on('POST /robots/c1/execute', { body: { data: { ...RUN_RESULT, runId: 'new', data: { crawlData: PAGES_V2 } } } });
    server.on('GET /robots/c1/runs', {
      body: {
        data: [
          crawlRun('new', '2026-09-30T10:00:00Z', PAGES_V2),
          crawlRun('broken', '2026-09-30T09:00:00Z', [], 'failed'),
          crawlRun('old', '2026-09-29T10:00:00Z', PAGES_V1),
        ],
      },
    });
    const robot = await maxun.robots.get('c1');
    const result = await robot.run();
    assert.equal(result.hasChanges, true);
    assert.deepEqual(result.changedFormats, ['markdown']);
    assert.deepEqual(result.changedPages, { added: ['https://e.com/c'], removed: ['https://e.com/b'], changed: ['https://e.com/a'] });

    const diff = await robot.getRunDiff('new');
    assert.ok(!server.called('GET /robots/c1/runs/new/diff'));
    assert.equal(diff.previousRunId, 'old');
    const added = diff.diffs[0].changes.filter((c) => c.added).map((c) => c.value).join('');
    const removed = diff.diffs[0].changes.filter((c) => c.removed).map((c) => c.value).join('');
    assert.ok(added.includes('A two') && added.includes('## https://e.com/c'));
    assert.ok(removed.includes('A one') && removed.includes('## https://e.com/b'));
  });

  test('first crawl run and unchanged crawl runs report no changes', async () => {
    server.on('GET /robots/c1', { body: { data: robotRecord('c1', 'crawl', { compareRuns: true }) } });
    server.on('POST /robots/c1/execute', { body: { data: { ...RUN_RESULT, runId: 'new' } } });
    const robot = await maxun.robots.get('c1');
    server.on('GET /robots/c1/runs', { body: { data: [crawlRun('new', '2026-09-30T10:00:00Z', PAGES_V1)] } });
    assert.equal((await robot.run()).hasChanges, false);
    server.on('GET /robots/c1/runs', {
      body: { data: [crawlRun('new', '2026-09-30T10:00:00Z', PAGES_V1), crawlRun('old', '2026-09-29T10:00:00Z', PAGES_V1)] },
    });
    const result = await robot.run();
    assert.equal(result.hasChanges, false);
    assert.deepEqual(result.changedPages?.changed, []);
  });

  test("the server's own comparison wins when present", async () => {
    server.on('GET /robots/c1', { body: { data: robotRecord('c1', 'crawl', { compareRuns: true }) } });
    server.on('POST /robots/c1/execute', {
      body: { data: { ...RUN_RESULT, runId: 'new', hasChanges: true, changedFormats: ['text'] } },
    });
    server.on('GET /robots/c1/runs', {
      body: {
        data: [
          crawlRun('new', '2026-09-30T10:00:00Z', PAGES_V2, 'success', { changedFormats: ['text'] }),
          crawlRun('old', '2026-09-29T10:00:00Z', PAGES_V1),
        ],
      },
    });
    server.on('GET /robots/c1/runs/new/diff', { body: { data: { runId: 'new', diffs: [] } } });
    const robot = await maxun.robots.get('c1');
    assert.deepEqual((await robot.run()).changedFormats, ['text']);
    await robot.getRunDiff('new');
    assert.ok(server.called('GET /robots/c1/runs/new/diff'));
  });

  test('unmonitored crawls skip the comparison; unsupported types refuse monitoring', async () => {
    server.on('GET /robots/c1', { body: { data: robotRecord('c1', 'crawl') } });
    server.on('POST /robots/c1/execute', { body: { data: RUN_RESULT } });
    await (await maxun.robots.get('c1')).run();
    assert.ok(!server.called('GET /robots/c1/runs'));

    server.on('GET /robots/s1', { body: { data: robotRecord('s1', 'search') } });
    await assert.rejects((await maxun.robots.get('s1')).setMonitoring(true), /scrape, crawl and extract/);
  });

  test('warns when an existing extract robot is returned unchanged', async () => {
    server.on('POST /robots', { body: { data: robotRecord('r1', 'extract'), existing: true } });
    const warnings = await captureWarnings(() =>
      maxun.extract('E', 'https://e.com').captureText({ T: 'h1' }).build()
    );
    assert.ok(warnings.some((w) => /NOT saved/.test(w)));
  });
});

// ---------- errors ----------

describe('errors', () => {
  const cases: Array<[number, any]> = [[404, NotFoundError], [409, ConflictError], [400, ValidationError]];
  for (const [status, cls] of cases) {
    test(`${status} maps to ${cls.name}`, async () => {
      server.on('GET /robots/x', { status, body: { error: 'nope', details: 'why' } });
      await assert.rejects(maxun.robots.get('x'), (e: any) => e instanceof cls && e.statusCode === status && /nope/.test(e.message));
    });
  }

  test('non-JSON responses give a helpful error', async () => {
    server.on('GET /robots/x', { status: 502, text: '<html>Bad gateway</html>' });
    await assert.rejects(maxun.robots.get('x'), /Bad gateway/);
    server.on('GET /robots', { status: 200, text: '<html>app</html>' });
    await assert.rejects(maxun.robots.list(), /non-JSON/);
  });

  test('unreachable server', async () => {
    const offline = new Maxun({ apiKey: 'k', baseUrl: 'http://127.0.0.1:1/api/sdk' });
    await assert.rejects(offline.robots.list(), (e: any) => e instanceof MaxunError && /Could not reach Maxun/.test(e.message));
  });
});

// ---------- legacy entry points ----------

describe('legacy classes', () => {
  test('Scrape/Crawl/Search/Extract built with a config still work', async () => {
    const config = { apiKey: 'k', baseUrl: server.baseUrl };
    server.on('POST /robots', { status: 201, body: { data: robotRecord() } });
    server.on('POST /crawl', { status: 201, body: { data: robotRecord('r1', 'crawl') } });
    server.on('POST /search', { status: 201, body: { data: robotRecord('r1', 'search') } });
    server.on('GET /robots', { body: { data: [robotRecord('x', 'extract')] } });

    assert.equal((await new Scrape(config).create('S', 'https://e.com')).id, 'r1');
    await new Crawl(config).create('C', 'https://e.com', { mode: 'path', limit: 3 });
    assert.equal(server.last('POST /crawl').json.crawlConfig.mode, 'path');
    await new Search(config).create('Q', { query: 'q' });
    assert.equal((await new Extract(config).getRobots()).length, 1);

    const builder = new Extract(config).create('E').navigate('https://e.com').captureText({ T: 'h1' });
    assert.equal((await builder).id, 'r1');
  });

  test('deprecated builder calls warn and do nothing harmful', async () => {
    const builder = new Extract({ apiKey: 'k', baseUrl: server.baseUrl }).create('E').navigate('https://e.com');
    const warnings = await captureWarnings(() => {
      builder.setCookies([{ name: 'a', value: 'b' }]).mode('bulk').scroll('down', 300);
    });
    assert.equal(warnings.length, 3);
    const step = builder.getWorkflowArray()[0];
    assert.deepEqual(step.what, [{ action: 'scroll', args: [1] }]);
    assert.equal(step.where.cookies, undefined);
  });
});

// ---------- review follow-ups ----------

describe('edge cases', () => {
  test('callable resources still behave like the resource object', () => {
    assert.ok(maxun.scrape instanceof Scrape);
    assert.equal(maxun.scrape.constructor, Scrape);
    assert.equal(typeof maxun.scrape.list, 'function');
    assert.equal(typeof (maxun.scrape as any).call, 'function');
    assert.equal(maxun.scrape.client, maxun.client);
  });

  test('Client.executeRobot returns a RunResult', async () => {
    server.on('POST /robots/r1/execute', { body: { data: RUN_RESULT } });
    const result = await maxun.client.executeRobot('r1');
    assert.ok(result instanceof RunResult);
    assert.equal(result.markdown, '# Hi');
  });
});

// ---------- clean output ----------

describe('printing robots, runs and clients', () => {
  test('robots print as id, name and type; the client and API key never show', async () => {
    const { inspect } = await import('util');
    const client = new (await import('../src')).Client({ apiKey: 'secret-key', baseUrl: server.baseUrl });
    const robot = new Robot(client, robotRecord('f48', 'extract', { name: 'Quotes' }) as any);
    assert.equal(inspect(robot), "{ id: 'f48', name: 'Quotes', type: 'extract' }");
    assert.equal(JSON.stringify([robot]), '[{"id":"f48","name":"Quotes","type":"extract"}]');
    assert.ok(!inspect(client, { depth: 5 }).includes('secret-key'));
    assert.ok(!JSON.stringify(client).includes('secret-key'));
    assert.ok(!inspect(maxun, { depth: 6 }).includes("apiKey: 'k'"));
    assert.equal(robot.getData().recording_meta.id, 'f48');
  });

  test('runs are summaries with their output in run.result', async () => {
    const { inspect } = await import('util');
    const raw = {
      id: '3faa', runId: 'bdae', robotMetaId: '2c56', robotId: 'db-2c56', name: 'Example', status: 'success',
      startedAt: '10/1/2026, 12:46:25 AM', finishedAt: '10/1/2026, 12:47:14 AM',
      log: 'x'.repeat(1000), interpreterSettings: { maxConcurrency: 1 },
      serializableOutput: {
        scrapeSchema: { Title: 'Hi' },
        scrapeList: { 'List 1': [{ a: 1 }] },
        markdown: [{ content: '# Hi' }],
        _comparison: { changedFormats: ['markdown'] },
      },
      binaryOutput: { 'Screenshot 1': 'https://s/1.png' },
      hasChanges: true,
    };
    server.on('GET /robots/r1', { body: { data: robotRecord() } });
    server.on('GET /robots/r1/runs', { body: { data: [raw, { ...raw, runId: 'old', startedAt: '', finishedAt: '' }] } });
    server.on('GET /robots/r1/runs/bdae', { body: { data: raw } });
    const robot = await maxun.robots.get('r1');

    const runs = await robot.getRuns();
    const summary = {
      id: '3faa', runId: 'bdae', robotId: '2c56', name: 'Example', status: 'success',
      startedAt: '2026-10-01T00:46:25Z', finishedAt: '2026-10-01T00:47:14Z',
    };
    assert.deepEqual(runs[0].toJSON(), summary);
    assert.deepEqual(JSON.parse(JSON.stringify(runs[0])), summary);
    assert.equal(inspect(runs[0]), inspect(summary));
    assert.ok(!inspect(runs).includes('serializableOutput') && !inspect(runs).includes('xxxx'));
    assert.equal(runs[1].startedAt, null);
    assert.equal(runs[0].robotMetaId, '2c56');
    assert.equal(runs[0].getData().log.length, 1000);

    const result = runs[0].result;
    assert.ok(result instanceof RunResult);
    assert.deepEqual(result.textData, { Title: 'Hi' });
    assert.deepEqual(result.listData, [{ a: 1 }]);
    assert.equal(result.markdown, '# Hi');
    assert.deepEqual(result.screenshots, ['https://s/1.png']);
    assert.equal(result.hasChanges, true);
    assert.deepEqual(result.changedFormats, ['markdown']);

    assert.equal((await robot.getRun('bdae')).runId, 'bdae');
    assert.ok(['bdae', 'old'].includes((await robot.getLatestRun())!.runId));
  });
});

describe('review follow-ups', () => {
  test('timestamps with a space are read as UTC', async () => {
    const { toIso } = await import('../src/utils');
    assert.equal(toIso('2026-10-01 10:00:00'), '2026-10-01T10:00:00Z');
  });

  test('the client never shows its key, even with showHidden', async () => {
    const { inspect } = await import('util');
    const client = new (await import('../src')).Client({ apiKey: 'secret-key', baseUrl: server.baseUrl });
    assert.ok(!inspect(client, { showHidden: true, depth: 10 }).includes('secret-key'));
    assert.ok(!inspect(new Maxun({ apiKey: 'secret-key', baseUrl: server.baseUrl }), { showHidden: true, depth: 10 }).includes('secret-key'));
  });
});

// ---------- run results ----------

describe('run results', () => {
  test('a result shows the run id, status and only the outputs produced', async () => {
    const { inspect } = await import('util');
    const raw: any = {
      runId: 'b05c', status: 'success', hasChanges: false, changedFormats: [],
      data: { textData: {}, listData: [], crawlData: [], searchData: {}, text: 'abc', markdown: '# Example', promptResult: null },
      screenshots: [],
    };
    server.on('GET /robots/r1', { body: { data: robotRecord() } });
    server.on('POST /robots/r1/execute', () => ({ body: { data: raw } }));
    const robot = await maxun.robots.get('r1');
    let result = await robot.run();
    const shown = { runId: 'b05c', status: 'success', text: 'abc', markdown: '# Example' };
    assert.deepEqual(JSON.parse(JSON.stringify(result)), shown);
    assert.equal(inspect(result), inspect(shown));
    assert.deepEqual(Object.keys(result), ['runId', 'status', 'text', 'markdown']);
    // Properties and 0.0.x-style access still work.
    assert.deepEqual(result.listData, []);
    assert.deepEqual(result.textData, {});
    assert.deepEqual(result.screenshots, []);
    assert.equal(result.hasChanges, false);
    assert.equal(result.smartQueryResult, null);
    assert.deepEqual(result.data.listData, []);
    assert.equal(result.data.text, 'abc');

    raw.screenshots = ['https://s/1.png'];
    raw.data.listData = [{ a: 1 }];
    raw.data.promptResult = '42';
    result = await robot.run();
    assert.deepEqual(JSON.parse(JSON.stringify(result)), {
      runId: 'b05c', status: 'success', text: 'abc', markdown: '# Example', listData: [{ a: 1 }],
      smartQueryResult: '42', screenshots: ['https://s/1.png'],
    });
  });

  test('hasChanges and changedFormats appear only when monitoring is on', async () => {
    const raw = { runId: 'x', status: 'success', hasChanges: false, changedFormats: [], data: { markdown: 'm' } };
    server.on('GET /robots/off', { body: { data: robotRecord('off') } });
    server.on('GET /robots/on', { body: { data: robotRecord('on', 'scrape', { compareRuns: true }) } });
    server.on('POST /robots/off/execute', { body: { data: raw } });
    server.on('POST /robots/on/execute', { body: { data: raw } });
    const off = JSON.parse(JSON.stringify(await (await maxun.robots.get('off')).run()));
    const on = JSON.parse(JSON.stringify(await (await maxun.robots.get('on')).run()));
    assert.deepEqual(off, { runId: 'x', status: 'success', markdown: 'm' });
    assert.deepEqual(on, { runId: 'x', status: 'success', markdown: 'm', hasChanges: false, changedFormats: [] });

    const stored = { runId: 'x', status: 'success', serializableOutput: { markdown: [{ content: 'm' }] } };
    server.on('GET /robots/off/runs', { body: { data: [stored] } });
    server.on('GET /robots/on/runs', { body: { data: [stored] } });
    assert.ok(!('hasChanges' in JSON.parse(JSON.stringify((await (await maxun.robots.get('off')).getRuns())[0].result))));
    assert.ok('hasChanges' in JSON.parse(JSON.stringify((await (await maxun.robots.get('on')).getRuns())[0].result)));
  });
});
