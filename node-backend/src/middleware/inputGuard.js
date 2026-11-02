import { scanPayload } from '../utils/sanitize.js';

/**
 * Screens every request container (params, query, body) BEFORE validation and
 * before any controller can persist data. Hostile input => HTTP 400; clean input
 * is trimmed / normalised in place.
 */
export function inputGuard(req, res, next) {
  const violations = [];
  for (const where of ['params', 'query', 'body']) {
    const container = req[where];
    if (container && typeof container === 'object') {
      violations.push(...scanPayload(container, where === 'body' ? '' : where));
    }
  }

  if (violations.length) {
    // Never echo the payload back (avoids reflected XSS in error pages and log forging).
    console.warn(
      `[SECURITY] Rejected input on ${req.method} ${req.path} from ${req.ip}: ` +
      violations.map((v) => `${v.field || '(root)'}=${v.reason}`).join(', ')
    );
    return res.status(400).json({
      success: false,
      error: 'Input rejected: potentially malicious or malformed content detected.',
      details: violations.map((v) => ({ field: v.field || 'body', message: `Rejected (${v.reason})` })),
    });
  }
  next();
}
