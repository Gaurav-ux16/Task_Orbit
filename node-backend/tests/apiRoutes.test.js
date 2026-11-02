import { signIn, anonymous, USERS, IDS, ZIP_BYTES } from './helpers.js';
import { resetMockStore } from '../src/config/mockSupabase.js';

describe('TaskOrbit API — workflow integration (authenticated)', () => {
  let manager;
  let carol;
  let reviewer;
  let client;

  beforeAll(async () => {
    resetMockStore();
    [manager, carol, reviewer, client] = await Promise.all([
      signIn(USERS.manager),
      signIn(USERS.carol),
      signIn(USERS.reviewer),
      signIn(USERS.client),
    ]);
  });

  test('GET /health is public and leaks no user data', async () => {
    const res = await anonymous().get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.user).toBeUndefined();
  });

  test('GET /api/profiles returns the profile list to a manager without credentials', async () => {
    const res = await manager.get('/api/profiles');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(5);
    expect(JSON.stringify(res.body)).not.toMatch(/password|\$2b\$/i);
  });

  test('GET /api/projects lists projects with client and manager metadata', async () => {
    const res = await manager.get('/api/projects');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('title');
    expect(res.body.data[0].client).toEqual(expect.objectContaining({ id: 'client-001' }));
    expect(res.body.data[0].client.email).toBeUndefined();
  });

  test('GET /api/tasks lists tasks with priority and due date', async () => {
    const res = await manager.get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('priority');
    expect(res.body.data[0]).toHaveProperty('due_date');
  });

  test('POST /api/tasks/new/conflict-preview detects date overlap for assignee', async () => {
    const res = await manager
      .post('/api/tasks/new/conflict-preview')
      .send({ assignee_id: 'assignee-001', start_date: '2026-10-15', due_date: '2026-10-25' });
    expect(res.status).toBe(200);
    expect(res.body.data.hasConflicts).toBe(true);
    expect(res.body.data.conflicts.length).toBeGreaterThan(0);
  });

  test('GET /api/project-requests returns only the client\'s own requests', async () => {
    const res = await client.get('/api/project-requests');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every((r) => r.client_id === 'client-001')).toBe(true);
  });

  // ── Research-paper alignment ─────────────────────────────────────────────
  test('invalid transition todo → approved is rejected with HTTP 409', async () => {
    const res = await manager.post(`/api/tasks/${IDS.taskTodo}/status`).send({ status: 'approved' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/Invalid workflow transition/);
  });

  test('unauthorised role transition (assignee approving) is rejected with HTTP 403', async () => {
    const res = await carol.post(`/api/tasks/${IDS.taskInReview}/status`).send({ status: 'approved' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Access denied/);
  });

  test('assignee cannot update another assignee\'s task (403)', async () => {
    const res = await carol.patch(`/api/tasks/${IDS.taskSubmitted}`).send({ description: 'Unauthorized update attempt' });
    expect(res.status).toBe(403);
  });

  test('assignee cannot submit for another assignee\'s task (403)', async () => {
    const res = await carol
      .post(`/api/tasks/${IDS.taskSubmitted}/submissions`)
      .attach('file', ZIP_BYTES, 'work.zip');
    expect(res.status).toBe(403);
  });

  test('submission on a non-in_progress task is rejected with HTTP 409', async () => {
    const res = await carol
      .post(`/api/tasks/${IDS.taskApproved}/submissions`)
      .attach('file', ZIP_BYTES, 'work.zip');
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/must be 'in_progress'/);
  });

  test('executable upload is rejected with HTTP 400', async () => {
    const res = await carol
      .post(`/api/tasks/${IDS.taskInProgress}/submissions`)
      .attach('file', Buffer.from('MZ-not-allowed'), 'script.exe');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/File type not permitted/);
  });

  test('stale review (older submission version) is rejected with HTTP 409', async () => {
    const taskId = IDS.taskInProgress;

    const s1 = await carol.post(`/api/tasks/${taskId}/submissions`).attach('file', ZIP_BYTES, 'archive-v1.zip');
    expect(s1.status).toBe(201);
    expect(s1.body.data.file_path).toBeUndefined(); // storage path is never exposed
    const sub1Id = s1.body.data.id;

    expect((await reviewer.post(`/api/tasks/${taskId}/status`).send({ status: 'in_review' })).status).toBe(200);
    expect((await reviewer.post(`/api/tasks/${taskId}/status`).send({ status: 'revision' })).status).toBe(200);
    expect((await carol.post(`/api/tasks/${taskId}/status`).send({ status: 'in_progress' })).status).toBe(200);

    const s2 = await carol.post(`/api/tasks/${taskId}/submissions`).attach('file', ZIP_BYTES, 'archive-v2.zip');
    expect(s2.status).toBe(201);
    expect(s2.body.data.version_number).toBe(2);

    const review = await reviewer
      .post(`/api/submissions/${sub1Id}/reviews`)
      .send({ decision: 'approved', feedback: 'Looks good', task_id: taskId });
    expect(review.status).toBe(409);
    expect(review.body.error).toMatch(/outdated submission version/);
  });

  test('full happy path: in_review task is approved by the reviewer on the latest version', async () => {
    const subs = await reviewer.get(`/api/tasks/${IDS.taskInReview}/submissions`);
    const latest = subs.body.data[0];
    const res = await reviewer
      .post(`/api/submissions/${latest.id}/reviews`)
      .send({ decision: 'approved', feedback: 'Great work.', task_id: IDS.taskInReview });
    expect(res.status).toBe(201);
    const task = await manager.get(`/api/tasks/${IDS.taskInReview}`);
    expect(task.body.data.status).toBe('approved');
  });

  test('approved is terminal: no further edits or transitions', async () => {
    expect((await manager.post(`/api/tasks/${IDS.taskApproved}/status`).send({ status: 'in_progress' })).status).toBe(409);
    expect((await manager.patch(`/api/tasks/${IDS.taskApproved}`).send({ title: 'Renamed after approval' })).status).toBe(409);
  });

  test('GET /api/workers returns worker directory with aggregated workload (manager only)', async () => {
    const res = await manager.get('/api/workers');
    expect(res.status).toBe(200);
    const carolRow = res.body.data.find((w) => w.id === 'assignee-001');
    expect(carolRow).toBeDefined();
    expect(carolRow.workload).toHaveProperty('active_tasks_count');
    expect(JSON.stringify(res.body)).not.toMatch(/password|\$2b\$/i);
  });

  test('scheduling conflict without override is rejected with HTTP 409', async () => {
    const res = await manager.post('/api/tasks').send({
      project_id: IDS.project1,
      title: 'Conflicting Task Without Override',
      assignee_id: 'assignee-001',
      priority: 'high',
      start_date: '2026-10-15',
      due_date: '2026-10-20',
    });
    expect(res.status).toBe(409);
    expect(res.body.hasConflicts).toBe(true);
    expect(res.body.conflicts.length).toBeGreaterThan(0);
  });

  test('confirmed override creates the task and records two-way references', async () => {
    const res = await manager.post('/api/tasks').send({
      project_id: IDS.project1,
      title: 'Conflicting Task With Confirmed Override',
      assignee_id: 'assignee-001',
      priority: 'high',
      start_date: '2026-10-15',
      due_date: '2026-10-20',
      override_conflicts: true,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.has_conflict_override).toBe(true);
    expect(res.body.data.conflict_task_ids.length).toBeGreaterThan(0);

    const otherId = res.body.data.conflict_task_ids[0];
    const other = await manager.get(`/api/tasks/${otherId}`);
    expect(other.body.data.conflict_task_ids).toContain(res.body.data.id);
  });

  test('GET /api/reviews/pending returns the review queue to reviewers', async () => {
    const res = await reviewer.get('/api/reviews/pending');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
