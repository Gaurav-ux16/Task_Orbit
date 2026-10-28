import request from 'supertest';
import app from '../src/app.js';

describe('TaskOrbit API Routes Integration', () => {
  test('GET /health returns status ok with dev user info', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toBe('project_manager');
  });

  test('GET /api/profiles returns dev profile list', async () => {
    const res = await request(app).get('/api/profiles');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(5);
  });

  test('GET /api/projects lists projects with client and manager metadata', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('title');
    expect(res.body.data[0]).toHaveProperty('client');
  });

  test('GET /api/tasks lists tasks with priority and due date', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('POST /api/tasks/new/conflict-preview detects date overlap for assignee', async () => {
    const res = await request(app)
      .post('/api/tasks/new/conflict-preview')
      .send({
        assignee_id: 'assignee-001',
        start_date: '2026-10-15',
        due_date: '2026-10-25',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hasConflicts).toBe(true);
    expect(res.body.data.conflicts.length).toBeGreaterThan(0);
  });

  test('GET /api/project-requests returns client requests', async () => {
    const res = await request(app)
      .get('/api/project-requests')
      .set('X-Dev-User-Id', 'client-001')
      .set('X-Dev-Role', 'client');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // ── Research Paper Alignment Integration Tests ───────────────────────────────

  test('POST /api/tasks/:id/status rejects invalid transition with HTTP 409 Conflict', async () => {
    // Task 33333333-0000-0000-0000-000000000006 is in 'todo'
    // Attempting direct jump todo → approved must return HTTP 409
    const res = await request(app)
      .post('/api/tasks/33333333-0000-0000-0000-000000000006/status')
      .set('X-Dev-User-Id', 'manager-001')
      .set('X-Dev-Role', 'project_manager')
      .send({ status: 'approved' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Invalid workflow transition/);
  });

  test('POST /api/tasks/:id/status rejects unauthorized role with HTTP 403 Forbidden', async () => {
    // Task 33333333-0000-0000-0000-000000000002 is in 'in_review'
    // Assignee attempting in_review → approved must return HTTP 403
    const res = await request(app)
      .post('/api/tasks/33333333-0000-0000-0000-000000000002/status')
      .set('X-Dev-User-Id', 'assignee-001')
      .set('X-Dev-Role', 'assignee')
      .send({ status: 'approved' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Access denied/);
  });

  test('PATCH /api/tasks/:id rejects unowned task update by assignee with HTTP 403 Forbidden', async () => {
    // Task 33333333-0000-0000-0000-000000000004 is assigned to assignee-002
    // assignee-001 attempting to edit it must be rejected with HTTP 403
    const res = await request(app)
      .patch('/api/tasks/33333333-0000-0000-0000-000000000004')
      .set('X-Dev-User-Id', 'assignee-001')
      .set('X-Dev-Role', 'assignee')
      .send({ description: 'Unauthorized update attempt' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Access denied/);
  });

  test('POST /api/tasks/:id/submissions rejects submission for unowned task with HTTP 403', async () => {
    // Task 33333333-0000-0000-0000-000000000004 belongs to assignee-002
    // assignee-001 attempting to submit must receive HTTP 403
    const res = await request(app)
      .post('/api/tasks/33333333-0000-0000-0000-000000000004/submissions')
      .set('X-Dev-User-Id', 'assignee-001')
      .set('X-Dev-Role', 'assignee')
      .attach('file', Buffer.from('test deliverable'), 'work.zip');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Access denied/);
  });

  test('POST /api/tasks/:id/submissions rejects submission on non-in_progress task with HTTP 409', async () => {
    // Task 33333333-0000-0000-0000-000000000001 is 'approved' (assigned to assignee-001)
    const res = await request(app)
      .post('/api/tasks/33333333-0000-0000-0000-000000000001/submissions')
      .set('X-Dev-User-Id', 'assignee-001')
      .set('X-Dev-Role', 'assignee')
      .attach('file', Buffer.from('test deliverable'), 'work.zip');

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/must be 'in_progress'/);
  });

  test('POST /api/tasks/:id/submissions rejects disallowed file types with HTTP 400', async () => {
    // Uploading an executable (.exe) must return HTTP 400
    const res = await request(app)
      .post('/api/tasks/33333333-0000-0000-0000-000000000003/submissions')
      .set('X-Dev-User-Id', 'assignee-001')
      .set('X-Dev-Role', 'assignee')
      .attach('file', Buffer.from('malicious binary'), 'script.exe');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/File type not permitted/);
  });

  test('POST /api/submissions/:id/reviews rejects stale submission review with HTTP 409 Conflict', async () => {
    const taskId = '33333333-0000-0000-0000-000000000003';

    // 1. Submit v1 while in_progress -> transitions to 'submitted'
    const resSub1 = await request(app)
      .post(`/api/tasks/${taskId}/submissions`)
      .set('X-Dev-User-Id', 'assignee-001')
      .set('X-Dev-Role', 'assignee')
      .attach('file', Buffer.from('v1 content'), 'archive-v1.zip');

    expect(resSub1.status).toBe(201);
    const sub1Id = resSub1.body.data.id;

    // 2. Reviewer starts review: submitted -> in_review
    await request(app)
      .post(`/api/tasks/${taskId}/status`)
      .set('X-Dev-User-Id', 'reviewer-001')
      .set('X-Dev-Role', 'reviewer')
      .send({ status: 'in_review' });

    // 3. Reviewer requests revision: in_review -> revision
    await request(app)
      .post(`/api/tasks/${taskId}/status`)
      .set('X-Dev-User-Id', 'reviewer-001')
      .set('X-Dev-Role', 'reviewer')
      .send({ status: 'revision' });

    // 4. Assignee resumes work: revision -> in_progress
    await request(app)
      .post(`/api/tasks/${taskId}/status`)
      .set('X-Dev-User-Id', 'assignee-001')
      .set('X-Dev-Role', 'assignee')
      .send({ status: 'in_progress' });

    // 5. Assignee submits v2: in_progress -> submitted
    const resSub2 = await request(app)
      .post(`/api/tasks/${taskId}/submissions`)
      .set('X-Dev-User-Id', 'assignee-001')
      .set('X-Dev-Role', 'assignee')
      .attach('file', Buffer.from('v2 content'), 'archive-v2.zip');

    expect(resSub2.status).toBe(201);

    // 6. Reviewer attempts to review stale sub1Id -> Must return HTTP 409 Conflict
    const resReview = await request(app)
      .post(`/api/submissions/${sub1Id}/reviews`)
      .set('X-Dev-User-Id', 'reviewer-001')
      .set('X-Dev-Role', 'reviewer')
      .send({
        decision: 'approved',
        feedback: 'Looks good',
        task_id: taskId,
      });

    expect(resReview.status).toBe(409);
    expect(resReview.body.success).toBe(false);
    expect(resReview.body.error).toMatch(/outdated submission version/);
  });

  test('GET /api/workers returns worker directory with aggregated workload', async () => {
    const res = await request(app).get('/api/workers');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const carol = res.body.data.find((w) => w.id === 'assignee-001');
    expect(carol).toBeDefined();
    expect(carol.role).toBe('assignee');
    expect(carol).toHaveProperty('skills');
    expect(carol).toHaveProperty('availability');
    expect(carol.workload).toHaveProperty('active_tasks_count');
  });

  test('POST /api/tasks rejects scheduling conflict without override with HTTP 409 Conflict', async () => {
    // Task 33333333-0000-0000-0000-000000000002 for assignee-001 has dates: 2026-10-10 to 2026-10-25
    // Attempting to create an overlapping task without override_conflicts must return HTTP 409
    const res = await request(app)
      .post('/api/tasks')
      .set('X-Dev-User-Id', 'manager-001')
      .set('X-Dev-Role', 'project_manager')
      .send({
        project_id: '22222222-0000-0000-0000-000000000001',
        title: 'Conflicting Task Without Override',
        assignee_id: 'assignee-001',
        priority: 'high',
        start_date: '2026-10-15',
        due_date: '2026-10-20',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.hasConflicts).toBe(true);
    expect(res.body.conflicts.length).toBeGreaterThan(0);
  });

  test('POST /api/tasks creates task and records two-way references when override_conflicts is true', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('X-Dev-User-Id', 'manager-001')
      .set('X-Dev-Role', 'project_manager')
      .send({
        project_id: '22222222-0000-0000-0000-000000000001',
        title: 'Conflicting Task With Confirmed Override',
        assignee_id: 'assignee-001',
        priority: 'high',
        start_date: '2026-10-15',
        due_date: '2026-10-20',
        override_conflicts: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.has_conflict_override).toBe(true);
    expect(Array.isArray(res.body.data.conflict_task_ids)).toBe(true);
    expect(res.body.data.conflict_task_ids.length).toBeGreaterThan(0);

    // Verify two-way reference: the conflicting existing task must also have this candidate ID
    const conflictingTaskId = res.body.data.conflict_task_ids[0];
    const resExisting = await request(app).get(`/api/tasks/${conflictingTaskId}`);
    expect(resExisting.status).toBe(200);
    expect(resExisting.body.data.has_conflict_override).toBe(true);
    expect(resExisting.body.data.conflict_task_ids).toContain(res.body.data.id);
  });

  test('GET /api/reviews/pending returns tasks in submitted and in_review status', async () => {
    const res = await request(app)
      .get('/api/reviews/pending')
      .set('X-Dev-User-Id', 'reviewer-001')
      .set('X-Dev-Role', 'reviewer');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
