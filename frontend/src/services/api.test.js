import { describe, test, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { store } from '../app/store';
import { login, logout, sessionExpired } from '../features/auth/authSlice';
import { fetchTasks } from '../features/tasks/tasksSlice';

vi.mock('./taskOrbitApi', () => ({
  authApi: { me: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn().mockResolvedValue({}) },
  tasksApi: { list: vi.fn() },
  projectsApi: {}, projectRequestsApi: {}, submissionsApi: {}, reviewsApi: {}, profilesApi: {}, workersApi: {}, usersApi: {},
}));

const signIn = () =>
  store.dispatch({ type: login.fulfilled.type, payload: { user: { id: 'u1', role: 'assignee' }, csrfToken: 'csrf-abc' } });

/** Runs the request interceptors only (no network). */
async function configFor(method) {
  const handler = api.interceptors.request.handlers[0].fulfilled;
  return handler({ method, url: '/api/tasks', headers: {} });
}

describe('HTTP client (sessions, cookies, CSRF)', () => {
  beforeEach(() => {
    store.dispatch(sessionExpired());
    store.dispatch({ type: logout.fulfilled.type });
  });

  test('sends cookies with every request (withCredentials)', () => {
    expect(api.defaults.withCredentials).toBe(true);
  });

  test('never sends the legacy dev-identity headers', async () => {
    signIn();
    const cfg = await configFor('post');
    expect(cfg.headers['X-Dev-User-Id']).toBeUndefined();
    expect(cfg.headers['X-Dev-Role']).toBeUndefined();
  });

  test('adds X-CSRF-Token on state-changing methods when signed in', async () => {
    signIn();
    for (const m of ['post', 'patch', 'delete', 'put']) {
      expect((await configFor(m)).headers['X-CSRF-Token']).toBe('csrf-abc');
    }
  });

  test('does not add the token to GET requests or when signed out', async () => {
    signIn();
    expect((await configFor('get')).headers['X-CSRF-Token']).toBeUndefined();
    store.dispatch({ type: logout.fulfilled.type });
    expect((await configFor('post')).headers['X-CSRF-Token']).toBeUndefined();
  });

  test('a 401 from a business endpoint ends the local session', async () => {
    signIn();
    const onRejected = api.interceptors.response.handlers[0].rejected;
    await expect(onRejected({ response: { status: 401, data: { error: 'Authentication required' } }, config: { url: '/api/tasks' } })).rejects.toBeTruthy();
    expect(store.getState().auth.user).toBeNull();
    expect(store.getState().auth.sessionExpired).toBe(true);
  });

  test('a 401 from the login endpoint itself does NOT trigger session expiry', async () => {
    const onRejected = api.interceptors.response.handlers[0].rejected;
    await expect(onRejected({ response: { status: 401, data: { error: 'Invalid e-mail or password' } }, config: { url: '/api/auth/login' } })).rejects.toMatchObject({
      friendlyMessage: 'Invalid e-mail or password',
    });
    expect(store.getState().auth.sessionExpired).toBe(false);
  });

  test('validation details are folded into the friendly message; 429 is humanised', async () => {
    const onRejected = api.interceptors.response.handlers[0].rejected;
    await expect(
      onRejected({ response: { status: 400, data: { error: 'Validation failed', details: [{ field: 'title', message: 'Title is too short' }] } }, config: { url: '/api/x' } })
    ).rejects.toMatchObject({ friendlyMessage: 'Validation failed: Title is too short' });
    await expect(onRejected({ response: { status: 429, data: {} }, config: { url: '/api/x' } })).rejects.toMatchObject({
      friendlyMessage: expect.stringMatching(/Too many requests/),
    });
  });
});

describe('Store hygiene between users', () => {
  test('logging out wipes cached business data (no leakage to the next user)', async () => {
    signIn();
    store.dispatch({ type: fetchTasks.fulfilled.type, payload: { data: [{ id: 't1', title: 'Secret task' }], meta: { total: 1 } } });
    expect(store.getState().tasks.items).toHaveLength(1);

    store.dispatch({ type: logout.fulfilled.type });
    expect(store.getState().tasks.items).toHaveLength(0);
    expect(store.getState().auth.user).toBeNull();
  });

  test('session expiry also wipes cached data', () => {
    signIn();
    store.dispatch({ type: fetchTasks.fulfilled.type, payload: { data: [{ id: 't1' }], meta: { total: 1 } } });
    store.dispatch(sessionExpired());
    expect(store.getState().tasks.items).toHaveLength(0);
  });
});
