import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { signIn, anonymous, USERS } from './helpers.js';
import { resetMockStore } from '../src/config/mockSupabase.js';
import { csvCell } from '../src/services/reportService.js';
import { bus, attachFileLogger } from '../src/services/eventBus.js';

describe('Unit VI (Node.js): static resources, streams, fs, events', () => {
  let manager;
  let carol;
  beforeAll(async () => {
    resetMockStore();
    manager = await signIn(USERS.manager);
    carol = await signIn(USERS.carol);
  });

  test('express.static serves the API docs publicly with a strict CSP and cache headers', async () => {
    const page = await anonymous().get('/docs/');
    expect(page.status).toBe(200);
    expect(page.headers['content-type']).toMatch(/text\/html/);
    expect(page.text).toContain('TaskOrbit API');
    expect(page.headers['content-security-policy']).toMatch(/style-src 'self'/);
    expect(page.headers['cache-control']).toMatch(/public/);
    expect((await anonymous().get('/docs/docs.css')).status).toBe(200);
    const spec = await anonymous().get('/docs/openapi.json');
    expect(spec.body.openapi).toBe('3.0.3');
  });

  test('static serving cannot escape the public folder (path traversal)', async () => {
    for (const p of ['/docs/../package.json', '/docs/%2e%2e/package.json', '/docs/..%2fpackage.json']) {
      const res = await anonymous().get(p);
      expect([400, 403, 404]).toContain(res.status);
      expect(res.text).not.toContain('taskorbit-backend');
    }
  });

  test('summary report: manager only, correct aggregates', async () => {
    expect((await carol.get('/api/reports/summary')).status).toBe(403);
    expect((await anonymous().get('/api/reports/summary')).status).toBe(401);
    const res = await manager.get('/api/reports/summary');
    expect(res.status).toBe(200);
    expect(res.body.data.tasks.total).toBe(8);
    expect(res.body.data.tasks.by_status.approved).toBe(1);
    expect(res.body.data.tasks.completion_pct).toBe(13);
    expect(res.body.data.projects.total).toBe(2);
    expect(JSON.stringify(res.body)).not.toMatch(/@|password/);
  });

  test('CSV export streams a download for managers only', async () => {
    expect((await carol.get('/api/reports/tasks.csv')).status).toBe(403);
    const res = await manager.get('/api/reports/tasks.csv').buffer(true).parse((r, cb) => {
      let data = '';
      r.on('data', (c) => { data += c; });
      r.on('end', () => cb(null, data));
    });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/attachment; filename=/);
    const lines = res.body.trim().split('\n');
    expect(lines[0]).toBe('task,project,assignee,priority,status,start_date,due_date');
    expect(lines).toHaveLength(9);
  });

  test('csvCell neutralises spreadsheet formula injection and escapes quotes/commas', () => {
    expect(csvCell('=HYPERLINK("http://evil")')).toBe('"\'=HYPERLINK(""http://evil"")"');
    expect(csvCell('+1+1')).toBe("'+1+1");
    expect(csvCell('-2')).toBe("'-2");
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)");
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell(null)).toBe('');
  });

  test('EventEmitter bus + fs logger: status changes are appended to a log file', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'to-events-'));
    const detach = attachFileLogger(dir);
    const reviewer = await signIn(USERS.reviewer);
    const res = await reviewer.post('/api/tasks/33333333-0000-0000-0000-000000000004/status').send({ status: 'in_review' });
    expect(res.status).toBe(200);
    await new Promise((r) => setTimeout(r, 100));
    detach();
    const line = fs.readFileSync(path.join(dir, 'events.log'), 'utf8').trim().split('\n').pop();
    expect(JSON.parse(line)).toMatchObject({ event: 'task.status_changed', from: 'submitted', to: 'in_review' });
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('bus delivers events to multiple listeners and supports removal', () => {
    const seen = [];
    const a = (p) => seen.push(['a', p.x]);
    const b = (p) => seen.push(['b', p.x]);
    bus.on('demo', a); bus.on('demo', b);
    bus.emit('demo', { x: 1 });
    bus.off('demo', a);
    bus.emit('demo', { x: 2 });
    expect(seen).toEqual([['a', 1], ['b', 1], ['b', 2]]);
    bus.off('demo', b);
  });
});
