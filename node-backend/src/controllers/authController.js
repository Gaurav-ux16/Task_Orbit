import * as auth from '../services/authService.js';
import { SESSION } from '../config/env.js';
import { setSessionCookie, clearSessionCookie } from '../middleware/auth.js';
import { audit } from '../utils/audit.js';

const sessionPayload = (user, csrf, expiresAt) => ({
  success: true,
  data: { user, csrfToken: csrf, expiresAt },
});

/** POST /api/auth/register — public self-service; always creates a CLIENT account. */
export async function register(req, res, next) {
  try {
    const { email, password, display_name } = req.body;
    const user = await auth.createUser({ email, password, display_name, role: 'client' });
    await audit('auth_registered', { actorId: user.id, details: { ip: req.ip } });

    const session = await auth.createSession(user.id, { ip: req.ip, userAgent: req.headers['user-agent'] });
    setSessionCookie(res, session.sid, session.maxAgeMs);
    res.status(201).json(sessionPayload(user, session.csrf, session.expiresAt));
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/login */
export async function login(req, res, next) {
  try {
    const { email, password, remember = false } = req.body;
    const { user, session } = await auth.login(email, password, {
      remember,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    setSessionCookie(res, session.sid, session.maxAgeMs);
    res.json(sessionPayload(user, session.csrf, session.expiresAt));
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/logout — destroys the server-side session and clears the cookie. */
export async function logout(req, res, next) {
  try {
    await auth.destroySession(req.cookies?.[SESSION.cookieName]);
    if (req.user) await audit('auth_logout', { actorId: req.user.id });
    clearSessionCookie(res);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/** GET /api/auth/me — bootstraps the SPA (also returns the CSRF token). */
export function me(req, res) {
  if (!req.user) return res.status(401).json({ success: false, error: 'Not signed in', code: 'UNAUTHENTICATED' });
  res.json(sessionPayload(req.user, req.session.csrf, req.session.expiresAt));
}

/** POST /api/auth/change-password — rotates credentials, revokes all other sessions. */
export async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body;
    await auth.changePassword(req.user.id, current_password, new_password, req.session.id);
    res.json({ success: true, message: 'Password updated. Other sessions were signed out.' });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/logout-all — sign out everywhere. */
export async function logoutAll(req, res, next) {
  try {
    await auth.destroyAllSessions(req.user.id);
    await audit('auth_logout_all', { actorId: req.user.id });
    clearSessionCookie(res);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
