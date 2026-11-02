import { signIn, anonymous, USERS, IDS, ZIP_BYTES } from './helpers.js';
import { resetMockStore } from '../src/config/mockSupabase.js';

/**
 * Role-based access control matrix + data hiding.
 * Rows: endpoint. Columns: who may call it (2xx/4xx-business) vs who gets 403.
 */
describe('RBAC matrix & authorisation-based data hiding', () => {
  let s; // sessions by persona

  beforeAll(async () => {
    resetMockStore();
    s = {
      client: await signIn(USERS.client),
      manager: await signIn(USERS.manager),
      carol: await signIn(USERS.carol),
      dave: await signIn(USERS.dave),
      reviewer: await signIn(USERS.reviewer),
    };
  });

  const forbiddenFor = (personas, make) =>
    test.each(personas)('403 for %s', async (who) => {
      const res = await make(s[who]);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

  describe('Manager-only: GET /api/workers', () => {
    forbiddenFor(['client', 'carol', 'reviewer'], (c) => c.get('/api/workers'));
    test('manager 200', async () => expect((await s.manager.get('/api/workers')).status).toBe(200));
  });

  describe('Manager-only: GET /api/profiles', () => {
    forbiddenFor(['client', 'carol', 'dave', 'reviewer'], (c) => c.get('/api/profiles'));
  });

  describe('Manager-only: POST /api/users', () => {
    const body = { email: 'x.person@example.com', display_name: 'X Person', role: 'assignee', password: 'Str0ng!Passphrase' };
    forbiddenFor(['client', 'carol', 'reviewer'], (c) => c.post('/api/users').send(body));
  });

  describe('Manager-only: POST /api/projects', () => {
    const body = { title: 'Rogue Project', client_id: 'client-001' };
    forbiddenFor(['client', 'carol', 'reviewer'], (c) => c.post('/api/projects').send(body));
  });

  describe('Manager-only: PATCH /api/projects/:id', () => {
    forbiddenFor(['client', 'carol', 'reviewer'], (c) => c.patch(`/api/projects/${IDS.project1}`).send({ status: 'cancelled' }));
  });

  describe('Manager-only: POST /api/tasks', () => {
    const body = { project_id: IDS.project1, title: 'Rogue task', priority: 'low', start_date: '2027-05-01', due_date: '2027-05-02' };
    forbiddenFor(['client', 'carol', 'reviewer'], (c) => c.post('/api/tasks').send(body));
  });

  describe('Manager-only: POST /api/tasks/:id/conflict-preview', () => {
    const body = { assignee_id: 'assignee-001', start_date: '2027-05-01', due_date: '2027-05-02' };
    forbiddenFor(['client', 'carol', 'reviewer'], (c) => c.post('/api/tasks/new/conflict-preview').send(body));
  });

  describe('Reviewer-only: POST /api/submissions/:id/reviews', () => {
    const body = { decision: 'approved' };
    forbiddenFor(['client', 'manager', 'carol'], (c) =>
      c.post('/api/submissions/44444444-0000-0000-0000-000000000001/reviews').send(body)
    );
  });

  describe('Review queue: GET /api/reviews/pending', () => {
    forbiddenFor(['client', 'carol'], (c) => c.get('/api/reviews/pending'));
    test('reviewer and manager 200', async () => {
      expect((await s.reviewer.get('/api/reviews/pending')).status).toBe(200);
      expect((await s.manager.get('/api/reviews/pending')).status).toBe(200);
    });
  });

  describe('Assignee-only: POST /api/tasks/:id/submissions', () => {
    forbiddenFor(['client', 'manager', 'reviewer'], (c) =>
      c.post(`/api/tasks/${IDS.taskInProgress}/submissions`).attach('file', ZIP_BYTES, 'x.zip')
    );
  });

  describe('Project requests', () => {
    forbiddenFor(['carol', 'reviewer'], (c) => c.get('/api/project-requests'));
    test('manager cannot POST a request (clients only)', async () => {
      const res = await s.manager
        .post('/api/project-requests')
        .send({ title: 'Mgr request', description: 'Managers should not file requests', priority: 'low', requested_deadline: '2027-01-01' });
      expect(res.status).toBe(403);
    });
    test('client cannot change request status', async () => {
      const res = await s.client.patch(`/api/project-requests/${IDS.req2}`).send({ status: 'approved' });
      expect(res.status).toBe(403);
    });
    test('client cannot edit a request once it is under review', async () => {
      const res = await s.client.patch(`/api/project-requests/${IDS.req3}`).send({ title: 'Changed title' });
      expect(res.status).toBe(409);
    });
    test('client can edit own pending request', async () => {
      const res = await s.client.patch(`/api/project-requests/${IDS.req2}`).send({ title: 'Internal HR Portal v2' });
      expect(res.status).toBe(200);
    });
    test('manager can move a request to reviewing', async () => {
      const res = await s.manager.patch(`/api/project-requests/${IDS.req2}`).send({ status: 'reviewing' });
      expect(res.status).toBe(200);
    });
  });

  describe('Object-level access (IDOR)', () => {
    test('assignee sees only own tasks in the list, whatever filter is passed', async () => {
      const res = await s.carol.get('/api/tasks?assignee_id=assignee-002');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.every((t) => t.assignee_id === 'assignee-001')).toBe(true);
    });

    test('assignee cannot read another assignee\'s task by id', async () => {
      expect((await s.carol.get(`/api/tasks/${IDS.taskTodo}`)).status).toBe(403);
      expect((await s.carol.get(`/api/tasks/${IDS.taskInProgress}`)).status).toBe(200);
    });

    test('assignee cannot list, download or review-read another assignee\'s deliverables', async () => {
      expect((await s.carol.get(`/api/tasks/${IDS.taskSubmitted}/submissions`)).status).toBe(403);
      expect((await s.carol.get('/api/submissions/44444444-0000-0000-0000-000000000002/download')).status).toBe(403);
      expect((await s.carol.get(`/api/tasks/${IDS.taskRevision}/reviews`)).status).toBe(403);
    });

    test('reviewer cannot see todo / in_progress tasks', async () => {
      expect((await s.reviewer.get(`/api/tasks/${IDS.taskTodo}`)).status).toBe(403);
      expect((await s.reviewer.get(`/api/tasks/${IDS.taskInProgress}`)).status).toBe(403);
      const list = await s.reviewer.get('/api/tasks');
      expect(list.body.data.every((t) => ['submitted', 'in_review', 'revision', 'approved'].includes(t.status))).toBe(true);
    });

    test('client sees only tasks of own projects and cannot download unapproved deliverables', async () => {
      const list = await s.client.get('/api/tasks');
      expect(list.status).toBe(200);
      expect(list.body.data.every((t) => t.project?.id === IDS.project1 || t.project?.id === IDS.project2)).toBe(true);
      expect((await s.client.get('/api/submissions/44444444-0000-0000-0000-000000000002/download')).status).toBe(403);
      // approved task's deliverable is released to the client
      expect((await s.client.get('/api/submissions/44444444-0000-0000-0000-000000000004/download')).status).toBe(200);
    });

    test('a client registered later cannot see someone else\'s projects/requests/tasks', async () => {
      await anonymous().post('/api/auth/register').send({ email: 'other.client@example.com', display_name: 'Other Client', password: 'Str0ng!Passphrase' });
      const other = await signIn('other.client@example.com', 'Str0ng!Passphrase');
      expect((await other.get('/api/projects')).body.data).toEqual([]);
      expect((await other.get('/api/tasks')).body.data).toEqual([]);
      expect((await other.get('/api/project-requests')).body.data).toEqual([]);
      expect((await other.get(`/api/projects/${IDS.project1}`)).status).toBe(403);
      expect((await other.get(`/api/project-requests/${IDS.req1}`)).status).toBe(403);
      expect((await other.get(`/api/tasks/${IDS.taskApproved}`)).status).toBe(403);
      expect((await other.get(`/api/projects/${IDS.project1}/activity`)).status).toBe(403);
    });

    test('assignee project view lists only their own tasks', async () => {
      const res = await s.dave.get(`/api/projects/${IDS.project1}`);
      expect(res.status).toBe(200);
      expect(res.body.data.tasks.every((t) => t.assignee_id === 'assignee-002')).toBe(true);
    });

    test('assignee with no tasks in a project is denied that project', async () => {
      const res = await s.dave.get(`/api/projects/${IDS.project2}`);
      expect(res.status).toBe(200); // dave owns task 8 in project 2
      const res2 = await s.carol.get(`/api/projects/${IDS.project2}`);
      expect(res2.status).toBe(200);
    });
  });

  describe('Data hiding / field-level protection', () => {
    test('credential fields never appear anywhere, for any role', async () => {
      for (const who of Object.keys(s)) {
        for (const path of ['/api/projects', '/api/tasks', '/api/auth/me']) {
          const res = await s[who].get(path);
          expect(JSON.stringify(res.body)).not.toMatch(/password_hash|\$2[aby]\$|failed_logins|locked_until|token_hash/);
        }
      }
    });

    test('e-mail addresses are visible only to the user themself and to managers', async () => {
      const proj = await s.client.get('/api/projects');
      expect(JSON.stringify(proj.body)).not.toMatch(/@taskorbit\.io|@clientcorp\.io/);
      const tasks = await s.carol.get('/api/tasks');
      expect(JSON.stringify(tasks.body)).not.toMatch(/@taskorbit\.io|@clientcorp\.io/);
      expect((await s.carol.get('/api/auth/me')).body.data.user.email).toBe('carol@taskorbit.io');
      expect(JSON.stringify((await s.manager.get('/api/workers')).body)).toMatch(/carol@taskorbit\.io/);
    });

    test('client activity feed is redacted: only external actions, no details', async () => {
      const res = await s.client.get(`/api/projects/${IDS.project1}/activity`);
      expect(res.status).toBe(200);
      expect(res.body.data.every((e) => e.details === null)).toBe(true);
      expect(res.body.data.some((e) => e.action === 'submission_created')).toBe(false);
    });

    test('manager activity feed includes full details', async () => {
      const res = await s.manager.get(`/api/projects/${IDS.project1}/activity`);
      expect(res.body.data.some((e) => e.details && Object.keys(e.details).length)).toBe(true);
    });

    test('storage paths are never exposed in submission listings', async () => {
      const res = await s.manager.get(`/api/tasks/${IDS.taskSubmitted}/submissions`);
      expect(res.status).toBe(200);
      expect(JSON.stringify(res.body)).not.toMatch(/file_path|tasks\/33333333/);
    });

    test('audit rows (login events) are not exposed through any project feed', async () => {
      const res = await s.manager.get(`/api/projects/${IDS.project1}/activity?limit=100`);
      expect(res.body.data.some((e) => String(e.action).startsWith('auth_'))).toBe(false);
    });
  });
});
