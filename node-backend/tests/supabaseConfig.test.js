import { signIn, anonymous, USERS } from './helpers.js';
import { isSupabaseConfigured, checkSupabaseConnectivity } from '../src/config/supabase.js';

describe('Supabase backend configuration and connectivity integration', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('isSupabaseConfigured detects valid vs placeholder credentials accurately', () => {
    process.env.SUPABASE_URL = 'https://your-project.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'your-service-role-key-here';
    expect(isSupabaseConfigured()).toBe(false);

    process.env.SUPABASE_URL = 'placeholder';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'placeholder';
    expect(isSupabaseConfigured()).toBe(false);

    process.env.SUPABASE_URL = 'https://ziuwnkdvoabzlmjiwpsi.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-test-key-1234567890';
    expect(isSupabaseConfigured()).toBe(true);
  });

  test('GET /api/supabase/status returns configured status and storage bucket without exposing secret keys', async () => {
    const manager = await signIn(USERS.manager);
    const res = await manager.get('/api/supabase/status');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body).toHaveProperty('configured');
    expect(res.body).toHaveProperty('storageBucket', 'taskorbit-files');
    // Ensure no secret keys leaked in payload
    expect(JSON.stringify(res.body)).not.toContain('eyJ');
    expect(res.body.serviceRoleKey).toBeUndefined();
    expect(res.body.key).toBeUndefined();
  });

  test('GET /api/supabase/connectivity performs safe non-destructive probe', async () => {
    const manager = await signIn(USERS.manager);
    const res = await manager.get('/api/supabase/connectivity');
    // Returns 200 if connected or safely handled, 502 if network/DNS blocked
    expect([200, 502]).toContain(res.status);
    expect(res.body).toHaveProperty('configured');
    expect(res.body).toHaveProperty('connected');
    expect(res.body).toHaveProperty('latencyMs');
    // Ensure no secrets leaked
    expect(JSON.stringify(res.body)).not.toContain('eyJ');
  }, 15000);

  test('diagnostic endpoints require a signed-in project manager', async () => {
    expect((await anonymous().get('/api/supabase/status')).status).toBe(401);
    const carol = await signIn(USERS.carol);
    expect((await carol.get('/api/supabase/connectivity')).status).toBe(403);
  });

  test('checkSupabaseConnectivity reports unconfigured status safely when no credentials present', async () => {
    process.env.SUPABASE_URL = '';
    process.env.SUPABASE_SERVICE_ROLE_KEY = '';
    process.env.SUPABASE_ANON_KEY = '';
    const res = await checkSupabaseConnectivity();
    expect(res.ok).toBe(true);
    expect(res.configured).toBe(false);
    expect(res.connected).toBe(false);
    expect(res.message).toContain('not configured');
  });
});
