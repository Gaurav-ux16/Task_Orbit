import { SESSION, allowedOrigins, isProduction } from '../config/env.js';
import { resolveSession } from '../services/authService.js';
import { safeEqual } from '../utils/tokens.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Cookie attributes shared by set/clear so the browser actually removes it. */
export const cookieOptions = (maxAgeMs = null) => ({
  httpOnly: true,
  secure: isProduction(),
  sameSite: process.env.COOKIE_SAMESITE || 'lax',
  path: '/',
  ...(maxAgeMs ? { maxAge: maxAgeMs } : {}),
});

export const setSessionCookie = (res, sid, maxAgeMs) =>
  res.cookie(SESSION.cookieName, sid, cookieOptions(maxAgeMs));

export const clearSessionCookie = (res) =>
  res.clearCookie(SESSION.cookieName, { ...cookieOptions(), maxAge: undefined });

/**
 * Resolves the session cookie (if any) into req.user / req.session.
 * Never trusts client-supplied identity headers.
 */
export async function attachSession(req, res, next) {
  try {
    const sid = req.cookies?.[SESSION.cookieName];
    if (sid) {
      const resolved = await resolveSession(sid);
      if (resolved) {
        req.user = resolved.user;
        req.session = resolved.session;
      } else {
        clearSessionCookie(res);
      }
    }
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required', code: 'UNAUTHENTICATED' });
  }
  next();
}

/** Role guard (RBAC). Always implies authentication. */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required', code: 'UNAUTHENTICATED' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: `Access denied: role '${req.user.role}' cannot perform this action.`,
      code: 'FORBIDDEN',
    });
  }
  next();
};

/**
 * CSRF defence for cookie-authenticated, state-changing requests:
 *  1. If the browser sent an Origin header it must be an allowed origin.
 *  2. A signed-in caller must echo the per-session token in X-CSRF-Token.
 */
export function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.headers.origin;
  if (origin && !allowedOrigins().includes(origin)) {
    return res.status(403).json({ success: false, error: 'Cross-origin request blocked', code: 'BAD_ORIGIN' });
  }

  if (req.session) {
    const token = req.headers['x-csrf-token'];
    if (!safeEqual(typeof token === 'string' ? token : '', req.session.csrf)) {
      return res.status(403).json({ success: false, error: 'Invalid or missing CSRF token', code: 'BAD_CSRF' });
    }
  }
  next();
}
