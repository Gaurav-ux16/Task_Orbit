import { signIn, anonymous, USERS, IDS } from './helpers.js';
import { resetMockStore } from '../src/config/mockSupabase.js';
import { assertProductionConfig } from '../src/config/env.js';

describe('Field validation (control / module level)', () => {
  let manager;
  let client;

  beforeAll(async () => {
    resetMockStore();
    manager = await signIn(USERS.manager);
    client = await signIn(USERS.client);
  });

  const goodRequest = { title: 'Customer portal', description: 'A portal for customers to track orders.', priority: 'high', requested_deadline: '2027-03-01' };
  const goodTask = { project_id: IDS.project1, title: 'Write docs', priority: 'low', start_date: '2027-07-01', due_date: '2027-07-03' };

  describe('project request', () => {
    test('accepts a valid request', async () => {
      const res = await client.post('/api/project-requests').send(goodRequest);
      expect(res.status).toBe(201);
    });

    test.each([
      ['title missing', { title: undefined }],
      ['title too short', { title: 'ab' }],
      ['title too long', { title: 'x'.repeat(121) }],
      ['title with angle brackets', { title: 'Hello <b>' }],
      ['description too short', { description: 'tiny' }],
      ['description too long', { description: 'x'.repeat(2001) }],
      ['bad priority', { priority: 'urgent' }],
      ['deadline not a date', { requested_deadline: 'tomorrow' }],
      ['deadline impossible date', { requested_deadline: '2027-02-30' }],
      ['deadline missing', { requested_deadline: undefined }],
    ])('rejects: %s', async (_name, patch) => {
      const res = await client.post('/api/project-requests').send({ ...goodRequest, ...patch });
      expect(res.status).toBe(400);
      expect(res.body.details?.length ?? 1).toBeGreaterThan(0);
    });
  });

  describe('task', () => {
    test('accepts a valid task', async () => {
      const res = await manager.post('/api/tasks').send(goodTask);
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('todo');
    });

    test.each([
      ['project_id not a uuid', { project_id: '1; DROP' }],
      ['project does not exist', { project_id: '99999999-9999-9999-9999-999999999999' }],
      ['start after due', { start_date: '2027-08-10', due_date: '2027-08-01' }],
      ['bad date', { start_date: '31/12/2027' }],
      ['bad priority', { priority: 'whenever' }],
      ['assignee does not exist', { assignee_id: 'nobody-123' }],
      ['assignee is not an assignee', { assignee_id: 'client-001' }],
      ['title too short', { title: 'x' }],
    ])('rejects: %s', async (_name, patch) => {
      const res = await manager.post('/api/tasks').send({ ...goodTask, ...patch });
      expect(res.status).toBe(400);
    });

    test('invalid status value is rejected before any workflow logic', async () => {
      const res = await manager.post(`/api/tasks/${IDS.taskTodo}/status`).send({ status: 'done' });
      expect(res.status).toBe(400);
    });

    test('malformed task id in the path is rejected', async () => {
      expect((await manager.get('/api/tasks/not-a-uuid')).status).toBe(400);
      expect((await manager.post('/api/tasks/abc/status').send({ status: 'todo' })).status).toBe(400);
    });

    test('PATCH with no updatable fields is rejected', async () => {
      const res = await manager.patch(`/api/tasks/${IDS.taskTodo}`).send({ unknown_field: 'x' });
      expect(res.status).toBe(400);
    });
  });

  describe('project', () => {
    test('requires an existing client and a valid date order', async () => {
      expect((await manager.post('/api/projects').send({ title: 'Valid title', client_id: 'assignee-001' })).status).toBe(400);
      expect((await manager.post('/api/projects').send({ title: 'Valid title', client_id: 'client-001', start_date: '2027-05-02', due_date: '2027-05-01' })).status).toBe(400);
      expect((await manager.post('/api/projects').send({ title: 'Valid title', client_id: 'client-001', start_date: '2027-05-01', due_date: '2027-06-01' })).status).toBe(201);
    });

    test('project status must be a known value', async () => {
      expect((await manager.patch(`/api/projects/${IDS.project2}`).send({ status: 'archived' })).status).toBe(400);
      expect((await manager.patch(`/api/projects/${IDS.project2}`).send({ status: 'on_hold' })).status).toBe(200);
    });

    test('tasks cannot be added to a cancelled project', async () => {
      await manager.patch(`/api/projects/${IDS.project2}`).send({ status: 'cancelled' });
      const res = await manager.post('/api/tasks').send({ ...goodTask, project_id: IDS.project2 });
      expect(res.status).toBe(409);
    });
  });

  describe('review', () => {
    test('decision must be approved|revision; revision needs feedback', async () => {
      const reviewer = await signIn(USERS.reviewer);
      const sub = '44444444-0000-0000-0000-000000000001';
      expect((await reviewer.post(`/api/submissions/${sub}/reviews`).send({ decision: 'maybe' })).status).toBe(400);
      expect((await reviewer.post(`/api/submissions/${sub}/reviews`).send({ decision: 'revision' })).status).toBe(400);
      expect((await reviewer.post(`/api/submissions/${sub}/reviews`).send({ decision: 'approved', feedback: 'x'.repeat(2001) })).status).toBe(400);
      expect((await reviewer.post('/api/submissions/zzz/reviews').send({ decision: 'approved' })).status).toBe(400);
    });
  });

  describe('auth forms', () => {
    test.each([
      ['bad e-mail', { email: 'not-an-email', display_name: 'Test Person', password: 'Str0ng!Passphrase' }],
      ['numeric name', { email: 'a@b.co', display_name: '12345', password: 'Str0ng!Passphrase' }],
      ['one-letter name', { email: 'a@b.co', display_name: 'A', password: 'Str0ng!Passphrase' }],
      ['password too long', { email: 'a@b.co', display_name: 'Test Person', password: `Aa1!${'x'.repeat(130)}` }],
      ['missing password', { email: 'a@b.co', display_name: 'Test Person' }],
    ])('registration rejects: %s', async (_n, payload) => {
      expect((await anonymous().post('/api/auth/register').send(payload)).status).toBe(400);
    });

    test('names with accents, apostrophes and hyphens are accepted', async () => {
      const res = await anonymous().post('/api/auth/register').send({ email: 'jose@example.com', display_name: "José O'Neil-Müller", password: 'Str0ng!Passphrase' });
      expect(res.status).toBe(201);
    });

    test('e-mail is case-insensitive for login', async () => {
      await signIn('BOB@TASKORBIT.IO').then((s) => expect(s.user.id).toBe('manager-001'));
    });
  });

  describe('pagination and filters', () => {
    test('rejects invalid page/limit values, caps oversize limits', async () => {
      expect((await manager.get('/api/tasks?page=0')).status).toBe(400);
      expect((await manager.get('/api/tasks?limit=1000')).status).toBe(400);
      expect((await manager.get('/api/tasks?limit=abc')).status).toBe(400);
      expect((await manager.get('/api/tasks?status=bogus')).status).toBe(400);
      expect((await manager.get('/api/tasks?limit=2')).body.data.length).toBeLessThanOrEqual(2);
    });
  });
});

describe('Session lifetime', () => {
  const saved = { ...process.env };
  afterEach(() => { process.env = { ...saved }; });
  beforeEach(() => resetMockStore());

  test('idle timeout invalidates a session', async () => {
    const s = await signIn(USERS.carol);
    expect((await s.get('/api/auth/me')).status).toBe(200);
    process.env.SESSION_IDLE_MINUTES = '0.0001'; // ~6 ms
    await new Promise((r) => setTimeout(r, 30));
    expect((await s.get('/api/auth/me')).status).toBe(401);
  });

  test('absolute timeout invalidates a session even if active', async () => {
    process.env.SESSION_ABSOLUTE_HOURS = '0.000001'; // ~3.6 ms
    const s = await signIn(USERS.carol);
    await new Promise((r) => setTimeout(r, 30));
    expect((await s.get('/api/auth/me')).status).toBe(401);
  });

  test('remember-me sessions are not subject to the short idle timeout', async () => {
    const s = await signIn(USERS.carol, undefined, { remember: true });
    process.env.SESSION_IDLE_MINUTES = '0.0001';
    await new Promise((r) => setTimeout(r, 30));
    expect((await s.get('/api/auth/me')).status).toBe(200);
  });
});

describe('Production configuration guard', () => {
  const saved = { ...process.env };
  afterEach(() => { process.env = { ...saved }; });

  test('refuses to start in production on the in-memory database or without FRONTEND_URL', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.FRONTEND_URL;
    expect(() => assertProductionConfig(true)).toThrow(/mock database/i);
    expect(() => assertProductionConfig(false)).toThrow(/FRONTEND_URL/);
    process.env.FRONTEND_URL = 'https://app.example.com';
    expect(() => assertProductionConfig(false)).not.toThrow();
  });

  test('is a no-op outside production', () => {
    process.env.NODE_ENV = 'development';
    expect(() => assertProductionConfig(true)).not.toThrow();
  });
});
