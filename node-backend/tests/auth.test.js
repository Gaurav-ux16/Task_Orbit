import request from 'supertest';
import app from '../src/app.js';
import { signIn, anonymous, USERS, DEMO_PASSWORD } from './helpers.js';
import { resetMockStore } from '../src/config/mockSupabase.js';

const cookieOf = (res) => (res.headers['set-cookie'] || []).find((c) => c.startsWith('to_sid='));

describe('Authentication, sessions & cookies', () => {
  beforeEach(() => resetMockStore());

  test('UC-01 login succeeds and issues an HttpOnly SameSite session cookie', async () => {
    const res = await anonymous().post('/api/auth/login').send({ email: USERS.manager, password: DEMO_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('project_manager');
    expect(res.body.data.csrfToken).toBeTruthy();
    // No credential material in the response
    expect(JSON.stringify(res.body)).not.toMatch(/password|hash/i);

    const cookie = cookieOf(res);
    expect(cookie).toBeDefined();
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Path=\//);
    // session cookie (no Max-Age) unless "remember me"
    expect(cookie).not.toMatch(/Max-Age|Expires/i);
  });

  test('remember-me issues a persistent cookie', async () => {
    const res = await anonymous().post('/api/auth/login').send({ email: USERS.manager, password: DEMO_PASSWORD, remember: true });
    expect(cookieOf(res)).toMatch(/Max-Age=\d+|Expires=/i);
  });

  test('wrong password and unknown e-mail give the same generic 401 (no user enumeration)', async () => {
    const a = await anonymous().post('/api/auth/login').send({ email: USERS.manager, password: 'Wrong-Password-1!' });
    const b = await anonymous().post('/api/auth/login').send({ email: 'nobody@example.com', password: 'Wrong-Password-1!' });
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.body.error).toBe(b.body.error);
    expect(cookieOf(a)).toBeUndefined();
  });

  test('account locks after 5 consecutive failures, even for the right password', async () => {
    for (let i = 0; i < 5; i++) {
      await anonymous().post('/api/auth/login').send({ email: USERS.dave, password: 'Wrong-Password-1!' });
    }
    const res = await anonymous().post('/api/auth/login').send({ email: USERS.dave, password: DEMO_PASSWORD });
    expect(res.status).toBe(423);
  });

  test('unauthenticated requests to protected APIs return 401', async () => {
    for (const path of ['/api/projects', '/api/tasks', '/api/workers', '/api/profiles', '/api/reviews/pending', '/api/project-requests']) {
      const res = await anonymous().get(path);
      expect(res.status).toBe(401);
    }
  });

  test('client-supplied identity headers are ignored (no dev bypass)', async () => {
    const res = await anonymous().get('/api/projects').set('X-Dev-User-Id', 'manager-001').set('X-Dev-Role', 'project_manager');
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me returns the session user and CSRF token; 401 when signed out', async () => {
    expect((await anonymous().get('/api/auth/me')).status).toBe(401);
    const c = await signIn(USERS.carol);
    const me = await c.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.user.id).toBe('assignee-001');
    expect(me.body.data.csrfToken).toBe(c.csrf);
  });

  test('logout destroys the server-side session (cookie replay fails)', async () => {
    const c = await signIn(USERS.manager);
    const cookie = cookieOf(c.loginResponse).split(';')[0];
    expect((await request(app).get('/api/projects').set('Cookie', cookie)).status).toBe(200);

    const out = await c.post('/api/auth/logout').send({});
    expect(out.status).toBe(200);
    expect(cookieOf(out)).toMatch(/to_sid=;/);

    // Replaying the old cookie must now fail: the session no longer exists server-side.
    expect((await request(app).get('/api/projects').set('Cookie', cookie)).status).toBe(401);
  });

  test('tampered / random session cookie is rejected', async () => {
    const res = await request(app).get('/api/projects').set('Cookie', 'to_sid=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
    expect(res.status).toBe(401);
  });

  test('registration creates a CLIENT only, ignoring any requested role', async () => {
    const res = await anonymous().post('/api/auth/register').send({
      email: 'new.client@example.com',
      display_name: 'New Client',
      password: 'Str0ng!Passphrase',
      role: 'project_manager',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('client');
    expect(cookieOf(res)).toBeDefined();
  });

  test('registration enforces password policy and unique e-mail', async () => {
    const weak = await anonymous().post('/api/auth/register').send({ email: 'weak@example.com', display_name: 'Weak User', password: 'short' });
    expect(weak.status).toBe(400);
    const nosymbol = await anonymous().post('/api/auth/register').send({ email: 'weak@example.com', display_name: 'Weak User', password: 'Abcdefghij12' });
    expect(nosymbol.status).toBe(400);
    const dup = await anonymous().post('/api/auth/register').send({ email: USERS.client, display_name: 'Dup Person', password: 'Str0ng!Passphrase' });
    expect(dup.status).toBe(409);
  });

  test('change-password revokes other sessions and needs the current password', async () => {
    const a = await signIn(USERS.carol);
    const b = await signIn(USERS.carol);

    const bad = await a.post('/api/auth/change-password').send({ current_password: 'nope-nope-nope', new_password: 'Another!Passw0rd' });
    expect(bad.status).toBe(403);

    const ok = await a.post('/api/auth/change-password').send({ current_password: DEMO_PASSWORD, new_password: 'Another!Passw0rd' });
    expect(ok.status).toBe(200);

    expect((await a.get('/api/auth/me')).status).toBe(200); // current session survives
    expect((await b.get('/api/auth/me')).status).toBe(401); // other session revoked
    await expect(signIn(USERS.carol, DEMO_PASSWORD)).rejects.toThrow();
    await expect(signIn(USERS.carol, 'Another!Passw0rd')).resolves.toBeDefined();
  });

  test('manager can provision staff accounts; non-managers cannot', async () => {
    const payload = { email: 'qa.lead@taskorbit.io', display_name: 'Quinn Lead', role: 'reviewer', password: 'Str0ng!Passphrase', skills: ['QA'] };
    const forbidden = await (await signIn(USERS.carol)).post('/api/users').send(payload);
    expect(forbidden.status).toBe(403);
    const ok = await (await signIn(USERS.manager)).post('/api/users').send(payload);
    expect(ok.status).toBe(201);
    expect(ok.body.data.role).toBe('reviewer');
    expect(ok.body.data.password_hash).toBeUndefined();
    await expect(signIn(payload.email, payload.password)).resolves.toBeDefined();
  });

  test('responses are never cacheable and carry hardening headers', async () => {
    const res = await anonymous().get('/api/health');
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toMatch(/default-src 'none'/);
    expect(res.headers['x-request-id']).toBeTruthy();
  });
});
