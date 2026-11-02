import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { mockSupabase } from './mockSupabase.js';

dotenv.config();

let serviceRoleClient = null;
let anonClient = null;

/**
 * Checks whether Supabase environment variables are present and not default placeholders.
 */
export function isSupabaseConfigured() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    url !== 'placeholder' &&
    !url.includes('your-project') &&
    key &&
    key !== 'placeholder' &&
    !key.includes('your-service-role-key') &&
    !key.includes('your-anon-key')
  );
}

/**
 * Returns a singleton Supabase client instance.
 * @param {Object} options
 * @param {boolean} options.requireServiceRole - Whether to require privileged service_role access
 */
export function getSupabase({ requireServiceRole = false } = {}) {
  const url = process.env.SUPABASE_URL;
  const key = requireServiceRole
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

  if (!url || !key || url.includes('your-project') || key.includes('your-service-role-key') || key.includes('your-anon-key')) {
    throw new Error(
      `Supabase is not configured. Please set SUPABASE_URL and ${
        requireServiceRole ? 'SUPABASE_SERVICE_ROLE_KEY' : 'SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY'
      } in node-backend/.env`
    );
  }

  if (requireServiceRole) {
    if (!serviceRoleClient) {
      serviceRoleClient = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    }
    return serviceRoleClient;
  }

  if (!anonClient) {
    anonClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return anonClient;
}

/**
 * Performs a live, non-destructive read to verify genuine connectivity to Supabase.
 * Does NOT assume configured: true proves connectivity.
 */
export async function checkSupabaseConnectivity() {
  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      configured: false,
      connected: false,
      latencyMs: 0,
      message: 'Supabase is not configured (missing or placeholder environment variables in node-backend/.env)',
    };
  }

  const startTime = Date.now();
  try {
    const client = getSupabase({ requireServiceRole: true });
    const { error, status } = await client
      .from('projects')
      .select('id')
      .limit(1);

    const latencyMs = Date.now() - startTime;

    if (error) {
      // PGRST205 or 42P01: Table does not exist in schema cache, but connection and auth succeeded!
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return {
          ok: true,
          configured: true,
          connected: true,
          schemaDeployed: false,
          latencyMs,
          httpStatus: status,
          message: 'Successfully reached Supabase PostgREST, but public.projects table is not yet created in the schema cache. Please execute database/schema.sql in the Supabase SQL Editor.',
        };
      }
      return {
        ok: false,
        configured: true,
        connected: false,
        latencyMs,
        httpStatus: status,
        error: error.message || 'PostgREST query error',
        code: error.code || '',
      };
    }

    return {
      ok: true,
      configured: true,
      connected: true,
      schemaDeployed: true,
      latencyMs,
      httpStatus: status,
      message: 'Successfully connected to Supabase PostgreSQL and verified schema accessibility.',
    };
  } catch (err) {
    return {
      ok: false,
      configured: true,
      connected: false,
      latencyMs: Date.now() - startTime,
      error: err.message,
    };
  }
}

// ── Default Client Selection ──────────────────────────────────────────────────
let client;
let mockInUse = false;

const isTestEnv = process.env.NODE_ENV === 'test' && !process.env.TEST_LIVE_SUPABASE;
const useMockFallback = process.env.USE_MOCK_FALLBACK === 'true';

if (isTestEnv) {
  // Isolated test execution using embedded seed store
  client = mockSupabase;
  mockInUse = true;
} else if (useMockFallback) {
  console.log('[TaskOrbit] 🚀 Using embedded in-memory database pre-seeded with database/seed.sql (USE_MOCK_FALLBACK=true).');
  client = mockSupabase;
  mockInUse = true;
} else if (isSupabaseConfigured()) {
  try {
    client = getSupabase({ requireServiceRole: true });
    console.log('[TaskOrbit] Connected to live Supabase project:', process.env.SUPABASE_URL);
  } catch (err) {
    console.warn('[TaskOrbit Warning] Supabase client initialization error:', err.message);
    client = mockSupabase;
  mockInUse = true;
  }
} else {
  console.log('[TaskOrbit] 🚀 Using embedded in-memory database pre-seeded with database/seed.sql.');
  console.log('[TaskOrbit] To connect a live Supabase project, set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in node-backend/.env.');
  client = mockSupabase;
  mockInUse = true;
}

/** True when the embedded demo store (not a real database) is serving requests. */
export const usingMockDatabase = () => mockInUse;

export default client;
