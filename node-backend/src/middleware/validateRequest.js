import { validationResult, matchedData } from 'express-validator';

/**
 * Ends a validation chain. On failure returns HTTP 400 with per-field messages.
 * On success the request body is REPLACED by the validated/sanitised fields only,
 * so unknown (mass-assignment) properties never reach a controller.
 */
export function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const seen = new Set();
    const details = [];
    for (const e of errors.array()) {
      const key = `${e.path}:${e.msg}`;
      if (seen.has(key)) continue;
      seen.add(key);
      details.push({ field: e.path, message: e.msg });
    }
    return res.status(400).json({ success: false, error: 'Validation failed', details });
  }

  if (req.body && typeof req.body === 'object' && !req.is('multipart/form-data')) {
    req.body = matchedData(req, { locations: ['body'], includeOptionals: false });
  }
  next();
}
