import dotenv from 'dotenv';

dotenv.config();

export const isProduction = () => process.env.NODE_ENV === 'production';
export const isTest = () => process.env.NODE_ENV === 'test';

/** Origins allowed to call the API with credentials (cookies). */
export function allowedOrigins() {
  const list = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
  if (!isProduction()) {
    list.push('http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173');
  }
  return [...new Set(list)];
}

export const SESSION = {
  cookieName: 'to_sid',
  idleMs: () => Number(process.env.SESSION_IDLE_MINUTES || 30) * 60_000,
  absoluteMs: () => Number(process.env.SESSION_ABSOLUTE_HOURS || 8) * 3_600_000,
  rememberMs: () => Number(process.env.SESSION_REMEMBER_DAYS || 30) * 86_400_000,
};

export const LOGIN_POLICY = {
  maxFailures: () => Number(process.env.LOGIN_MAX_FAILURES || 5),
  lockMs: () => Number(process.env.LOGIN_LOCK_MINUTES || 15) * 60_000,
};

/** Fail fast on unsafe production configuration. */
export function assertProductionConfig(usingMockDb) {
  if (!isProduction()) return;
  const problems = [];
  if (usingMockDb) problems.push('In-memory mock database must not be used in production (configure Supabase).');
  if (!process.env.FRONTEND_URL) problems.push('FRONTEND_URL must be set to the deployed frontend origin.');
  if (problems.length) {
    throw new Error(`Unsafe production configuration:\n - ${problems.join('\n - ')}`);
  }
}
