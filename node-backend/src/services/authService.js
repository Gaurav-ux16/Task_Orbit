import supabase from '../config/supabase.js';
import { SESSION, LOGIN_POLICY } from '../config/env.js';
import { hashPassword, verifyPassword, passwordProblems, DUMMY_HASH } from '../utils/password.js';
import { randomToken, sha256 } from '../utils/tokens.js';
import { audit, fingerprint } from '../utils/audit.js';

/** Columns that may ever leave the server for the signed-in user. */
export const SELF_FIELDS = 'id, display_name, role, email, skills, availability';
const AUTH_FIELDS = `${SELF_FIELDS}, password_hash, failed_logins, locked_until`;

const httpError = (status, message, extra = {}) => Object.assign(new Error(message), { status, ...extra });
const policyDetails = (field, problems) => problems.map((message) => ({ field, message }));

export const toSelf = (p) => ({
  id: p.id,
  display_name: p.display_name,
  role: p.role,
  email: p.email,
  skills: p.skills || [],
  availability: p.availability,
});

export const normalizeEmail = (email) => String(email).trim().toLowerCase();

export async function findProfileByEmail(email) {
  const { data } = await supabase
    .from('profiles')
    .select(AUTH_FIELDS)
    .eq('email', normalizeEmail(email))
    .maybeSingle();
  return data || null;
}

/**
 * Creates a user. Public self-registration is always a `client`; staff roles
 * can only be created by a project manager (see userController).
 */
export async function createUser({ email, password, display_name, role = 'client', skills = [] }) {
  const problems = passwordProblems(password, { email, name: display_name });
  if (problems.length) {
    throw httpError(400, 'Password does not meet the policy', { details: policyDetails('password', problems) });
  }

  if (await findProfileByEmail(email)) throw httpError(409, 'An account with this e-mail already exists');

  const password_hash = await hashPassword(password);
  const id = `usr-${randomToken(9)}`;
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id,
      email: normalizeEmail(email),
      display_name,
      role,
      skills,
      availability: 'available',
      password_hash,
      failed_logins: 0,
      locked_until: null,
    })
    .select(SELF_FIELDS)
    .single();

  if (error) {
    if (error.code === '23505') throw httpError(409, 'An account with this e-mail already exists');
    throw httpError(500, 'Could not create account');
  }
  return data;
}

/** Creates a server-side session; returns raw ids for the cookie + CSRF token. */
export async function createSession(userId, { remember = false, ip = null, userAgent = null } = {}) {
  const sid = randomToken(32);
  const csrf = randomToken(24);
  const now = Date.now();
  const lifetime = remember ? SESSION.rememberMs() : SESSION.absoluteMs();

  const { error } = await supabase.from('sessions').insert({
    user_id: userId,
    token_hash: sha256(sid),
    csrf_token: csrf,
    remember,
    ip,
    user_agent: userAgent ? String(userAgent).slice(0, 255) : null,
    last_seen_at: new Date(now).toISOString(),
    expires_at: new Date(now + lifetime).toISOString(),
  });
  if (error) throw httpError(500, 'Could not start session');

  return { sid, csrf, maxAgeMs: remember ? lifetime : null, expiresAt: new Date(now + lifetime) };
}

export async function login(email, password, ctx = {}) {
  const profile = await findProfileByEmail(email);

  // Always burn a bcrypt comparison so response time does not reveal valid e-mails.
  const hash = profile?.password_hash || DUMMY_HASH;
  const locked = profile?.locked_until && new Date(profile.locked_until) > new Date();

  if (locked) {
    await verifyPassword(password, hash);
    await audit('auth_login_blocked_locked', { actorId: profile.id, details: { ip: ctx.ip } });
    throw httpError(423, 'Account temporarily locked after repeated failed sign-ins. Try again later.');
  }

  const ok = await verifyPassword(password, hash);
  if (!profile || !ok) {
    if (profile) {
      const failures = (profile.failed_logins || 0) + 1;
      const patch = { failed_logins: failures };
      if (failures >= LOGIN_POLICY.maxFailures()) {
        patch.locked_until = new Date(Date.now() + LOGIN_POLICY.lockMs()).toISOString();
        patch.failed_logins = 0;
        await audit('auth_account_locked', { actorId: profile.id, details: { ip: ctx.ip } });
      }
      await supabase.from('profiles').update(patch).eq('id', profile.id);
    }
    await audit('auth_login_failed', {
      actorId: profile?.id ?? null,
      details: { email_fp: fingerprint(email), ip: ctx.ip },
    });
    throw httpError(401, 'Invalid e-mail or password');
  }

  await supabase
    .from('profiles')
    .update({ failed_logins: 0, locked_until: null, last_login_at: new Date().toISOString() })
    .eq('id', profile.id);

  const session = await createSession(profile.id, ctx);
  await audit('auth_login_success', { actorId: profile.id, details: { ip: ctx.ip, remember: Boolean(ctx.remember) } });
  return { user: toSelf(profile), session };
}

/** Resolves a raw session cookie value into { user, session } or null. */
export async function resolveSession(sid) {
  if (!sid || typeof sid !== 'string' || sid.length > 200) return null;

  const { data: row } = await supabase
    .from('sessions')
    .select('id, user_id, csrf_token, remember, last_seen_at, expires_at')
    .eq('token_hash', sha256(sid))
    .maybeSingle();
  if (!row) return null;

  const now = Date.now();
  const expired = new Date(row.expires_at).getTime() <= now;
  const idle = !row.remember && now - new Date(row.last_seen_at).getTime() > SESSION.idleMs();
  if (expired || idle) {
    await supabase.from('sessions').delete().eq('id', row.id);
    return null;
  }

  const { data: profile } = await supabase.from('profiles').select(SELF_FIELDS).eq('id', row.user_id).maybeSingle();
  if (!profile) return null;

  // Sliding idle window; write at most once a minute.
  if (now - new Date(row.last_seen_at).getTime() > 60_000) {
    await supabase.from('sessions').update({ last_seen_at: new Date(now).toISOString() }).eq('id', row.id);
  }

  return {
    user: toSelf(profile),
    session: { id: row.id, csrf: row.csrf_token, remember: row.remember, expiresAt: row.expires_at },
  };
}

export async function destroySession(sid) {
  if (sid) await supabase.from('sessions').delete().eq('token_hash', sha256(sid));
}

export async function destroyAllSessions(userId, exceptSessionId = null) {
  let q = supabase.from('sessions').delete().eq('user_id', userId);
  if (exceptSessionId) q = q.neq('id', exceptSessionId);
  await q;
}

export async function changePassword(userId, currentPassword, newPassword, keepSessionId) {
  const { data: profile } = await supabase.from('profiles').select(AUTH_FIELDS).eq('id', userId).maybeSingle();
  if (!profile || !(await verifyPassword(currentPassword, profile.password_hash))) {
    throw httpError(403, 'Current password is incorrect');
  }
  const problems = passwordProblems(newPassword, { email: profile.email, name: profile.display_name });
  if (problems.length) {
    throw httpError(400, 'Password does not meet the policy', { details: policyDetails('new_password', problems) });
  }
  if (await verifyPassword(newPassword, profile.password_hash)) {
    throw httpError(400, 'New password must differ from the current password');
  }

  await supabase
    .from('profiles')
    .update({ password_hash: await hashPassword(newPassword), updated_at: new Date().toISOString() })
    .eq('id', userId);
  await destroyAllSessions(userId, keepSessionId);
  await audit('auth_password_changed', { actorId: userId });
}
