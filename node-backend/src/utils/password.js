import bcrypt from 'bcryptjs';

const COMMON = new Set([
  'password', 'password1', 'password123', 'passw0rd', 'qwerty123', 'letmein123',
  '1234567890', 'admin12345', 'welcome123', 'iloveyou123', 'taskorbit',
]);

const cost = () => (process.env.NODE_ENV === 'test' ? 4 : Number(process.env.BCRYPT_COST || 12));

export const hashPassword = (plain) => bcrypt.hash(plain, cost());

export async function verifyPassword(plain, hash) {
  if (typeof plain !== 'string' || typeof hash !== 'string') return false;
  return bcrypt.compare(plain, hash);
}

/** A valid hash used to equalise timing when the account does not exist. */
export const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-real-password', 4);

/**
 * Password policy. Returns an array of human-readable problems (empty == acceptable).
 */
export function passwordProblems(password, { email = '', name = '' } = {}) {
  const problems = [];
  if (typeof password !== 'string') return ['Password is required'];
  if (password.length < 10) problems.push('Password must be at least 10 characters');
  if (password.length > 128) problems.push('Password must be at most 128 characters');
  if (!/[a-z]/.test(password)) problems.push('Password needs a lowercase letter');
  if (!/[A-Z]/.test(password)) problems.push('Password needs an uppercase letter');
  if (!/\d/.test(password)) problems.push('Password needs a digit');
  if (!/[^A-Za-z0-9]/.test(password)) problems.push('Password needs a symbol');
  if (COMMON.has(password.toLowerCase())) problems.push('Password is too common');
  const local = String(email).split('@')[0].toLowerCase();
  if (local.length >= 3 && password.toLowerCase().includes(local)) {
    problems.push('Password must not contain your e-mail name');
  }
  const first = String(name).trim().split(/\s+/)[0]?.toLowerCase();
  if (first && first.length >= 4 && password.toLowerCase().includes(first)) {
    problems.push('Password must not contain your name');
  }
  return problems;
}
