import request from 'supertest';
import app from '../src/app.js';

export const DEMO_PASSWORD = 'TaskOrbit@2026!';

export const USERS = {
  client: 'alice@clientcorp.io',
  manager: 'bob@taskorbit.io',
  carol: 'carol@taskorbit.io', // assignee-001
  dave: 'dave@taskorbit.io', // assignee-002
  reviewer: 'eve@taskorbit.io',
};

export const IDS = {
  project1: '22222222-0000-0000-0000-000000000001',
  project2: '22222222-0000-0000-0000-000000000002',
  taskApproved: '33333333-0000-0000-0000-000000000001', // carol, approved
  taskInReview: '33333333-0000-0000-0000-000000000002', // carol, in_review
  taskInProgress: '33333333-0000-0000-0000-000000000003', // carol, in_progress
  taskSubmitted: '33333333-0000-0000-0000-000000000004', // dave, submitted
  taskRevision: '33333333-0000-0000-0000-000000000005', // dave, revision
  taskTodo: '33333333-0000-0000-0000-000000000006', // dave, todo
  taskDesign: '33333333-0000-0000-0000-000000000007', // carol, in_progress (project 2)
  req1: '11111111-0000-0000-0000-000000000001',
  req2: '11111111-0000-0000-0000-000000000002',
  req3: '11111111-0000-0000-0000-000000000003',
};

/** A tiny but genuine ZIP (end-of-central-directory record). */
export const ZIP_BYTES = Buffer.from([0x50, 0x4b, 0x05, 0x06, ...new Array(18).fill(0)]);
export const PDF_BYTES = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');

/**
 * Signed-in API client. Keeps the session cookie and automatically
 * sends the CSRF token on state-changing calls.
 */
export async function signIn(email, password = DEMO_PASSWORD, extra = {}) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ email, password, ...extra });
  if (res.status !== 200) throw new Error(`login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  const csrf = res.body.data.csrfToken;
  const wrap = (method) => (url) => agent[method](url).set('X-CSRF-Token', csrf);
  return {
    agent,
    csrf,
    user: res.body.data.user,
    loginResponse: res,
    get: (url) => agent.get(url),
    post: wrap('post'),
    patch: wrap('patch'),
    delete: wrap('delete'),
  };
}

export const anonymous = () => request(app);
export { request, app };
